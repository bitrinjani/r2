import { getLogger } from './logger';
import { injectable, inject } from 'inversify';
import * as _ from 'lodash';
import OrderImpl from './OrderImpl';
import {
  ConfigStore,
  SpreadAnalysisResult,
  OrderType,
  QuoteSide,
  OrderSide,
  ActivePairStore,
  Quote,
  OrderPair
} from './types';
import t from './intl';
import { padEnd, hr, delay } from './util';
import symbols from './symbols';
import { fatalErrors } from './constants';
import SingleLegHandler from './SingleLegHandler';
import { findBrokerConfig } from './configUtil';
import QuoteAggregator from './QuoteAggregator';
import PositionService from './PositionService';
import SpreadAnalyzer from './SpreadAnalyzer';
import LimitCheckerFactory from './LimitCheckerFactory';
import BrokerAdapterRouter from './BrokerAdapterRouter';

@injectable()
export default class Arbitrager {
  private readonly log = getLogger(this.constructor.name);
  private lastSpreadAnalysisResult: SpreadAnalysisResult;
  private shouldStop: boolean = false;
  private readonly singleLegHandler: SingleLegHandler;

  // TODO: avoid constructor over-injection
  constructor(
    private readonly quoteAggregator: QuoteAggregator,
    @inject(symbols.ConfigStore) private readonly configStore: ConfigStore,
    private readonly positionService: PositionService,
    private readonly brokerAdapterRouter: BrokerAdapterRouter,
    private readonly spreadAnalyzer: SpreadAnalyzer,
    private readonly limitCheckerFactory: LimitCheckerFactory,
    @inject(symbols.ActivePairStore) private readonly activePairStore: ActivePairStore
  ) {
    const onSingleLegConfig = configStore.config.onSingleLeg;
    this.singleLegHandler = new SingleLegHandler(this.brokerAdapterRouter, onSingleLegConfig);
  }

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
      this.quoteAggregator.onQuoteUpdated = () => Promise.resolve();
    }
    this.log.info('Stopped Arbitrager.');
    this.status = 'Stopped';
  }

  private async quoteUpdated(quotes: Quote[]): Promise<void> {
    if (this.shouldStop) {
      await this.stop();
      return;
    }
    this.positionService.print();
    this.log.info(hr(20) + 'ARBITRAGER' + hr(20));
    await this.arbitrage(quotes);
    this.log.info(hr(50));
  }

  private async arbitrage(quotes: Quote[]): Promise<void> {
    this.status = 'Arbitraging';
    this.log.info(t`LookingForOpportunity`);
    const { config } = this.configStore;

    const closableOrdersKey = await this.findClosable(quotes);
    let spreadAnalysisResult: SpreadAnalysisResult;
    if (closableOrdersKey) {
      spreadAnalysisResult = this.lastSpreadAnalysisResult;
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

    if (!closableOrdersKey) {
      this.printSpreadAnalysisResult(spreadAnalysisResult);
    }

    const limitChecker = this.limitCheckerFactory.create(spreadAnalysisResult, closableOrdersKey);
    const limitCheckResult = limitChecker.check();
    if (!limitCheckResult.success) {
      this.status = limitCheckResult.reason;
      return;
    }

    if (closableOrdersKey) {
      this.log.info(t`FoundClosableOrders`);
      await this.activePairStore.del(closableOrdersKey);
    } else {
      this.log.info(t`FoundArbitrageOppotunity`);
    }
    try {
      const { bestBid, bestAsk, targetVolume } = spreadAnalysisResult;
      const sendTasks = [bestAsk, bestBid].map(q => this.sendOrder(q, targetVolume, OrderType.Limit));
      const orders = await Promise.all(sendTasks);
      this.status = 'Sent';
      await this.checkOrderState(orders, closableOrdersKey);
    } catch (ex) {
      this.log.error(ex.message);
      this.log.debug(ex.stack);
      this.status = 'Order send/refresh failed';
      if (typeof ex.message === 'string' && _.some(fatalErrors, f => (ex.message as string).includes(f))) {
        this.shouldStop = true;
        return;
      }
    }
    this.log.info(t`SleepingAfterSend`, config.sleepAfterSend);
    await delay(config.sleepAfterSend);
  }

  private async checkOrderState(orders: OrderImpl[], closableOrdersKey: string): Promise<void> {
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
        this.log.info(t`BothLegsAreSuccessfullyFilled`);
        if (closableOrdersKey) {
          this.status = 'Closed';
        } else {
          this.status = 'Filled';
          if (orders[0].size === orders[1].size) {
            await this.activePairStore.put(orders as OrderPair);
          }
        }
        this.printProfit(orders);
        break;
      }

      if (i === config.maxRetryCount) {
        this.status = 'MaxRetryCount breached';
        this.log.warn(t`MaxRetryCountReachedCancellingThePendingOrders`);
        const cancelTasks = orders.filter(o => !o.filled).map(o => this.brokerAdapterRouter.cancel(o));
        await Promise.all(cancelTasks);
        if (
          orders.some(o => !o.filled) &&
          _(orders).sumBy(o => o.filledSize * (o.side === OrderSide.Buy ? -1 : 1)) !== 0
        ) {
          const subOrders = await this.singleLegHandler.handle(orders as OrderPair, closableOrdersKey);
          if (subOrders.length !== 0 && subOrders.every(o => o.filled)) {
            this.printProfit(_.concat(orders, subOrders));
          }
        }
        break;
      }
    }
  }

  private calcProfit(orders: OrderImpl[], commission: number) {
    return _(orders).sumBy(o => (o.side === OrderSide.Sell ? 1 : -1) * o.filledNotional) - commission;
  }

  private calcCommissionFromConfig(order: OrderImpl): number {
    const brokerConfig = findBrokerConfig(this.configStore.config, order.broker);
    return OrderImpl.calculateCommission(order.averageFilledPrice, order.filledSize, brokerConfig.commissionPercent);
  }

  private async findClosable(quotes: Quote[]): Promise<string> {
    const { minExitTargetProfit, minExitTargetProfitPercent } = this.configStore.config;
    if (minExitTargetProfit === undefined && minExitTargetProfitPercent === undefined) {
      return '';
    }
    const activePairsMap = await this.activePairStore.getAll();
    this.printActivePairs(activePairsMap.map(kv => kv.value));
    for (const { key, value } of activePairsMap.slice().reverse()) {
      const pair = value;
      try {
        this.log.debug(`Analyzing pair: ${pair}...`);
        const result = await this.spreadAnalyzer.analyze(quotes, this.positionService.positionMap, pair);
        this.log.debug(`pair: ${pair}, result: ${JSON.stringify(result)}.`);
        const { bestBid, bestAsk, targetVolume, targetProfit } = result;
        const targetVolumeNotional = _.mean([bestAsk.price, bestBid.price]) * targetVolume;
        const effectiveMinExitTargetProfit = _.max([
          minExitTargetProfit,
          minExitTargetProfitPercent !== undefined
            ? _.round(minExitTargetProfitPercent / 100 * targetVolumeNotional)
            : Number.MIN_SAFE_INTEGER
        ]) as number;
        this.log.debug(`effectiveMinExitTargetProfit: ${effectiveMinExitTargetProfit}`);
        if (targetProfit >= effectiveMinExitTargetProfit) {
          this.lastSpreadAnalysisResult = result;
          return key;
        }
      } catch (ex) {
        this.log.debug(ex.message);
      }
    }
    return '';
  }

  private async sendOrder(quote: Quote, targetVolume: number, orderType: OrderType): Promise<OrderImpl> {
    this.log.info(t`SendingOrderTargettingQuote`, quote);
    const brokerConfig = findBrokerConfig(this.configStore.config, quote.broker);
    const { cashMarginType, leverageLevel } = brokerConfig;
    const orderSide = quote.side === QuoteSide.Ask ? OrderSide.Buy : OrderSide.Sell;
    const order = new OrderImpl({
      broker: quote.broker,
      side: orderSide,
      size: targetVolume,
      price: quote.price,
      cashMarginType,
      type: orderType,
      leverageLevel
    });
    await this.brokerAdapterRouter.send(order);
    return order;
  }

  private printOrderSummary(orders: OrderImpl[]) {
    orders.forEach(o => {
      if (o.filled) {
        this.log.info(o.toExecSummary());
      } else {
        this.log.warn(o.toExecSummary());
      }
    });
  }

  private printSpreadAnalysisResult(result: SpreadAnalysisResult) {
    const columnWidth = 17;
    this.log.info('%s: %s', padEnd(t`BestAsk`, columnWidth), result.bestAsk.toString());
    this.log.info('%s: %s', padEnd(t`BestBid`, columnWidth), result.bestBid.toString());
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

  private printActivePairs(activePairs: OrderPair[]): void {
    if (activePairs.length === 0) {
      return;
    }
    this.log.info(t`OpenPairs`);
    activePairs.forEach(pair => {
      this.log.info(`[${pair[0].toShortString()}, ${pair[1].toShortString()}]`);
    });
  }

  private printProfit(orders: OrderImpl[]): void {
    const commission = _(orders).sumBy(o => this.calcCommissionFromConfig(o));
    const profit = this.calcProfit(orders, commission);
    this.log.info(t`ProfitIs`, _.round(profit));
    if (commission !== 0) {
      this.log.info(t`CommissionIs`, _.round(commission));
    }
  }
} /* istanbul ignore next */
