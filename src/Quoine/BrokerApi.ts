import { nonce } from '../util';
import WebClient from '../WebClient';
import {
  SendOrderResponse, SendOrderRequest, CancelOrderResponse,
  OrdersResponse, TradingAccountsResponse, PriceLevelsResponse, TradingAccount
} from './type';
import * as querystring from 'querystring';
import * as jwt from 'jsonwebtoken';

export default class BrokerApi {
  key: string;
  secret: string;
  webClient: WebClient;
  private baseUrl = 'https://api.quoine.com';

  constructor(key: string, secret: string) {
    this.webClient = new WebClient(this.baseUrl);
    this.key = key;
    this.secret = secret;
  }

  async sendOrder(request: SendOrderRequest): Promise<SendOrderResponse> {
    const path = '/orders/';
    return new SendOrderResponse(
      await this.post<SendOrderResponse, SendOrderRequest>(path, request)
    );
  }

  async cancelOrder(id: string): Promise<CancelOrderResponse> {
    const path = `/orders/${id}/cancel`;
    return await this.put<CancelOrderResponse>(path);
  }

  async getOrders(id: string): Promise<OrdersResponse> {
    const path = `/orders/${id}`;
    return new OrdersResponse(await this.get<OrdersResponse>(path)
    );
  }

  async  getTradingAccounts(): Promise<TradingAccountsResponse> {
    const path = '/trading_accounts';
    const response = await this.get<TradingAccountsResponse>(path);
    return response.map(x => new TradingAccount(x));
  }

  async  getPriceLevels(): Promise<PriceLevelsResponse> {
    const path = '/products/5/price_levels';
    return new PriceLevelsResponse(await this.webClient.fetch<PriceLevelsResponse>(path, undefined, false));
  }

  private async  call<R>(path: string, method: string, body: string = ''): Promise<R> {
    const n = nonce();
    const payload = {
      path,
      nonce: n,
      token_id: this.key
    };
    const sign = jwt.sign(payload, this.secret);
    const headers = {
      'Content-Type': 'application/json',
      'X-Quoine-API-Version': '2',
      'X-Quoine-Auth': sign
    };
    const init = { method, headers, body };
    return await this.webClient.fetch<R>(path, init);
  }

  private async post<R, T>(path: string, requestBody: T): Promise<R> {
    const method = 'POST';
    const body = JSON.stringify(requestBody);
    return await this.call<R>(path, method, body);
  }

  private async get<R, T = never>(path: string, requestParam?: T): Promise<R> {
    const method = 'GET';
    let pathWithParam = path;
    if (requestParam) {
      const param = querystring.stringify(requestParam);
      pathWithParam += `?${param}`;
    }
    return await this.call<R>(pathWithParam, method);
  }

  private async put<R>(path: string): Promise<R> {
    const method = 'PUT';
    return await this.call<R>(path, method);
  }
}
