import {
  BrokerAdapter, BrokerConfig, ConfigStore, OrderStatus,
  OrderType, OrderSide, CashMarginType, QuoteSide, Broker
} from '../types';
import BrokerApi from './BrokerApi';
import { getLogger } from '../logger';
import { injectable, inject } from 'inversify';
import symbols from '../symbols';
import * as _ from 'lodash';
import Order from '../Order';
import Quote from '../Quote';
import { PriceLevelsResponse, SendOrderRequest, OrdersResponse } from './types';
import Execution from '../Execution';
import { timestampToDate, findBrokerConfig } from '../util';
import Decimal from 'decimal.js';

@injectable()
export default class BrokerAdapterImpl implements BrokerAdapter {
  private readonly brokerApi: BrokerApi;
  private readonly log = getLogger('Quoine.BrokerAdapter');
  private readonly config: BrokerConfig;
  readonly broker = Broker.Quoine;

  constructor( @inject(symbols.ConfigStore) configStore: ConfigStore) {
    this.config = findBrokerConfig(configStore.config, this.broker);
    this.brokerApi = new BrokerApi(this.config.key, this.config.secret);
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
    const accounts = await this.brokerApi.getTradingAccounts();
    const account = _.find(accounts, b => b.currency_pair_code === 'BTCJPY');
    if (!account) {
      throw new Error('Unable to find the account.');
    }
    return account.position;
  }

  async fetchQuotes(): Promise<Quote[]> {
    try {
      const response = await this.brokerApi.getPriceLevels();
      return this.mapToQuote(response);
    } catch (ex) {
      this.log.error(ex.message);
      this.log.debug(ex.stack);
      return [];
    }
  }

  private mapOrderToSendOrderRequest(order: Order): SendOrderRequest {
    let productId: string;
    switch (order.symbol) {
      case 'BTCJPY':
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
    switch (order.cashMarginType) {
      case CashMarginType.Cash:
        orderDirection = undefined;
        break;
      case CashMarginType.NetOut:
        orderDirection = 'netout';
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
        leverage_level: order.leverageLevel
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
    order.executions = _.map(ordersResponse.executions, (x) => {
      const e = new Execution(order);
      e.price = Number(x.price);
      e.size = Number(x.quantity);
      e.execTime = timestampToDate(x.created_at);
      return e;
    });
    order.lastUpdated = new Date();
  }

  private mapToQuote(priceLevelsResponse: PriceLevelsResponse): Quote[] {
    const asks = _(priceLevelsResponse.sell_price_levels)
      .take(100)
      .map(q => new Quote(this.broker, QuoteSide.Ask, Number(q[0]), Number(q[1])))
      .value();
    const bids = _(priceLevelsResponse.buy_price_levels)
      .take(100)
      .map(q => new Quote(this.broker, QuoteSide.Bid, Number(q[0]), Number(q[1])))
      .value();
    return _.concat(asks, bids);
  }
}