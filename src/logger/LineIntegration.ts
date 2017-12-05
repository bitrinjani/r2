// tslint:disable:import-name
import fetch from 'node-fetch';
import { LineConfig } from '../type';
import * as querystring from 'querystring';

export default class LineIntegration {
  static fetchTimeout = 5000;
  static apiUrl = 'https://notify-api.line.me/api/notify';

  constructor(private readonly config: LineConfig) {
    this.config = config;
  }

  handler(message: string): void {
    const keywords = this.config.keywords;
    if (!(keywords instanceof Array)) {
      return;
    }
    if (!keywords.some(x => message.includes(x))) {      
      return;
    }
    const payload = {
      message
    };
    const init = {
      method: 'POST',
      body: querystring.stringify(payload),
      headers: {
        Authorization: `Bearer ${this.config.token}`, 
        'Content-Type': 'application/x-www-form-urlencoded' 
      },      
      timeout: LineIntegration.fetchTimeout
    };
    fetch(LineIntegration.apiUrl, init).catch(ex => console.log(ex)); 
  }
}