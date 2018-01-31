import { Broker, BrokerAdapter, BrokerMap, Order, Quote } from './types';
import { getLogger } from '@bitr/logger';
import * as _ from 'lodash';
import { injectable, multiInject } from 'inversify';
import symbols from './symbols';
import BrokerStabilityTracker from './BrokerStabilityTracker';

@injectable()
export default class BrokerAdapterRouter {
  private readonly log = getLogger(this.constructor.name);
  private brokerAdapterMap: BrokerMap<BrokerAdapter>;

  constructor(
    @multiInject(symbols.BrokerAdapter) brokerAdapters: BrokerAdapter[],
    private readonly brokerStabilityTracker: BrokerStabilityTracker
  ) {
    this.brokerAdapterMap = _.keyBy(brokerAdapters, x => x.broker);
  }

  async send(order: Order): Promise<void> {
    this.log.debug(order.toString());
    try {
      await this.brokerAdapterMap[order.broker].send(order);
    } catch (ex) {
      this.brokerStabilityTracker.decrement(order.broker);
      throw ex;
    }
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
    try {
      return await this.brokerAdapterMap[broker].getBtcPosition();
    } catch (ex) {
      this.brokerStabilityTracker.decrement(broker);
      throw ex;
    }
  }

  async fetchQuotes(broker: Broker): Promise<Quote[]> {
    try {
      return await this.brokerAdapterMap[broker].fetchQuotes();
    } catch (ex) {
      this.brokerStabilityTracker.decrement(broker);
      throw ex;
    }
  }
} /* istanbul ignore next */
