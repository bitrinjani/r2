import { map } from "lodash";
import { BrokerAdapter, BrokerConfigType, Order, Quote, QuoteSide } from "../types";
import BrokerApi from "./BrokerApi";
import { TRADE_PAIR } from "./types";

export default class BrokerAdapterImpl implements BrokerAdapter {
  private readonly brokerApi: BrokerApi;
  readonly broker = 'Bitfinex';

  constructor(private readonly config: BrokerConfigType, rootSymbol: string) {
    this.brokerApi = new BrokerApi(this.config.key, this.config.secret, rootSymbol);
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
  getPositions(): Promise<Map<string, number>> {
    throw new Error('getPositions Method not implemented.');
  }
  async fetchQuotes(): Promise<Quote[]> {
    const res = await this.brokerApi.getOrderBook();
    return this.mapOrderBookToQuota(res);
  }

  private mapOrderBookToQuota(orderBook: any): Quote[] {
    switch(this.brokerApi.symbol) {
      case TRADE_PAIR.tETHBTC:
        return map(orderBook, (order) => {
          const amount = order[2];
          return {
            broker: this.broker,
            price: order[0],
            side: amount > 0 ? QuoteSide.Bid : QuoteSide.Ask,
            volume: Math.abs(amount)
          } as Quote;
        });
      default:
        throw new Error('Invalid symbol');
    }
  }
}