import { BrokerAdapterRouter, Broker, BrokerAdapter, BrokerMap } from './types';
import { getLogger } from './logger';
import * as _ from 'lodash';
import Order from './Order';
import Quote from './Quote';
import { injectable, multiInject } from 'inversify';
import symbols from './symbols';

@injectable()
export default class BrokerAdapterRouterImpl implements BrokerAdapterRouter {
  private readonly log = getLogger(this.constructor.name);
  private brokerAdapterMap: BrokerMap<BrokerAdapter>;

  constructor(@multiInject(symbols.BrokerAdapter) brokerAdapters: BrokerAdapter[]) {
    this.brokerAdapterMap = _.keyBy(brokerAdapters, x => x.broker);
  }

  async send(order: Order): Promise<void> {
    this.log.debug(order.toString());
    await this.brokerAdapterMap[order.broker].send(order);
  }

  async cancel(order: Order): Promise<void> {
    this.log.debug(order.toString());
    await this.brokerAdapterMap[order.broker].cancel(order);
  }

  async refresh(order: Order): Promise<void> {
    this.log.debug(order.toString());
    await this.brokerAdapterMap[order.broker].refresh(order);
  }

  async getBtcPosition(broker: Broker): Promise<number> {
    return await this.brokerAdapterMap[broker].getBtcPosition();
  }

  async fetchQuotes(broker: Broker): Promise<Quote[]> {
    return await this.brokerAdapterMap[broker].fetchQuotes();
  }
}
