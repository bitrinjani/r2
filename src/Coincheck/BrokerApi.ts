import * as _ from 'lodash';
import { hmac, nonce } from '../util';
import WebClient from '../WebClient';
import * as querystring from 'querystring';
import {
  AccountsBalanceResponse, LeveragePositionsRequest, LeveragePositionsResponse,
  LeveragePosition, OrderBooksResponse, NewOrderRequest, NewOrderResponse, 
  CancelOrderResponse, OpenOrdersResponse, TransactionsResponse, Pagination
} from './type';

export default class BrokerApi {
  key: string;
  secret: string;
  webClient: WebClient;
  private baseUrl = 'https://coincheck.com';

  constructor(key: string, secret: string) {
    this.webClient = new WebClient(this.baseUrl);
    this.key = key;
    this.secret = secret;
  }

  async getAccountsBalance(): Promise<AccountsBalanceResponse> {
    const path = '/api/accounts/balance';
    return new AccountsBalanceResponse(await this.get<AccountsBalanceResponse>(path));
  }

  async getOpenOrders(): Promise<OpenOrdersResponse> {
    const path = '/api/exchange/orders/opens';
    return new OpenOrdersResponse(await this.get<OpenOrdersResponse>(path));
  }

  async getLeveragePositions(request?: LeveragePositionsRequest): Promise<LeveragePositionsResponse> {
    const path = '/api/exchange/leverage/positions';
    return new LeveragePositionsResponse(
      await this.get<LeveragePositionsResponse, LeveragePositionsRequest>(path, request)
    );
  }

  async getAllOpenLeveragePositions(limit: number = 20): Promise<LeveragePosition[]> {
    let result: LeveragePosition[] = [];
    const request: LeveragePositionsRequest = { limit, status: 'open',  order: 'desc' };
    let reply = await this.getLeveragePositions(request);
    while (reply.data !== undefined && reply.data.length > 0) {
      result = _.concat(result, reply.data);
      if (reply.data.length < limit) { break; }
      const last = _.last(reply.data) as LeveragePosition;
      reply = await this.getLeveragePositions({ ...request, starting_after: last.id });
    }
    return result;
  }

  async getOrderBooks(): Promise<OrderBooksResponse> {
    const path = '/api/order_books';
    return new OrderBooksResponse(await this.webClient.fetch<OrderBooksResponse>(path, undefined, false));
  }

  async newOrder(request: NewOrderRequest): Promise<NewOrderResponse> {
    const path = '/api/exchange/orders';
    return new NewOrderResponse(await this.post<NewOrderResponse, NewOrderRequest>(path, request));
  }

  async cancelOrder(orderId: string): Promise<CancelOrderResponse> {
    const path = `/api/exchange/orders/${orderId}`;
    return new CancelOrderResponse(await this.delete<CancelOrderResponse>(path));
  }

  async getTransactions(pagination: Partial<Pagination>): Promise<TransactionsResponse> {
    const path = '/api/exchange/orders/transactions_pagination';
    return new TransactionsResponse(
      await this.get<TransactionsResponse, Partial<Pagination>>(path, pagination)
    );
  }

  private call<R>(path: string, method: string, body: string = ''): Promise<R> {
    const n = nonce();
    const url = this.baseUrl + path;
    const message = n + url + body;
    const sign = hmac(this.secret, message);
    const headers = {
      'ACCESS-KEY': this.key,
      'ACCESS-NONCE': n,
      'ACCESS-SIGNATURE': sign
    };
    if (method === 'POST') {
      headers['Content-Type'] = 'application/x-www-form-urlencoded';
    }
    const init = { method, headers, body };
    return this.webClient.fetch<R>(path, init);
  }

  private post<R, T>(path: string, requestBody: T): Promise<R> {
    const method = 'POST';
    const body = querystring.stringify(requestBody);
    return this.call<R>(path, method, body);
  }

  private get<R, T = never>(path: string, requestParam?: T): Promise<R> {
    const method = 'GET';
    let pathWithParam = path;
    if (requestParam) {
      const param = querystring.stringify(requestParam);
      pathWithParam += `?${param}`;
    }
    return this.call<R>(pathWithParam, method);
  }

  private delete<R>(path: string): Promise<R> {
    const method = 'DELETE';
    return this.call<R>(path, method);
  }
}
