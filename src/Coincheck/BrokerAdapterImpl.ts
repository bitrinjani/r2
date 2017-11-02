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
  BrokerAdapter, QuoteSide, OrderStatus
} from '../type';
import { OrderBooksResponse, NewOrderRequest, Transaction, TransactionsResponse, Pagination } from './type';
import { getBrokerOrderType } from './mapper';
import { eRound } from '../util';

namespace Coincheck {
  @injectable()
  export class BrokerAdapterImpl implements BrokerAdapter {
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

      const orderType = getBrokerOrderType(order);
      const request: NewOrderRequest = {
        pair: 'btc_jpy',
        order_type: orderType,
        amount: order.size,
        rate: order.price
      };
      const reply = await this.brokerApi.newOrder(request);
      if (!reply.success) {
        throw new Error('Send failed.');
      }

      order.sentTime = reply.created_at;
      order.status = OrderStatus.New;
      order.brokerOrderId = reply.id;
      order.lastUpdated = new Date();
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
      const searchAfter = addMinutes(order.creationTime, -1);
      const transactions = (await this.getTransactions(searchAfter)).filter(x => x.order_id === order.brokerOrderId);
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
      order.status = order.filledSize === order.size ? OrderStatus.Filled : OrderStatus.Canceled;
      order.lastUpdated = new Date();
    }

    private async getTransactions(from: Date): Promise<Transaction[]> {
      let transactions: Transaction[] = [];
      const pagination = { order: 'desc', limit: 20 } as Partial<Pagination>;
      let res: TransactionsResponse = await this.brokerApi.getTransactions(pagination);
      while (res.data.length > 0) {
        const last = _.last(res.data) as Transaction;
        transactions = _.concat(transactions, res.data.filter(x => from < x.created_at));
        if (from > last.created_at ||
          res.pagination.limit > res.data.length) {
          break;
        }
        const lastId = last.id;
        res = await this.brokerApi.getTransactions({ ...pagination, starting_after: lastId });
      }
      return transactions;
    }
  }
}

export default Coincheck;