import { getLogger } from './logger';
import { injectable, inject } from 'inversify';
import * as _ from 'lodash';
import Order from './Order';
import {
  BrokerAdapterRouter, ConfigStore, PositionService,
  QuoteAggregator, SpreadAnalyzer, Arbitrager, SpreadAnalysisResult,
  OrderType, QuoteSide, OrderSide, LimitCheckerFactory
} from './types';
import intl from './intl';
import { padEnd, hr, delay, calculateCommission, findBrokerConfig } from './util';
import Quote from './Quote';
import symbols from './symbols';
import { LOT_MIN_DECIMAL_PLACE } from './constants';

const t = s => intl.t(s);

@injectable()
export default class ArbitragerImpl implements Arbitrager {
  private log = getLogger(this.constructor.name);
  private activeOrders: Order[] = [];

  constructor(
    @inject(symbols.QuoteAggregator) private readonly quoteAggregator: QuoteAggregator,
    @inject(symbols.ConfigStore) private readonly configStore: ConfigStore,
    @inject(symbols.PositionService) private readonly positionService: PositionService,
    @inject(symbols.BrokerAdapterRouter) private readonly brokerAdapterRouter: BrokerAdapterRouter,
    @inject(symbols.SpreadAnalyzer) private readonly spreadAnalyzer: SpreadAnalyzer,
    @inject(symbols.LimitCheckerFactory) private readonly limitCheckerFactory: LimitCheckerFactory
  ) { }

  status: string = 'Init';

  async start(): Promise<void> {
    this.status = 'Starting';
    this.log.info(t('StartingArbitrager'));
    this.quoteAggregator.onQuoteUpdated = (quotes: Quote[]) => this.quoteUpdated(quotes);
    this.status = 'Started';
    this.log.info(t('StartedArbitrager'));
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
    this.log.info(t('LookingForOpportunity'));
    const { config } = this.configStore;
    let spreadAnalysisResult: SpreadAnalysisResult;
    try {
      spreadAnalysisResult = await this.spreadAnalyzer.analyze(quotes, this.positionService.positionMap);
    } catch (ex) {
      this.status = 'Spread analysis failed';
      this.log.warn(t('FailedToGetASpreadAnalysisResult'), ex.message);
      this.log.debug(ex.stack);
      return;
    }
    this.printSnapshot(spreadAnalysisResult);
    const limitChecker = this.limitCheckerFactory.create(spreadAnalysisResult);
    const limitCheckResult = limitChecker.check();
    if (!limitCheckResult.success) {
      if (limitCheckResult.reason) {
        this.status = limitCheckResult.reason;
      }
      return;
    }
    this.log.info(t('FoundArbitrageOppotunity'));
    try {
      const { bestBid, bestAsk, targetVolume } = spreadAnalysisResult;
      await Promise.all([
        this.sendOrder(bestAsk, targetVolume, OrderType.Limit),
        this.sendOrder(bestBid, targetVolume, OrderType.Limit)
      ]);
      this.status = 'Sent';
      await this.checkOrderState();
    } catch (ex) {
      this.log.error(ex.message);
      this.log.debug(ex.stack);
      this.status = 'Order send/refresh failed';
    }
    this.log.info(t('SleepingAfterSend'), config.sleepAfterSend);
    this.activeOrders = [];
    await delay(config.sleepAfterSend);
  }

  private printSnapshot(result: SpreadAnalysisResult) {
    const columnWidth = 17;
    this.log.info('%s: %s', padEnd(t('BestAsk'), columnWidth), result.bestAsk);
    this.log.info('%s: %s', padEnd(t('BestBid'), columnWidth), result.bestBid);
    this.log.info('%s: %s', padEnd(t('Spread'), columnWidth), -result.invertedSpread);
    this.log.info('%s: %s', padEnd(t('AvailableVolume'), columnWidth), result.availableVolume);
    this.log.info('%s: %s', padEnd(t('TargetVolume'), columnWidth), result.targetVolume);
    const midNotional = _.mean([result.bestAsk.price, result.bestBid.price]) * result.targetVolume;
    const profitPercentAgainstNotional = _.round((result.targetProfit / midNotional) * 100, LOT_MIN_DECIMAL_PLACE);
    this.log.info('%s: %s (%s%%)', padEnd(t('ExpectedProfit'), columnWidth),
      result.targetProfit, profitPercentAgainstNotional);
  }

  private async checkOrderState(): Promise<void> {
    const buyOrder = _.find(this.activeOrders, x => x.side === OrderSide.Buy) as Order;
    const sellOrder = _.find(this.activeOrders, x => x.side === OrderSide.Sell) as Order;
    const { config } = this.configStore;
    for (const i of _.range(1, config.maxRetryCount + 1)) {
      await delay(config.orderStatusCheckInterval);
      this.log.info(t('OrderCheckAttempt'), i);
      this.log.info(t('CheckingIfBothLegsAreDoneOrNot'));
      try {
        await Promise.all([
          this.brokerAdapterRouter.refresh(buyOrder), 
          this.brokerAdapterRouter.refresh(sellOrder)
        ]);
      } catch (ex) {
        this.log.warn(ex.message);
        this.log.debug(ex.stack);
      }

      if (!buyOrder.filled) {
        this.log.warn(t('BuyLegIsNotFilledYetPendingSizeIs'), buyOrder.pendingSize);
      }
      if (!sellOrder.filled) {
        this.log.warn(t('SellLegIsNotFilledYetPendingSizeIs'), sellOrder.pendingSize);
      }

      if (buyOrder.filled && sellOrder.filled) {
        this.status = 'Filled';
        const commission = _([buyOrder, sellOrder]).sumBy(o => this.calculateFilledOrderCommission(o));
        const profit = _.round(sellOrder.filledSize * sellOrder.averageFilledPrice -
          buyOrder.filledSize * buyOrder.averageFilledPrice - commission);
        this.log.info(t('BothLegsAreSuccessfullyFilled'));
        this.log.info(t('BuyFillPriceIs'), _.round(buyOrder.averageFilledPrice));
        this.log.info(t('SellFillPriceIs'), _.round(sellOrder.averageFilledPrice));
        this.log.info(t('ProfitIs'), profit);
        if (commission !== 0) {
          this.log.info(t('CommissionIs'), _.round(commission));
        }
        break;
      }

      if (i === config.maxRetryCount) {
        this.status = 'MaxRetryCount breached';
        this.log.warn(t('MaxRetryCountReachedCancellingThePendingOrders'));
        const promises: Promise<void>[] = [];
        if (!buyOrder.filled) {
          promises.push(this.brokerAdapterRouter.cancel(buyOrder));
        }
        if (!sellOrder.filled) {
          promises.push(this.brokerAdapterRouter.cancel(sellOrder));
        }
        await Promise.all(promises);
        break;
      }
    }
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

  private async sendOrder(quote: Quote, targetVolume: number, orderType: OrderType): Promise<void> {
    this.log.info(t('SendingOrderTargettingQuote'), quote);
    const brokerConfig = findBrokerConfig(this.configStore.config, quote.broker);
    const orderSide = quote.side === QuoteSide.Ask ? OrderSide.Buy : OrderSide.Sell;
    const { cashMarginType, leverageLevel } = brokerConfig;
    const order = new Order(quote.broker, orderSide, targetVolume,
      quote.price, cashMarginType, orderType, leverageLevel);
    await this.brokerAdapterRouter.send(order);
    this.activeOrders.push(order);
  }
}