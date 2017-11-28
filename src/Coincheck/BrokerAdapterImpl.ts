import { getLogger } from '../logger';
import { injectable, inject } from 'inversify';
import { addMinutes } from 'date-fns';
import symbols from '../symbols';
import * as _ from 'lodash';
import Order from '../Order';
import Quote from '../Quote';
import BrokerApi from './BrokerApi';
import Execution from '../Execution';
import {
  CashMarginType, ConfigStore, BrokerConfig, Broker,
  BrokerAdapter, QuoteSide, OrderStatus, OrderSide
} from '../type';
import { OrderBooksResponse, NewOrderRequest, LeveragePosition } from './type';
import { getBrokerOrderType } from './mapper';
import { eRound, almostEqual } from '../util';

@injectable()
export default class BrokerAdapterImpl implements BrokerAdapter {
  private brokerApi: BrokerApi;
  private log = getLogger('Coincheck.BrokerAdapter');
  private config: BrokerConfig;
  broker = Broker.Coincheck;

  constructor(
    @inject(symbols.ConfigStore) configStore: ConfigStore
  ) {
    this.config = _.find(configStore.config.brokers,
      (b: BrokerConfig) => b.broker === this.broker) as BrokerConfig;
    this.brokerApi = new BrokerApi(this.config.key, this.config.secret);
  }

  async getBtcPosition(): Promise<number> {
    if (this.config.cashMarginType === CashMarginType.Cash) {
      return (await this.brokerApi.getAccountsBalance()).btc;
    }
    const positions = await this.brokerApi.getAllOpenLeveragePositions();
    const longPosition = _.sumBy(positions.filter(p => p.side === 'buy'), p => p.amount);
    const shortPosition = _.sumBy(positions.filter(p => p.side === 'sell'), p => p.amount);
    return eRound(longPosition - shortPosition);
  }

  async fetchQuotes(): Promise<Quote[]> {
    try {
      const response = await this.brokerApi.getOrderBooks();
      return this.mapToQuote(response);
    } catch (ex) {
      this.log.error(ex.message);
      this.log.debug(ex.stack);
      return [];
    }
  }

  private mapToQuote(orderBooksResponse: OrderBooksResponse): Quote[] {
    const asks = _(orderBooksResponse.asks)
      .take(100)
      .map(q => new Quote(this.broker, QuoteSide.Ask, q[0], q[1]))
      .value();
    const bids = _(orderBooksResponse.bids)
      .take(100)
      .map(q => new Quote(this.broker, QuoteSide.Bid, q[0], q[1]))
      .value();
    return _.concat(asks, bids);
  }

  async send(order: Order): Promise<void> {
    if (order.broker !== this.broker) {
      throw new Error();
    }
    let request: NewOrderRequest;
    if (order.cashMarginType === CashMarginType.NetOut) {
      request = await this.getNetOutRequest(order);
    } else {
      const orderType = getBrokerOrderType(order);
      request = {
        pair: 'btc_jpy',
        order_type: orderType,
        amount: order.size,
        rate: order.price
      };
    }
    const reply = await this.brokerApi.newOrder(request);
    if (!reply.success) {
      throw new Error('Send failed.');
    }
    order.sentTime = reply.created_at;
    order.status = OrderStatus.New;
    order.brokerOrderId = reply.id;
    order.lastUpdated = new Date();
  }

  private async getNetOutRequest(order: Order): Promise<NewOrderRequest> {
    const openPositions = await this.brokerApi.getAllOpenLeveragePositions();
    const targetSide = order.side === OrderSide.Buy ? 'sell' : 'buy';
    const candidates = _(openPositions)
      .filter(p => p.side === targetSide)
      .filter(p => almostEqual(p.amount, order.size, 1))
      .value();
    const request = { pair: 'btc_jpy', rate: order.price };
    if (candidates.length === 0) {
      return {
        ...request,
        order_type: order.side === OrderSide.Buy ? 'leverage_buy' : 'leverage_sell',
        amount: order.size
      };
    } else {
      const targetPosition = _.last(candidates) as LeveragePosition;
      return {
        ...request,
        order_type: order.side === OrderSide.Buy ? 'close_short' : 'close_long',
        amount: targetPosition.amount,
        position_id: Number(targetPosition.id)
      };
    }
  }

  async cancel(order: Order): Promise<void> {
    const orderId = order.brokerOrderId;
    const reply = await this.brokerApi.cancelOrder(orderId);
    if (!reply.success) {
      throw new Error(`Cancel ${orderId} failed.`);
    }
    order.lastUpdated = new Date();
    order.status = OrderStatus.Canceled;
  }

  async refresh(order: Order): Promise<void> {
    const reply = await this.brokerApi.getOpenOrders();
    const brokerOrder = _.find(reply.orders, o => o.id === order.brokerOrderId);
    if (brokerOrder !== undefined) {
      if (brokerOrder.pending_amount === undefined || brokerOrder.pending_amount === 0) {
        throw new Error('Unexpected reply returned.');
      }
      order.filledSize = eRound(order.size - brokerOrder.pending_amount);
      if (order.filledSize > 0) {
        order.status = OrderStatus.PartiallyFilled;
      }
      order.lastUpdated = new Date();
      return;
    }
    const from = addMinutes(order.creationTime, -1);
    const transactions = (await this.brokerApi.getTransactionsWithStartDate(from))
      .filter(x => x.order_id === order.brokerOrderId);
    if (transactions.length === 0) {
      this.log.warn('The order is not found in pending orders and historical orders.');
      return;
    }
    order.executions = transactions.map((x) => {
      const execution = new Execution(order);
      execution.execTime = x.created_at;
      execution.price = x.rate;
      execution.size = Math.abs(x.funds.btc);
      return execution;
    });
    order.filledSize = eRound(_.sumBy(order.executions, x => x.size));
    order.status = almostEqual(order.filledSize, order.size, 1) ? OrderStatus.Filled : OrderStatus.Canceled;
    order.lastUpdated = new Date();
  }
}