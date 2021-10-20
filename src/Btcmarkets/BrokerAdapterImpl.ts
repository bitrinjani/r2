import { map } from "lodash";
import { BrokerAdapter, BrokerConfigType, Order, Quote, QuoteSide } from "../types";
import BrokerApi from "./BrokerApi";
import { TRADE_PAIR } from "./types";

export default class BrokerAdapterImpl implements BrokerAdapter {
  private readonly brokerApi: BrokerApi;
  readonly broker = 'Btcmarkets';

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
    const positionMap = new Map<string, number>();
    positionMap.set('BTC', 1);
    positionMap.set('ETH', 5);
    return Promise.resolve(positionMap);
  }
  async fetchQuotes(): Promise<Quote[]> {
    const res = await this.brokerApi.getOrderBook();
    return this.mapOrderBookToQuota(res);
  }

  private mapOrderBookToQuota(orderBook: any): Quote[] {
    switch(this.brokerApi.symbol) {
      case TRADE_PAIR.ETH_BTC:
        const bids = map(orderBook.bids, (order) => {
          return {
            broker: this.broker,
            price: Number(order[0]),
            side: QuoteSide.Bid,
            volume: Number(order[1])
          } as Quote;
        });
        const asks = map(orderBook.asks, (order) => {
          return {
            broker: this.broker,
            price: Number(order[0]),
            side: QuoteSide.Ask,
            volume: Number(order[1])
          } as Quote;
        });
        return [...bids, ...asks];
      default:
        throw new Error('Invalid symbol');
    }
  }
}