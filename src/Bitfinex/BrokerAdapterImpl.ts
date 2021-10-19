import { BrokerAdapter, BrokerConfigType, Order, Quote } from "../types";
import BrokerApi from "./BrokerApi";

export default class BrokerAdapterImpl implements BrokerAdapter {
  // @ts-ignore
  private readonly brokerApi: BrokerApi;
  readonly broker = 'Bitfinex';

  constructor(private readonly config: BrokerConfigType) {
    this.brokerApi = new BrokerApi(this.config.key, this.config.secret);
  }

  send(order: Order): Promise<void> {
    throw new Error("Method not implemented.");
  }
  refresh(order: Order): Promise<void> {
    throw new Error("Method not implemented.");
  }
  cancel(order: Order): Promise<void> {
    throw new Error("Method not implemented.");
  }
  getBtcPosition(): Promise<number> {
    throw new Error("Method not implemented.");
  }
  getPositions?: (() => Promise<Map<string, number>>) | undefined;
  fetchQuotes(): Promise<Quote[]> {
    throw new Error("Method not implemented.");
  }

}