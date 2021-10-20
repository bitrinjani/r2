import { Spot } from '@binance/connector';
import { getLogger } from '@bitr/logger';
import { TRADE_PAIR } from './types';

export default class BrokerApi {
  private readonly log = getLogger('Binance.BrokerApi');
  private readonly _webClient: any;
  private readonly _symbol: string;

  constructor(key: string, secret: string, rootSymbol: string) {
    this._webClient = new Spot(key, secret);
    this._symbol = rootSymbol;
  }

  async getOrderBook() {
    this.log.debug(`Sending Binance[${this.symbol}] order books request...`);
    const res = await this._webClient.depth(this.symbol);
    if (res.status !== 200) {
      throw new Error(`Binance[${this.symbol}] order book request failed`);
    }
    this.log.debug(`Binance[${this.symbol}] order books retrived: ${JSON.stringify(res.data)}`);
    return res.data;
  }

  get symbol() {
    switch(this._symbol) {
      case 'ETH/BTC':
        return TRADE_PAIR.ETHBTC;
      default:
        throw new Error('Invalid symbol');
    }
  }
}