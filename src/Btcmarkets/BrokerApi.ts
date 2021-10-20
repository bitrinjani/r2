import WebClient from "../WebClient";
import { TRADE_PAIR } from "./types";

export default class BrokerApi {
  private readonly _symbol: string;
  private readonly _webClient: WebClient;

  constructor(key: string, secret: string, rootSymbol: string) {
    this._webClient = new WebClient('https://api.btcmarkets.net');
    this._symbol = rootSymbol;
  }

  async getOrderBook() {
    return this._webClient.fetch(`/v3/markets/${this.symbol}/orderbook`);
  }

  get symbol() {
    switch(this._symbol) {
      case 'ETH/BTC':
        return TRADE_PAIR.ETH_BTC;
      default:
        throw new Error('Invalid symbol');
    }
  }
}