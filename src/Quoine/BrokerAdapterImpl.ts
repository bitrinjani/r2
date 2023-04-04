import {
  BrokerAdapter,
  OrderStatus,
  OrderType,
  OrderSide,
  CashMarginType,
  QuoteSide,
  Order,
  Execution,
  Quote,
  BrokerConfigType
} from '../types';
import BrokerApi from './BrokerApi';
import * as _ from 'lodash';
import { PriceLevelsResponse, SendOrderRequest, OrdersResponse, CashMarginTypeStrategy } from './types';
import { timestampToDate, toExecution, toQuote } from '../util';
import Decimal from 'decimal.js';
import CashStrategy from './CashStrategy';
import NetOutStrategy from './NetOutStrategy';

export default class BrokerAdapterImpl implements BrokerAdapter {
  private readonly brokerApi: BrokerApi;
  readonly broker = 'Quoine';
  readonly strategyMap: Map<CashMarginType, CashMarginTypeStrategy>;

  constructor(private readonly config: BrokerConfigType) {
    this.brokerApi = new BrokerApi(this.config.key, this.config.secret);
    this.strategyMap = new Map<CashMarginType, CashMarginTypeStrategy>([
      [CashMarginType.Cash, new CashStrategy(this.brokerApi)],
      [CashMarginType.NetOut, new NetOutStrategy(this.brokerApi)]
    ]);
  }

  async send(order: Order): Promise<void> {
    if (order.broker !== this.broker) {
      throw new Error();
    }
    const request = this.mapOrderToSendOrderRequest(order);
    const response = await this.brokerApi.sendOrder(request);
    order.brokerOrderId = response.id.toString();
    order.status = OrderStatus.New;
    order.sentTime = new Date();
    order.lastUpdated = new Date();
  }

  async refresh(order: Order): Promise<void> {
    const ordersResponse = await this.brokerApi.getOrders(order.brokerOrderId);
    this.setOrderFields(ordersResponse, order);
  }

  async cancel(order: Order): Promise<void> {
    await this.brokerApi.cancelOrder(order.brokerOrderId);
    order.lastUpdated = new Date();
    order.status = OrderStatus.Canceled;
  }

  async getBtcPosition(): Promise<number> {
    const strategy = this.strategyMap.get(this.config.cashMarginType);
    if (strategy === undefined) {
      throw new Error(`Unable to find a strategy for ${this.config.cashMarginType}.`);
    }
    return await strategy.getBtcPosition();
  }

  async fetchQuotes(): Promise<Quote[]> {
    const response = await this.brokerApi.getPriceLevels();
    return this.mapToQuote(response);
  }

  private mapOrderToSendOrderRequest(order: Order): SendOrderRequest {
    let productId: string;
    switch (order.symbol) {
      case 'BTC/JPY':
        productId = '5';
        break;
      default:
        throw new Error('Not implemented.');
    }

    let orderType: string;
    let price: number = 0;
    switch (order.type) {
      case OrderType.Limit:
        orderType = 'limit';
        price = order.price;
        break;
      case OrderType.Market:
        orderType = 'market';
        price = 0;
        break;
      default:
        throw new Error('Not implemented.');
    }

    let orderDirection: string | undefined;
    let leverageLevel: number | undefined;
    switch (order.cashMarginType) {
      case CashMarginType.Cash:
        orderDirection = undefined;
        leverageLevel = undefined;
        break;
      case CashMarginType.NetOut:
        orderDirection = 'netout';
        leverageLevel = order.leverageLevel;
        break;
      default:
        throw new Error('Not implemented.');
    }

    return {
      order: {
        price,
        product_id: productId,
        order_direction: orderDirection,
        order_type: orderType,
        side: OrderSide[order.side].toLowerCase(),
        quantity: order.size,
        leverage_level: leverageLevel
      }
    };
  }

  private setOrderFields(ordersResponse: OrdersResponse, order: Order) {
    order.brokerOrderId = ordersResponse.id.toString();
    order.filledSize = Number(ordersResponse.filled_quantity);
    order.creationTime = timestampToDate(ordersResponse.created_at);
    if (new Decimal(order.filledSize).eq(order.size)) {
      order.status = OrderStatus.Filled;
    } else if (order.filledSize > 0) {
      order.status = OrderStatus.PartiallyFilled;
    }
    order.executions = _.map(ordersResponse.executions, x => {
      const e = toExecution(order);
      e.price = Number(x.price);
      e.size = Number(x.quantity);
      e.execTime = timestampToDate(x.created_at);
      return e as Execution;
    });
    order.lastUpdated = new Date();
  }

  private mapToQuote(priceLevelsResponse: PriceLevelsResponse): Quote[] {
    const asks = _(priceLevelsResponse.sell_price_levels)
      .take(100)
      .map(q => toQuote(this.broker, QuoteSide.Ask, Number(q[0]), Number(q[1])))
      .value();
    const bids = _(priceLevelsResponse.buy_price_levels)
      .take(100)
      .map(q => toQuote(this.broker, QuoteSide.Bid, Number(q[0]), Number(q[1])))
      .value();
    return _.concat(asks, bids);
  }
} /* istanbul ignore next */
