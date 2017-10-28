// tslint:disable-next-line:import-name
import fetch from 'node-fetch';
import { getLogger } from './logger';

export default class WebClient {
  private log = getLogger('WebClient');

  constructor(public baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  async fetch<T>(path: string, init: RequestInit = {}, verbose: boolean = true): Promise<T> {
    const url = this.baseUrl + path;
    this.log.debug(`Sending HTTP request... URL: ${url} Request: ${JSON.stringify(init)}`);
    const res = await fetch(url, init);
    let logText = `Response from ${res.url}. ` +
      `Status Code: ${res.status} (${res.statusText}) `;
    this.log.debug(logText);
    if (!res.ok) {      
      const content = await res.text();
      logText += `Content: ${content}`;
      throw new Error(`HTTP request failed. ${logText}`);
    }
    const t = await res.json() as T;
    if (verbose) {
      this.log.debug(`Response content from ${res.url}: ${JSON.stringify(t)}`);
    }
    return t;
  }
}