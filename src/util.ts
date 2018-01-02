import * as _ from 'lodash';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import * as querystring from 'querystring';
import { ConfigRoot, Broker, BrokerConfig } from './types';

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
  return crypto
    .createHmac(algo, secret)
    .update(text)
    .digest('hex');
}

export function nonce(): string  {
  return (Date.now() * 1000000).toString();
}

export function timestampToDate(n: number): Date {
  return new Date(n * 1000);
}

export function mkdir(dir: string): void {
  try {
    fs.mkdirSync(dir);
  } catch (err) {
    if (err.code !== 'EEXIST') {
      throw err;
    }
  }
}

export function calculateCommission(price: number, volume: number, commissionPercent: number): number {
  return commissionPercent !== undefined ? price * volume * (commissionPercent / 100) : 0;
}

function removeBom(s: string): string {
  return s.charCodeAt(0) === 0xfeff ? s.slice(1) : s;
}

export function readJsonFileSync(filepath: string): any {
  const content = fs.readFileSync(filepath, 'utf-8');
  return JSON.parse(removeBom(content));
}

export function getConfigRoot(): ConfigRoot {
  let configPath =
    process.env.NODE_ENV !== 'test' ? `${__dirname}/config.json` : `${__dirname}/__tests__/config_test.json`;
  if (!fs.existsSync(configPath)) {
    configPath = path.join(process.cwd(), path.basename(configPath));
  }
  return new ConfigRoot(readJsonFileSync(configPath));
}

export function findBrokerConfig(configRoot: ConfigRoot, broker: Broker): BrokerConfig {
  const found = configRoot.brokers.find(brokerConfig => brokerConfig.broker === broker);
  if (found === undefined) {
    throw new Error(`Unabled to find ${broker} in config.`);
  }
  return found;
}

export function safeQueryStringStringify(o: any) {
  const noUndefinedFields = _.pickBy(o, _.negate(_.isUndefined));
  return querystring.stringify(noUndefinedFields);
}

export function revive<T>(T: Function, o: T): T {
  const newObject = Object.create(T.prototype);
  return Object.assign(newObject, o) as T;
}