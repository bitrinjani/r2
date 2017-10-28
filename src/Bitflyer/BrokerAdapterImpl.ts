import { BrokerAdapter, BrokerConfig, ConfigStore, OrderStatus, 
  OrderType, TimeInForce, OrderSide, CashMarginType, QuoteSide, Broker 
} from '../type';
import { getLogger } from '../logger';
import { injectable, inject } from 'inversify';
import symbols from '../symbols';
import * as _ from 'lodash';
import Order from '../Order';
import Quote from '../Quote';
import BrokerApi from './BrokerApi';
import { SendChildOrderResponse, ChildOrdersParam, SendChildOrderRequest, 
  ChildOrder, BoardResponse } from './type';
import Execution from '../Execution';

namespace Bitflyer {
  @injectable()
  export class BrokerAdapterImpl implements BrokerAdapter {
    private brokerApi: BrokerApi;
    private log = getLogger('Bitflyer.BrokerAdapter');    
    private config: BrokerConfig;
    broker = Broker.Bitflyer;

    constructor(@inject(symbols.ConfigStore) configStore: ConfigStore) {
      this.config = _.find(configStore.config.brokers,
        (b: BrokerConfig) => b.broker === this.broker) as BrokerConfig;
      this.brokerApi = new BrokerApi(this.config.key, this.config.secret);
    }

    async send(order: Order): Promise<void> {
      if (order.broker !== this.broker) {
        throw new Error();
      }
      const param = this.mapOrderToSendChildOrderRequest(order);
      const reply: SendChildOrderResponse = await this.brokerApi.sendChildOrder(param);
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
      order.executions = _.map(executions, (x) => {
        const e = new Execution(order);
        e.size = x.size;
        e.price = x.price;
        e.execTime = new Date(x.exec_date);
        return e;
      });

      order.lastUpdated = new Date();
    }

    async cancel(order: Order): Promise<void> {
      let productCode = '';
      switch (order.symbol) {
        case 'BTCJPY':
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
      try {
        const response = await this.brokerApi.getBoard();
        return this.mapToQuote(response);
      } catch (ex) {
        this.log.error(ex.message);
        this.log.debug(ex.stack);
        return [];
      }
    }

    private mapOrderToSendChildOrderRequest(order: Order): SendChildOrderRequest {
      if (order.cashMarginType !== CashMarginType.Cash) {
        throw new Error('Not implemented.');
      }

      let productCode = '';
      switch (order.symbol) {
        case 'BTCJPY':
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
        default: throw new Error('Not implemented.');
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
        default: throw new Error('Not implemented.');
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
      order.filledSize = childOrder.executed_size;
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
        .map(q => new Quote(this.broker, QuoteSide.Ask, Number(q.price), Number(q.size)))
        .value();
      const bids = _(boardResponse.bids)
        .take(100)
        .map(q => new Quote(this.broker, QuoteSide.Bid, Number(q.price), Number(q.size)))
        .value();
      return _.concat(asks, bids);
    }
  }
}

export default Bitflyer;