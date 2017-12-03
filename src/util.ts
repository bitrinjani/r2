import * as _ from 'lodash';
import * as crypto from 'crypto';
import * as fs from 'fs';
import { ConfigRoot } from './type';

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

export function eRound(n: number): number {
  return _.round(n, 10);
}

export function almostEqual(a: number, b: number, tolerancePercent: number): boolean {
  return Math.sign(a) === Math.sign(b) && Math.abs(a - b) <= Math.abs(b) * (tolerancePercent / 100);
}

export function delay(time: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, time));
}

export function hmac(secret: string, text: string, algo: string = 'sha256'): string {
  return crypto.createHmac(algo, secret).update(text).digest('hex');
}

export const nonce: () => string = function () {
  let prev = 0;
  return function () {
    const n = Date.now();
    if (n <= prev) {
      prev += 1;
      return prev.toString();
    }     
    prev = n;
    return prev.toString();
  };
}();

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

export function calculateCommission(price: number, volume: number, commissionPercent: number): number {
  return commissionPercent !== undefined ? 
    price * volume * (commissionPercent / 100) : 0;
}

export function readJsonFileSync(filepath: string): any {
  return JSON.parse(fs.readFileSync(filepath, 'utf-8'));
}

export function getConfigRoot() {
  try {
    const configPath = process.env.NODE_ENV !== 'test' ? 
      `${__dirname}/config.json` : `${__dirname}/__tests__/config_test.json`;
    return readJsonFileSync(configPath) as ConfigRoot;
  } catch {
    return undefined;
  }
}