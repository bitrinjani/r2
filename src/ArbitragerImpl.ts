import { getLogger } from './logger';
import { injectable, inject } from 'inversify';
import * as _ from 'lodash';
import Order from './Order';
import {
  BrokerAdapterRouter,
  ConfigStore,
  PositionService,
  QuoteAggregator,
  SpreadAnalyzer,
  Arbitrager,
  SpreadAnalysisResult,
  OrderType,
  QuoteSide,
  OrderSide,
  LimitCheckerFactory,
  OrderPair
} from './types';
import t from './intl';
import { padEnd, hr, delay, calculateCommission, findBrokerConfig } from './util';
import Quote from './Quote';
import symbols from './symbols';

@injectable()
export default class ArbitragerImpl implements Arbitrager {
  private readonly log = getLogger(this.constructor.name);
  private activePairs: OrderPair[] = [];

  constructor(
    @inject(symbols.QuoteAggregator) private readonly quoteAggregator: QuoteAggregator,
    @inject(symbols.ConfigStore) private readonly configStore: ConfigStore,
    @inject(symbols.PositionService) private readonly positionService: PositionService,
    @inject(symbols.BrokerAdapterRouter) private readonly brokerAdapterRouter: BrokerAdapterRouter,
    @inject(symbols.SpreadAnalyzer) private readonly spreadAnalyzer: SpreadAnalyzer,
    @inject(symbols.LimitCheckerFactory) private readonly limitCheckerFactory: LimitCheckerFactory
  ) {}

  status: string = 'Init';

  async start(): Promise<void> {
    this.status = 'Starting';
    this.log.info(t`StartingArbitrager`);
    this.quoteAggregator.onQuoteUpdated = (quotes: Quote[]) => this.quoteUpdated(quotes);
    this.status = 'Started';
    this.log.info(t`StartedArbitrager`);
  }

  async stop(): Promise<void> {
    this.status = 'Stopping';
    this.log.info('Stopping Arbitrager...');
    if (this.quoteAggregator) {
      this.quoteAggregator.onQuoteUpdated = undefined;
    }
    this.log.info('Stopped Arbitrager.');
    this.status = 'Stopped';
  }

  private async arbitrage(quotes: Quote[]): Promise<void> {
    this.status = 'Arbitraging';
    this.log.info(t`LookingForOpportunity`);
    const { config } = this.configStore;
    
    const exitFlag = await this.findClosable(quotes);
    let spreadAnalysisResult;
    if (exitFlag) { 
      if (this.spreadAnalyzer.lastResult === undefined) {
        throw new Error();
      }
      spreadAnalysisResult = this.spreadAnalyzer.lastResult;
    } else {
      try {
        spreadAnalysisResult = await this.spreadAnalyzer.analyze(quotes, this.positionService.positionMap); 
      } catch (ex) {
        this.status = 'Spread analysis failed';
        this.log.warn(t`FailedToGetASpreadAnalysisResult`, ex.message);
        this.log.debug(ex.stack);
        return;
      }
    }
    
    this.printSpreadAnalysisResult(spreadAnalysisResult);
    const limitChecker = this.limitCheckerFactory.create(spreadAnalysisResult, exitFlag);
    const limitCheckResult = limitChecker.check();
    if (!limitCheckResult.success) {
      if (limitCheckResult.reason) {
        this.status = limitCheckResult.reason;
      }
      return;
    }
    this.log.info(t`FoundArbitrageOppotunity`);
    try {
      const { bestBid, bestAsk, targetVolume } = spreadAnalysisResult;
      const sendTasks = [bestAsk, bestBid].map(q => this.sendOrder(q, targetVolume, OrderType.Limit));
      const orders = (await Promise.all(sendTasks)) as OrderPair;
      this.status = 'Sent';
      await this.checkOrderState(orders, exitFlag);
    } catch (ex) {
      this.log.error(ex.message);
      this.log.debug(ex.stack);
      this.status = 'Order send/refresh failed';
    }
    this.log.info(t`SleepingAfterSend`, config.sleepAfterSend);
    await delay(config.sleepAfterSend);
  }

  private printSpreadAnalysisResult(result: SpreadAnalysisResult) {
    const columnWidth = 17;
    this.log.info('%s: %s', padEnd(t`BestAsk`, columnWidth), result.bestAsk);
    this.log.info('%s: %s', padEnd(t`BestBid`, columnWidth), result.bestBid);
    this.log.info('%s: %s', padEnd(t`Spread`, columnWidth), -result.invertedSpread);
    this.log.info('%s: %s', padEnd(t`AvailableVolume`, columnWidth), result.availableVolume);
    this.log.info('%s: %s', padEnd(t`TargetVolume`, columnWidth), result.targetVolume);
    this.log.info(
      '%s: %s (%s%%)',
      padEnd(t`ExpectedProfit`, columnWidth),
      result.targetProfit,
      result.profitPercentAgainstNotional
    );
  }

  private async checkOrderState(orders: OrderPair, exitFlag: boolean = false): Promise<void> {
    const { config } = this.configStore;
    for (const i of _.range(1, config.maxRetryCount + 1)) {
      await delay(config.orderStatusCheckInterval);
      this.log.info(t`OrderCheckAttempt`, i);
      this.log.info(t`CheckingIfBothLegsAreDoneOrNot`);
      try {
        const refreshTasks = orders.map(o => this.brokerAdapterRouter.refresh(o));
        await Promise.all(refreshTasks);
      } catch (ex) {
        this.log.warn(ex.message);
        this.log.debug(ex.stack);
      }

      this.printOrderSummary(orders);

      if (orders.every(o => o.filled)) {
        this.status = 'Filled';
        if (!exitFlag) {
          this.activePairs.push(orders);
        }
        const commission = _(orders).sumBy(o => this.calculateFilledOrderCommission(o));
        const profit = _.round(
          _(orders).sumBy(o => (o.side === OrderSide.Sell ? 1 : -1) * o.filledNotional) - commission
        );
        this.log.info(t`BothLegsAreSuccessfullyFilled`);
        this.log.info(t`ProfitIs`, profit);
        if (commission !== 0) {
          this.log.info(t`CommissionIs`, _.round(commission));
        }
        break;
      }

      if (i === config.maxRetryCount) {
        this.status = 'MaxRetryCount breached';
        this.log.warn(t`MaxRetryCountReachedCancellingThePendingOrders`);
        const cancelTasks = orders.filter(o => !o.filled).map(o => this.brokerAdapterRouter.cancel(o));
        await Promise.all(cancelTasks);
        break;
      }
    }
  }

  private printOrderSummary(orders: Order[]) {
    orders.forEach(o => {
      if (o.filled) {
        this.log.info(o.toSummary());
      } else {
        this.log.warn(o.toSummary());
      }
    });
  }

  private calculateFilledOrderCommission(order: Order): number {
    const brokerConfig = findBrokerConfig(this.configStore.config, order.broker);
    return calculateCommission(order.averageFilledPrice, order.filledSize, brokerConfig.commissionPercent);
  }

  private async quoteUpdated(quotes: Quote[]): Promise<void> {
    this.positionService.print();
    this.log.info(hr(20) + 'ARBITRAGER' + hr(20));
    await this.arbitrage(quotes);
    this.log.info(hr(50));
  }

  private async findClosable(quotes: Quote[]): Promise<boolean> {
    const { config } = this.configStore;
    this.log.debug(`activePairs: ${this.activePairs}`);
    for (const pair of _.reverse(this.activePairs)) {
      try {
        this.log.debug(`Analyzing pair: ${pair}...`);
        const result = await this.spreadAnalyzer.analyze(quotes, this.positionService.positionMap, pair);
        this.log.debug(`pair: ${pair}, result: ${JSON.stringify(result)}.`);
        const { bestBid, bestAsk, targetVolume, targetProfit } = result;
        const targetVolumeNotional = _.mean([bestAsk.price, bestBid.price]) * targetVolume;
        const effectiveMinExitTargetProfit = _.max([
          config.minExitTargetProfit,
          config.minExitTargetProfitPercent !== undefined
            ? _.round(config.minExitTargetProfitPercent / 100 * targetVolumeNotional)
            : Number.MIN_SAFE_INTEGER
        ]) as number;
        this.log.debug(`effectiveMinExitTargetProfit: ${effectiveMinExitTargetProfit}`);
        if (targetProfit >= effectiveMinExitTargetProfit) {
          this.activePairs = _.without(this.activePairs, pair);
          return true;
        }
      } catch (ex) {
        this.log.debug(ex.message);
      }
    }
    return false;
  }

  private async sendOrder(quote: Quote, targetVolume: number, orderType: OrderType): Promise<Order> {
    this.log.info(t`SendingOrderTargettingQuote`, quote);
    const brokerConfig = findBrokerConfig(this.configStore.config, quote.broker);
    const { cashMarginType, leverageLevel } = brokerConfig;
    const orderSide = quote.side === QuoteSide.Ask ? OrderSide.Buy : OrderSide.Sell;
    const order = new Order(
      quote.broker,
      orderSide,
      targetVolume,
      quote.price,
      cashMarginType,
      orderType,
      leverageLevel
    );
    await this.brokerAdapterRouter.send(order);
    return order;
  }
}
