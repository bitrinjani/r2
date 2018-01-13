import { getLogger } from '../logger';
import { addMinutes } from 'date-fns';
import * as _ from 'lodash';
import BrokerApi from './BrokerApi';
import {
  Order,
  Execution,
  CashMarginType,
  BrokerAdapter,
  QuoteSide,
  OrderStatus,
  Quote,
  BrokerConfigType
} from '../types';
import { OrderBooksResponse, CashMarginTypeStrategy } from './types';
import { eRound, almostEqual, toExecution, toQuote } from '../util';
import CashStrategy from './CashStrategy';
import MarginOpenStrategy from './MarginOpenStrategy';
import NetOutStrategy from './NetOutStrategy';

export default class BrokerAdapterImpl implements BrokerAdapter {
  private readonly brokerApi: BrokerApi;
  private readonly log = getLogger('Coincheck.BrokerAdapter');
  readonly broker = 'Coincheck';
  readonly strategyMap: Map<CashMarginType, CashMarginTypeStrategy>;
  
  constructor(private readonly config: BrokerConfigType) {
    this.brokerApi = new BrokerApi(this.config.164K7KQQZ6MQc-t4, this.config.AvI-n7I6IM1pDDSG7Zmhn7nsvYXAwtTe);
    this.strategyMap = new Map<CashMarginType, CashMarginTypeStrategy>([
      [CashMarginType.Cash, new CashStrategy(this.brokerApi)],
      [CashMarginType.MarginOpen, new MarginOpenStrategy(this.brokerApi)],
      [CashMarginType.NetOut, new NetOutStrategy(this.brokerApi)]
    ]);
  }

  async getBtcPosition(): Promise<number> {
    const strategy = this.strategyMap.get(this.config.cashMarginType);
    if (strategy === undefined) {
      throw new Error(`Unable to find a strategy for ${this.config.cashMarginType}.`);
    }
    return await strategy.getBtcPosition();
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
      .map(q => toQuote(this.broker, QuoteSide.Ask, q[0], q[1]))
      .value();
    const bids = _(orderBooksResponse.bids)
      .take(100)
      .map(q => toQuote(this.broker, QuoteSide.Bid, q[0], q[1]))
      .value();
    return _.concat(asks, bids);
  }

  async send(order: Order): Promise<void> {
    if (order.broker !== this.broker) {
      throw new Error();
    }
    const strategy = this.strategyMap.get(order.cashMarginType);
    if (strategy === undefined) {
      throw new Error(`Unable to find a strategy for ${order.cashMarginType}.`);
    }
    await strategy.send(order);
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
    const transactions = (await this.brokerApi.getTransactionsWithStartDate(from)).filter(
      x => x.order_id === order.brokerOrderId
    );
    if (transactions.length === 0) {
      this.log.warn('The order is not found in pending orders and historical orders.');
      return;
    }
    order.executions = transactions.map(x => {
      const execution = toExecution(order);
      execution.execTime = x.created_at;
      execution.price = x.rate;
      execution.size = Math.abs(x.funds.btc);
      return execution as Execution;
    });
    order.filledSize = eRound(_.sumBy(order.executions, x => x.size));
    order.status = almostEqual(order.filledSize, order.size, 1) ? OrderStatus.Filled : OrderStatus.Canceled;
    order.lastUpdated = new Date();
  }
} /* istanbul ignore next */
