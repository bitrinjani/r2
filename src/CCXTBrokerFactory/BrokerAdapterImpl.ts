import { getLogger, Logger } from '@bitr/logger';
import * as ccxt from 'ccxt';
import { map } from 'lodash';
import { BrokerAdapter, BrokerConfigType, Order, Quote, QuoteSide } from "../types";

export default class BrokerAdapterImpl implements BrokerAdapter {
  private readonly brokerApi: ccxt.Exchange;
  private readonly log: Logger;

  constructor(
    public readonly broker: string,
    private readonly symbol: string,
    private readonly config: BrokerConfigType,
  ) {
    this.brokerApi = new ccxt[broker]({
      'apiKey': this.config.key,
      'secret': this.config.secret,
    });
    this.log = getLogger(`${this.broker}.BrokerAdapter`);
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
    this.log.debug(`Sending ${this.broker}.fetchQuotes request...`);
    const res = await this.brokerApi.fetchOrderBook(this.symbol);
    this.log.debug(`Received ${this.broker}.fetchQuotes response, ${JSON.stringify(res)}`);

    const bids = map(res.bids, (order) => {
      return {
        broker: this.broker,
        price: order[0],
        side: QuoteSide.Bid,
        volume: Math.abs(order[1])
      };
    });
    const asks = map(res.asks, (order) => {
      return {
        broker: this.broker,
        price: order[0],
        side: QuoteSide.Ask,
        volume: Math.abs(order[1])
      };
    });

    return [...bids, ...asks];
  }
}