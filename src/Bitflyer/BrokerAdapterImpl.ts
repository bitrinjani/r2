import {
  BrokerAdapter,
  OrderStatus,
  OrderType,
  TimeInForce,
  OrderSide,
  CashMarginType,
  QuoteSide,
  Order,
  Execution,
  Quote,
  BrokerConfigType
} from '../types';
import { getLogger } from '@bitr/logger';
import * as _ from 'lodash';
import BrokerApi from './BrokerApi';
import { ChildOrdersParam, SendChildOrderRequest, ChildOrder, BoardResponse } from './types';
import { eRound, toExecution } from '../util';

export default class BrokerAdapterImpl implements BrokerAdapter {
  private readonly brokerApi: BrokerApi;
  private readonly log = getLogger('Bitflyer.BrokerAdapter');
  readonly broker = 'Bitflyer';

  constructor(private readonly config: BrokerConfigType) {
    this.brokerApi = new BrokerApi(this.config.key, this.config.secret);
  }

  async send(order: Order): Promise<void> {
    if (order.broker !== this.broker) {
      throw new Error();
    }
    const param = this.mapOrderToSendChildOrderRequest(order);
    const reply = await this.brokerApi.sendChildOrder(param);
    order.brokerOrderId = reply.child_order_acceptance_id;
    order.status = OrderStatus.New;
    order.sentTime = new Date();
    order.lastUpdated = new Date();
  }

  async refresh(order: Order): Promise<void> {
    const orderId = order.brokerOrderId;
    const request: ChildOrdersParam = { child_order_acceptance_id: orderId };
    const reply = await this.brokerApi.getChildOrders(request);
    const childOrder = reply[0];
    if (childOrder === undefined) {
      const message = `Unabled to find ${orderId}. GetOrderState failed.`;
      this.log.warn(message);
      return;
    }

    this.setOrderFields(childOrder, order);
    const executions = await this.brokerApi.getExecutions({ child_order_acceptance_id: orderId });
    order.executions = _.map(executions, x => {
      const e = toExecution(order);
      e.size = x.size;
      e.price = x.price;
      e.execTime = new Date(x.exec_date);
      return e as Execution;
    });

    order.lastUpdated = new Date();
  }

  async cancel(order: Order): Promise<void> {
    let productCode = '';
    switch (order.symbol) {
      case 'BTC/JPY':
        productCode = 'BTC_JPY';
        break;
      default:
        throw new Error('Not implemented.');
    }
    const request = { product_code: productCode, child_order_acceptance_id: order.brokerOrderId };
    await this.brokerApi.cancelChildOrder(request);
    order.lastUpdated = new Date();
    order.status = OrderStatus.Canceled;
  }

  async getBtcPosition(): Promise<number> {
    const balanceResponse = await this.brokerApi.getBalance();
    const btcBalance = _.find(balanceResponse, b => b.currency_code === 'BTC');
    if (!btcBalance) {
      throw new Error('Btc balance is not found.');
    }
    return btcBalance.amount;
  }

  async fetchQuotes(): Promise<Quote[]> {
    const response = await this.brokerApi.getBoard();
    return this.mapToQuote(response);
  }

  private mapOrderToSendChildOrderRequest(order: Order): SendChildOrderRequest {
    if (order.cashMarginType !== CashMarginType.Cash) {
      throw new Error('Not implemented.');
    }

    let productCode = '';
    switch (order.symbol) {
      case 'BTC/JPY':
        productCode = 'BTC_JPY';
        break;
      default:
        throw new Error('Not implemented.');
    }

    let price = 0;
    let childOrderType = '';
    switch (order.type) {
      case OrderType.Limit:
        childOrderType = 'LIMIT';
        price = order.price;
        break;
      case OrderType.Market:
        childOrderType = 'MARKET';
        price = 0;
        break;
      default:
        throw new Error('Not implemented.');
    }

    let timeInForce;
    switch (order.timeInForce) {
      case TimeInForce.None:
        timeInForce = '';
        break;
      case TimeInForce.Fok:
        timeInForce = 'FOK';
        break;
      case TimeInForce.Ioc:
        timeInForce = 'IOC';
        break;
      default:
        throw new Error('Not implemented.');
    }

    return {
      price,
      product_code: productCode,
      child_order_type: childOrderType,
      side: OrderSide[order.side].toUpperCase(),
      size: order.size,
      time_in_force: timeInForce
    };
  }

  private setOrderFields(childOrder: ChildOrder, order: Order): void {
    order.filledSize = eRound(childOrder.executed_size);
    if (childOrder.child_order_state === 'CANCELED') {
      order.status = OrderStatus.Canceled;
    } else if (childOrder.child_order_state === 'EXPIRED') {
      order.status = OrderStatus.Expired;
    } else if (order.filledSize === order.size) {
      order.status = OrderStatus.Filled;
    } else if (order.filledSize > 0) {
      order.status = OrderStatus.PartiallyFilled;
    }
    order.lastUpdated = new Date();
  }

  private mapToQuote(boardResponse: BoardResponse): Quote[] {
    const asks = _(boardResponse.asks)
      .take(100)
      .map(q => {
        return { broker: this.broker, side: QuoteSide.Ask, price: Number(q.price), volume: Number(q.size) };
      })
      .value();
    const bids = _(boardResponse.bids)
      .take(100)
      .map(q => {
        return { broker: this.broker, side: QuoteSide.Bid, price: Number(q.price), volume: Number(q.size) };
      })
      .value();
    return _.concat(asks, bids);
  }
} /* istanbul ignore next */
