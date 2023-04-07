import { OnSingleLegConfig, ReverseOption, ProceedOption, OrderSide, OrderType, OrderPair, ConfigStore } from './types';
import { LOT_MIN_DECIMAL_PLACE } from './constants';
import OrderImpl from './orderImpl';
import * as _ from 'lodash';
import { getLogger } from '@bitr/logger';
import t from './i18n';
import { delay, splitSymbol } from './util';
import BrokerAdapterRouter from './brokerAdapterRouter';
import { injectable, inject } from 'inversify';
import symbols from './symbols';
import * as OrderUtil from './orderUtil';

@injectable()
export default class SingleLegHandler {
  private readonly log = getLogger(this.constructor.name);
  private readonly onSingleLegConfig: OnSingleLegConfig;
  private symbol: string;

  constructor(
    private readonly brokerAdapterRouter: BrokerAdapterRouter,
    @inject(symbols.ConfigStore) configStore: ConfigStore
  ) {
    this.onSingleLegConfig = configStore.config.onSingleLeg;
    this.symbol = configStore.config.symbol;
  }

  async handle(orders: OrderPair, closable: boolean): Promise<OrderImpl[]> {
    if (this.onSingleLegConfig === undefined) {
      return [];
    }
    const action = closable ? this.onSingleLegConfig.actionOnExit : this.onSingleLegConfig.action;
    if (action === undefined || action === 'Cancel') {
      return [];
    }
    const { options } = this.onSingleLegConfig;
    switch (action) {
      case 'Reverse':
        return await this.reverseLeg(orders, options as ReverseOption);
      case 'Proceed':
        return await this.proceedLeg(orders, options as ProceedOption);
      default:
        throw new Error('Invalid action.');
    }
  }

  private async reverseLeg(orders: OrderPair, options: ReverseOption): Promise<OrderImpl[]> {
    const smallLeg = orders[0].filledSize <= orders[1].filledSize ? orders[0] : orders[1];
    const largeLeg = orders[0].filledSize <= orders[1].filledSize ? orders[1] : orders[0];
    const sign = largeLeg.side === OrderSide.Buy ? -1 : 1;
    const price = _.round(largeLeg.price * (1 + sign * options.limitMovePercent / 100));
    const size = _.floor(largeLeg.filledSize - smallLeg.filledSize, LOT_MIN_DECIMAL_PLACE);
    const { baseCcy } = splitSymbol(this.symbol);
    this.log.info(t`ReverseFilledLeg`, OrderUtil.toShortString(largeLeg), price.toLocaleString(), size, baseCcy);
    const reversalOrder = new OrderImpl({
      symbol: this.symbol,
      broker: largeLeg.broker,
      side: largeLeg.side === OrderSide.Buy ? OrderSide.Sell : OrderSide.Buy,
      size,
      price,
      cashMarginType: largeLeg.cashMarginType,
      type: OrderType.Limit,
      leverageLevel: largeLeg.leverageLevel
    });
    await this.sendOrderWithTtl(reversalOrder, options.ttl);
    return [reversalOrder];
  }

  private async proceedLeg(orders: OrderPair, options: ProceedOption): Promise<OrderImpl[]> {
    const smallLeg = orders[0].filledSize <= orders[1].filledSize ? orders[0] : orders[1];
    const largeLeg = orders[0].filledSize <= orders[1].filledSize ? orders[1] : orders[0];
    const sign = smallLeg.side === OrderSide.Buy ? 1 : -1;
    const price = _.round(smallLeg.price * (1 + sign * options.limitMovePercent / 100));
    const size = _.floor(smallLeg.pendingSize - largeLeg.pendingSize, LOT_MIN_DECIMAL_PLACE);
    const { baseCcy } = splitSymbol(this.symbol);
    this.log.info(t`ExecuteUnfilledLeg`, OrderUtil.toShortString(smallLeg), price.toLocaleString(), size, baseCcy);
    const proceedOrder = new OrderImpl({
      symbol: this.symbol,
      broker: smallLeg.broker,
      side: smallLeg.side,
      size,
      price,
      cashMarginType: smallLeg.cashMarginType,
      type: OrderType.Limit,
      leverageLevel: smallLeg.leverageLevel
    });
    await this.sendOrderWithTtl(proceedOrder, options.ttl);
    return [proceedOrder];
  }

  private async sendOrderWithTtl(order: OrderImpl, ttl: number) {
    try {
      this.log.info(t`SendingOrderTtl`, ttl);
      await this.brokerAdapterRouter.send(order);
      await delay(ttl);
      await this.brokerAdapterRouter.refresh(order);
      if (order.filled) {
        this.log.info(`${OrderUtil.toExecSummary(order)}`);
      } else {
        this.log.info(t`NotFilledTtl`, ttl);
        await this.brokerAdapterRouter.cancel(order);
      }
    } catch (ex) {
      this.log.warn(ex.message);
    }
  }
} /* istanbul ignore next */
