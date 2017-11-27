import { getLogger } from './logger';
import { injectable, inject } from 'inversify';
import * as _ from 'lodash';
import Order from './Order';
import {
  BrokerAdapterRouter, ConfigStore, PositionService,
  QuoteAggregator, SpreadAnalyzer, Arbitrager, SpreadAnalysisResult,
  OrderType, QuoteSide, OrderSide, OrderStatus, BrokerConfig
} from './type';
import intl from './intl';
import { padEnd, hr, delay } from './util';
import Quote from './Quote';
import symbols from './symbols';

const t = s => intl.t(s);

@injectable()
export default class ArbitragerImpl implements Arbitrager {
  private log = getLogger('Arbitrager');
  private activeOrders: Order[] = [];

  constructor(
    @inject(symbols.QuoteAggregator) readonly quoteAggregator: QuoteAggregator,
    @inject(symbols.ConfigStore) readonly configStore: ConfigStore,
    @inject(symbols.PositionService) readonly positionService: PositionService,
    @inject(symbols.BrokerAdapterRouter) readonly brokerAdapterRouter: BrokerAdapterRouter,
    @inject(symbols.SpreadAnalyzer) readonly spreadAnalyzer: SpreadAnalyzer
  ) { }

  status: string = 'Init';

  async start(): Promise<void> {
    this.status = 'Starting';
    this.log.info(t('StartingArbitrager'));
    this.quoteAggregator.onQuoteUpdated = async (quotes: Quote[]) => await this.quoteUpdated(quotes);
    await this.quoteAggregator.start();
    await this.positionService.start();
    this.status = 'Started';
    this.log.info(t('StartedArbitrager'));
  }

  async stop(): Promise<void> {
    this.status = 'Stopping';
    if (this.positionService) {
      await this.positionService.stop();
    }
    if (this.quoteAggregator) {
      await this.quoteAggregator.stop();
      this.quoteAggregator.onQuoteUpdated = undefined;
    }
    this.status = 'Stopped';
  }

  private async arbitrage(quotes: Quote[]): Promise<void> {
    this.status = 'Arbitraging';
    if (!this.positionService.isStarted) {
      this.status = 'Waiting Position Service';
      this.log.info(t('WaitingForPositionService'));
      return;
    }
    this.log.info(t('LookingForOpportunity'));
    const { config } = this.configStore;
    if (this.isMaxExposureBreached()) {
      this.status = 'Max exposure breached';
      this.log.error(t('NetExposureIsLargerThanMaxNetExposure'));
      return;
    }
    let result: SpreadAnalysisResult;
    try {
      result = await this.spreadAnalyzer.analyze(quotes, this.positionService.positionMap);
    } catch (ex) {
      this.status = 'Spread analysis failed';
      this.log.warn(t('FailedToGetASpreadAnalysisResult'), ex.message);
      this.log.debug(ex.stack);
      return;
    }

    this.printSnapshot(result);
    const { bestBid, bestAsk, invertedSpread,
      targetVolume, targetProfit } = result;
    if (invertedSpread <= 0) {
      this.status = 'Spread not inverted';
      this.log.info(t('NoArbitrageOpportunitySpreadIsNotInverted'));
      return;
    }
    const minTargetProfit = _.max([
      config.minTargetProfit,
      config.minTargetProfitPercent !== undefined ?
        _.round((config.minTargetProfitPercent / 100) * _.mean([bestAsk.price, bestBid.price]) * targetVolume) :
        0
    ]) as number;
    if (targetProfit < minTargetProfit) {
      this.status = 'Too small profit';
      this.log.info(t('TargetProfitIsSmallerThanMinProfit'));
      return;
    }
    if (config.demoMode) {
      this.status = 'Demo mode';
      this.log.info(t('ThisIsDemoModeNotSendingOrders'));
      return;
    }

    this.log.info(t('FoundArbitrageOppotunity'));
    try {
      await this.sendOrder(bestAsk, targetVolume, OrderType.Limit);
      await this.sendOrder(bestBid, targetVolume, OrderType.Limit);
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
    this.log.info('%s: %s', padEnd(t('BestAsk'), 17), result.bestAsk);
    this.log.info('%s: %s', padEnd(t('BestBid'), 17), result.bestBid);
    this.log.info('%s: %s', padEnd(t('Spread'), 17), -result.invertedSpread);
    this.log.info('%s: %s', padEnd(t('AvailableVolume'), 17), result.availableVolume);
    this.log.info('%s: %s', padEnd(t('TargetVolume'), 17), result.targetVolume);
    const midNotional = _.mean([result.bestAsk.price, result.bestBid.price]) * result.targetVolume;
    const profitPercentAgainstNotional = _.round((result.targetProfit / midNotional) * 100, 2);
    this.log.info('%s: %s (%s%%)', padEnd(t('ExpectedProfit'), 17), result.targetProfit, profitPercentAgainstNotional);
  }

  private isMaxExposureBreached(): boolean {
    this.log.debug(`Net exposure ${this.positionService.netExposure}, ` +
      `Max exposure ${this.configStore.config.maxNetExposure}`);
    return Math.abs(this.positionService.netExposure) > this.configStore.config.maxNetExposure;
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
        await this.brokerAdapterRouter.refresh(buyOrder);
        await this.brokerAdapterRouter.refresh(sellOrder);
      } catch (ex) {
        this.log.warn(ex.message);
        this.log.debug(ex.stack);
      }

      if (!this.isFilled(buyOrder)) {
        this.log.warn(t('BuyLegIsNotFilledYetPendingSizeIs'), buyOrder.pendingSize);
      }
      if (!this.isFilled(sellOrder)) {
        this.log.warn(t('SellLegIsNotFilledYetPendingSizeIs'), sellOrder.pendingSize);
      }

      if (this.isFilled(buyOrder) && this.isFilled(sellOrder)) {
        this.status = 'Filled';
        const profit = _.round(sellOrder.filledSize * sellOrder.averageFilledPrice -
          buyOrder.filledSize * buyOrder.averageFilledPrice);
        this.log.info(t('BothLegsAreSuccessfullyFilled'));
        this.log.info(t('BuyFillPriceIs'), _.round(buyOrder.averageFilledPrice));
        this.log.info(t('SellFillPriceIs'), _.round(sellOrder.averageFilledPrice));
        this.log.info(t('ProfitIs'), profit);
        break;
      }

      if (i === config.maxRetryCount) {
        this.status = 'MaxRetryCount breached';
        this.log.warn(t('MaxRetryCountReachedCancellingThePendingOrders'));
        if (!this.isFilled(buyOrder)) {
          await this.brokerAdapterRouter.cancel(buyOrder);
        }
        if (!this.isFilled(sellOrder)) {
          await this.brokerAdapterRouter.cancel(sellOrder);
        }
        break;
      }
    }
  }

  private isFilled(order: Order): boolean {
    return order.status === OrderStatus.Filled;
  }

  private async quoteUpdated(quotes: Quote[]): Promise<void> {
    this.positionService.print();
    this.log.info(hr(20) + 'ARBITRAGER' + hr(20));
    await this.arbitrage(quotes);
    this.log.info(hr(50));
  }

  private async sendOrder(quote: Quote, targetVolume: number, orderType: OrderType): Promise<void> {
    this.log.info(t('SendingOrderTargettingQuote'), quote);
    const brokerConfig = _.find(this.configStore.config.brokers,
      x => x.broker === quote.broker) as BrokerConfig;
    const orderSide = quote.side === QuoteSide.Ask ? OrderSide.Buy : OrderSide.Sell;
    const { cashMarginType, leverageLevel } = brokerConfig;
    const order = new Order(quote.broker, orderSide, targetVolume,
      quote.price, cashMarginType, orderType, leverageLevel);
    await this.brokerAdapterRouter.send(order);
    this.activeOrders.push(order);
  }
}