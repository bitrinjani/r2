import type OrderImpl from "./orderImpl";
import type { Broker, BrokerAdapter, BrokerMap, Order, Quote } from "./types";


import { getLogger } from "@bitr/logger";
import { injectable, multiInject, inject } from "inversify";
import * as _ from "lodash";

import BrokerStabilityTracker from "./brokerStabilityTracker";
import OrderService from "./orderService";
import symbols from "./symbols";
import { ConfigStore } from "./types";

@injectable()
export default class BrokerAdapterRouter {
  private readonly log = getLogger(this.constructor.name);
  private readonly brokerAdapterMap: BrokerMap<BrokerAdapter>;

  constructor(
  @multiInject(symbols.BrokerAdapter) brokerAdapters: BrokerAdapter[],
    private readonly brokerStabilityTracker: BrokerStabilityTracker,
    @inject(symbols.ConfigStore) private readonly configStore: ConfigStore,
    private readonly orderService: OrderService
  ) {
    this.brokerAdapterMap = _.keyBy(brokerAdapters, x => x.broker);
  }

  async send(order: Order): Promise<void> {
    this.log.debug(order.toString());
    try{
      await this.brokerAdapterMap[order.broker].send(order);
      this.orderService.emitOrderUpdated(order as OrderImpl);
    } catch(ex){
      this.brokerStabilityTracker.decrement(order.broker);
      throw ex;
    }
  }

  async cancel(order: Order): Promise<void> {
    this.log.debug(order.toString());
    await this.brokerAdapterMap[order.broker].cancel(order);
    this.orderService.emitOrderUpdated(order as OrderImpl);
  }

  async refresh(order: Order): Promise<void> {
    this.log.debug(order.toString());
    await this.brokerAdapterMap[order.broker].refresh(order);
    this.orderService.emitOrderUpdated(order as OrderImpl);
  }

  async getPositions(broker: Broker): Promise<Map<string, number>> {
    try{
      // for backword compatibility, use getBtcPosition if getPositions is not defined
      if(!_.isFunction(this.brokerAdapterMap[broker].getPositions) && this.configStore.config.symbol === "BTC/JPY"){
        const btcPosition = await this.brokerAdapterMap[broker].getBtcPosition();
        return new Map<string, number>([["BTC", btcPosition]]);
      }
      if(this.brokerAdapterMap[broker].getPositions !== undefined){
        return await (this.brokerAdapterMap[broker].getPositions as () => Promise<Map<string, number>>)();
      }
      throw new Error("Unable to find a method to get positions.");
    } catch(ex){
      this.brokerStabilityTracker.decrement(broker);
      throw ex;
    }
  }

  async fetchQuotes(broker: Broker): Promise<Quote[]> {
    try{
      return await this.brokerAdapterMap[broker].fetchQuotes();
    } catch(ex){
      this.brokerStabilityTracker.decrement(broker);
      this.log.error(ex.message);
      this.log.debug(ex.stack);
      return [];
    }
  }
} /* istanbul ignore next */
