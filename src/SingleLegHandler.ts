import {
  OrderPair,
  OnSingleLegConfig,
  ReverseOption,
  ProceedOption,
  OrderSide,
  OrderType,
  BrokerAdapterRouter
} from './types';
import { LOT_MIN_DECIMAL_PLACE } from './constants';
import Order from './Order';
import * as _ from 'lodash';
import { getLogger } from './logger/index';
import t from './intl';
import { delay } from './util';

export default class SingleLegHandler {
  private readonly log = getLogger(this.constructor.name);

  constructor(
    private readonly brokerAdapterRouter: BrokerAdapterRouter,
    private readonly onSingleLegConfig: OnSingleLegConfig
  ) {}

  async handle(orders: OrderPair, exitFlag: Boolean): Promise<Order[]> {
    if (this.onSingleLegConfig === undefined) {
      return [];
    }
    const action = exitFlag ? this.onSingleLegConfig.actionOnExit : this.onSingleLegConfig.action;
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

  private async reverseLeg(orders: OrderPair, options: ReverseOption): Promise<Order[]> {
    const filledLeg = orders.filter(o => o.filled)[0];
    const unfilledLeg = orders.filter(o => !o.filled)[0];
    const sign = filledLeg.side === OrderSide.Buy ? -1 : 1;
    const price = _.round(filledLeg.price * (1 + sign * options.limitMovePercent / 100));
    const size = _.floor(filledLeg.filledSize - unfilledLeg.filledSize, LOT_MIN_DECIMAL_PLACE);
    this.log.info(t`ReverseFilledLeg`, filledLeg.toShortString(), price.toLocaleString(), size);
    const reversalOrder = new Order(
      filledLeg.broker,
      filledLeg.side === OrderSide.Buy ? OrderSide.Sell : OrderSide.Buy,
      size,
      price,
      filledLeg.cashMarginType,
      OrderType.Limit,
      filledLeg.leverageLevel
    );
    await this.sendOrderWithTtl(reversalOrder, options.ttl);
    return [reversalOrder];
  }

  private async proceedLeg(orders: OrderPair, options: ProceedOption): Promise<Order[]> {
    const unfilledLeg = orders.filter(o => !o.filled)[0];
    const sign = unfilledLeg.side === OrderSide.Buy ? 1 : -1;
    const price = _.round(unfilledLeg.price * (1 + sign * options.limitMovePercent / 100));
    const size = _.floor(unfilledLeg.pendingSize, LOT_MIN_DECIMAL_PLACE);
    this.log.info(t`ExecuteUnfilledLeg`, unfilledLeg.toShortString(), price.toLocaleString(), size);
    const proceedOrder = new Order(
      unfilledLeg.broker,
      unfilledLeg.side,
      size,
      price,
      unfilledLeg.cashMarginType,
      OrderType.Limit,
      unfilledLeg.leverageLevel
    );
    await this.sendOrderWithTtl(proceedOrder, options.ttl);
    return [proceedOrder];
  }

  private async sendOrderWithTtl(order: Order, ttl: number) {
    try {
      this.log.info(t`SendingOrderTtl`, ttl);
      await this.brokerAdapterRouter.send(order);
      await delay(ttl);
      await this.brokerAdapterRouter.refresh(order);
      if (order.filled) {
        this.log.info(`${order.toExecSummary()}`);
      } else {
        this.log.info(t`NotFilledTtl`, ttl);
        await this.brokerAdapterRouter.cancel(order);
      }
    } catch (ex) {
      this.log.warn(ex.message);
    }
  }
}
