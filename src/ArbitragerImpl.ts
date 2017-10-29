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
    }
    if (this.quoteAggregator.onQuoteUpdated) {
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
    if (targetVolume < config.minSize) {
      this.status = 'Too small volume';
      this.log.info(t('TargetVolumeIsSmallerThanMinSize'));
      return;
    }
    if (targetProfit < config.minTargetProfit) {
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
    this.log.info(t('SendingOrderTargettingQuote'), bestAsk);
    await this.sendOrder(bestAsk, targetVolume, OrderType.Limit);
    this.log.info(t('SendingOrderTargettingQuote'), bestBid);
    await this.sendOrder(bestBid, targetVolume, OrderType.Limit);
    this.status = 'Sent';
    await this.checkOrderState();
    this.log.info(t('SleepingAfterSend'), config.sleepAfterSend);
    this.activeOrders = [];
    await delay(config.sleepAfterSend);
  }

  private printSnapshot(result: SpreadAnalysisResult) {
    this.log.info('%s: %s', padEnd(t('BestAsk'), 17), result.bestAsk); // TODO: fix double printing
    this.log.info('%s: %s', padEnd(t('BestBid'), 17), result.bestBid);
    this.log.info('%s: %s', padEnd(t('Spread'), 17), -result.invertedSpread);
    this.log.info('%s: %s', padEnd(t('AvailableVolume'), 17), result.availableVolume);
    this.log.info('%s: %s', padEnd(t('TargetVolume'), 17), result.targetVolume);
    this.log.info('%s: %s', padEnd(t('ExpectedProfit'), 17), result.targetProfit);
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

      if (buyOrder.status !== OrderStatus.Filled) {
        this.log.warn(t('BuyLegIsNotFilledYetPendingSizeIs'), sellOrder.pendingSize);
      }
      if (sellOrder.status !== OrderStatus.Filled) {
        this.log.warn(t('SellLegIsNotFilledYetPendingSizeIs'), sellOrder.pendingSize);
      }

      if (buyOrder.status === OrderStatus.Filled && sellOrder.status === OrderStatus.Filled) {
        this.status = 'Filled';
        const profit = _.round(sellOrder.filledSize * sellOrder.averageFilledPrice -
          buyOrder.filledSize * buyOrder.averageFilledPrice);
        this.log.info(t('BothLegsAreSuccessfullyFilled'));
        this.log.info(t('BuyFillPriceIs'), buyOrder.averageFilledPrice);
        this.log.info(t('SellFillPriceIs'), sellOrder.averageFilledPrice);
        this.log.info(t('ProfitIs'), profit);
        break;
      }

      if (i === config.maxRetryCount) {
        this.status = 'MaxRetryCount breached';
        this.log.warn(t('MaxRetryCountReachedCancellingThePendingOrders'));
        if (buyOrder.status !== OrderStatus.Filled) {
          await this.brokerAdapterRouter.cancel(buyOrder);
        }
        if (sellOrder.status !== OrderStatus.Filled) {
          await this.brokerAdapterRouter.cancel(sellOrder);
        }
        break;
      }
    }
  }

  private async quoteUpdated(quotes: Quote[]): Promise<void> {
    this.positionService.print();
    this.log.info(hr(20) + 'ARBITRAGER' + hr(20));
    await this.arbitrage(quotes);
    this.log.info(hr(50));
  }

  private async sendOrder(quote: Quote, targetVolume: number, orderType: OrderType): Promise<void> {
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