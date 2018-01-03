import {
  OnSingleLegConfig,
  ReverseOption,
  ProceedOption,
  OrderSide,
  OrderType,
  BrokerAdapterRouter,
  OrderPair
} from './types';
import { LOT_MIN_DECIMAL_PLACE } from './constants';
import OrderImpl from './OrderImpl';
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

  async handle(orders: OrderPair, exitFlag: Boolean): Promise<OrderImpl[]> {
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

  private async reverseLeg(orders: OrderPair, options: ReverseOption): Promise<OrderImpl[]> {
    const smallLeg = orders[0].filledSize <= orders[1].filledSize ? orders[0] : orders[1];
    const largeLeg = orders[0].filledSize <= orders[1].filledSize ? orders[1] : orders[0];
    const sign = largeLeg.side === OrderSide.Buy ? -1 : 1;
    const price = _.round(largeLeg.price * (1 + sign * options.limitMovePercent / 100));
    const size = _.floor(largeLeg.filledSize - smallLeg.filledSize, LOT_MIN_DECIMAL_PLACE);
    this.log.info(t`ReverseFilledLeg`, largeLeg.toShortString(), price.toLocaleString(), size);
    const reversalOrder = new OrderImpl(
      largeLeg.broker,
      largeLeg.side === OrderSide.Buy ? OrderSide.Sell : OrderSide.Buy,
      size,
      price,
      largeLeg.cashMarginType,
      OrderType.Limit,
      largeLeg.leverageLevel
    );
    await this.sendOrderWithTtl(reversalOrder, options.ttl);
    return [reversalOrder];
  }

  private async proceedLeg(orders: OrderPair, options: ProceedOption): Promise<OrderImpl[]> {
    const smallLeg = orders[0].filledSize <= orders[1].filledSize ? orders[0] : orders[1];
    const largeLeg = orders[0].filledSize <= orders[1].filledSize ? orders[1] : orders[0];
    const sign = smallLeg.side === OrderSide.Buy ? 1 : -1;
    const price = _.round(smallLeg.price * (1 + sign * options.limitMovePercent / 100));
    const size = _.floor(smallLeg.pendingSize - largeLeg.pendingSize, LOT_MIN_DECIMAL_PLACE);
    this.log.info(t`ExecuteUnfilledLeg`, smallLeg.toShortString(), price.toLocaleString(), size);
    const proceedOrder = new OrderImpl(
      smallLeg.broker,
      smallLeg.side,
      size,
      price,
      smallLeg.cashMarginType,
      OrderType.Limit,
      smallLeg.leverageLevel
    );
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
