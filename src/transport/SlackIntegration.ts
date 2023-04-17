import type { RequestInit as FetchRequestInit } from "node-fetch";

import fetch from "node-fetch";


export default class SlackIntegration {
  static fetchTimeout = 5000;

  constructor(private readonly config) {
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
      text: message,
      channel: this.config.channel,
      username: this.config.username,
    };
    const init: FetchRequestInit = {
      method: "POST",
      body: JSON.stringify(payload),
      headers: { "Content-Type": "application/json" },
    };
    fetch(this.config.url, init).catch(ex => console.log(ex));
  }
}
