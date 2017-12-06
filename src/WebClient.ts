import fetch, { RequestInit as FetchRequestInit } from 'node-fetch';
import { getLogger } from './logger';

export default class WebClient {
  static fetchTimeout = 5000;
  private log = getLogger('WebClient');

  constructor(public readonly baseUrl: string) { }

  async fetch<T>(
    path: string,
    init: FetchRequestInit = { timeout: WebClient.fetchTimeout },
    verbose: boolean = true
  ): Promise<T> {
    const url = this.baseUrl + path;
    this.log.debug(`Sending HTTP request... URL: ${url} Request: ${JSON.stringify(init)}`);
    const res = await fetch(url, init);
    let logText = `Response from ${res.url}. ` +
      `Status Code: ${res.status} (${res.statusText}) `;
    this.log.debug(logText);
    const content = await res.text();
    if (!res.ok) {
      logText += `Content: ${content}`;
      throw new Error(`HTTP request failed. ${logText}`);
    }
    if (!content) {
      return {} as T;
    }
    const t = JSON.parse(content) as T;
    if (verbose) {
      this.log.debug(`Response content from ${res.url}: ${JSON.stringify(t)}`);
    }
    return t;
  }
}