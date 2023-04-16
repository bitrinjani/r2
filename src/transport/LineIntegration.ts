import type { LineConfig } from "../config";
import type { RequestInit as FetchRequestInit } from "node-fetch";

import * as querystring from "querystring";

import fetch from "node-fetch";


export default class LineIntegration {
  static fetchTimeout = 5000;
  static apiUrl = "https://notify-api.line.me/api/notify";

  constructor(private readonly config: LineConfig) {
    this.config = config;
  }

  handler(message: string): void {
    const keywords = this.config.keywords;
    if(!(keywords instanceof Array)){
      return;
    }
    if(!keywords.some(x => message.includes(x))){
      return;
    }
    const payload = {
      message,
    };
    const body = querystring.stringify(payload);
    const init: FetchRequestInit = {
      body,
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.config.token}`,
        "Content-Type": "application/x-www-form-urlencoded",
        "Content-Length": body.length.toString(),
      },
      timeout: LineIntegration.fetchTimeout,
    };
    fetch(LineIntegration.apiUrl, init)
      .then(res => {
        if(!res.ok){
          res
            .text()
            .catch(e => typeof e === "object" && "message" in e ? e.message : Object.prototype.toString.call(e))
            .then(s => console.log(`LINE notify failed. ${res.statusText}: ${s}`))
            .catch(() => { /* empty */});
        }
      })
      .catch(ex => console.log(`LINE notify failed. ${ex}`));
  }
}
