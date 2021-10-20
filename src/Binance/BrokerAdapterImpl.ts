import { map } from "lodash";
import { BrokerAdapter, BrokerConfigType, Order, Quote, QuoteSide } from "../types";
import BrokerApi from "./BrokerApi";
import { TRADE_PAIR } from "./types";

export default class BrokerAdapterImpl implements BrokerAdapter {
  // @ts-ignore
  private readonly brokerApi: BrokerApi;
  readonly broker = 'Binance';

  constructor(private readonly config: BrokerConfigType, rootSymbol: string) {
    this.brokerApi = new BrokerApi(this.config.key, this.config.secret, rootSymbol);
  }

  send(order: Order): Promise<void> {
    throw new Error("send Method not implemented.");
  }
  refresh(order: Order): Promise<void> {
    throw new Error("refresh Method not implemented.");
  }
  cancel(order: Order): Promise<void> {
    throw new Error("cancel Method not implemented.");
  }
  getBtcPosition(): Promise<number> {
    throw new Error("getBtcPosition Method not implemented.");
  }
  getPositions(): Promise<Map<string, number>> {
    throw new Error('getPositions Method not implemented.');
  }
  async fetchQuotes(): Promise<Quote[]> {
    const orderBook = await this.brokerApi.getOrderBook();
    return this.mapOrderBookToQuota(orderBook);
  }

  private mapOrderBookToQuota(orderBook: any): Quote[] {
    switch(this.brokerApi.symbol) {
      case TRADE_PAIR.ETHBTC:
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