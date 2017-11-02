import * as _ from 'lodash';
import * as crypto from 'crypto';
import * as fs from 'fs';

interface ToStringable {
  toString(): string;
}

export function padStart(s: ToStringable, n: number): string {
  return _.padStart(s.toString(), n);
}

export function padEnd(s: ToStringable, n: number): string {
  return _.padEnd(s.toString(), n);
}

export function hr(width: number): string {
  return _.join(_.times(width, _.constant('-')), '');
}

export function round(n: number): number {
  return _.round(n, 10);
}

export function delay(time: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, time));
}

export function hmac(secret: string, text: string, algo: string = 'sha256'): string {
  return crypto.createHmac(algo, secret).update(text).digest('hex');
}

export function nonce() {
  return Date.now().toString();
}

export function timestampToDate(n: number) {
  return new Date(n * 1000);
}

export function mkdir(dir: string) {
  try {
    fs.mkdirSync(dir);
  } catch (err) {
    if (err.code !== 'EEXIST') {
      throw err;
    }
  }
}
