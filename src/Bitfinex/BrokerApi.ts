import { getLogger } from "@bitr/logger";
import { RESTv2 } from 'bitfinex-api-node';
import { TRADE_PAIR } from "./types";

export default class BrokerApi {
  private readonly log = getLogger('Bitfinex.BrokerApi');
  private readonly _symbol: string;
  private readonly _webClient: any;

  constructor(key: string, secret: string, rootSymbol: string) {
    this._webClient = new RESTv2({
      apiKey: key,
      apiSecret: secret
    });
    this._symbol = rootSymbol;
  }

  async getOrderBook() {
    this.log.debug(`Sending Bitfinex[${this.symbol}] order books request...`);
    const res = await this._webClient.orderBook(this.symbol);
    this.log.debug(`Bitfinex[${this.symbol}] order books retrived: ${JSON.stringify(res)}`);
    return res;
  }

  get symbol() {
    switch(this._symbol) {
      case 'ETH/BTC':
        return TRADE_PAIR.tETHBTC;
      default:
        throw new Error('Invalid symbol');
    }
  }
}