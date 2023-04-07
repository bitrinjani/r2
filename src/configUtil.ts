import * as path from 'path';
import * as fs from 'fs';
import { ConfigRoot, Broker, BrokerConfig } from './types';

import * as _ from 'lodash';

const defaultValues = {
  symbol: 'BTC/JPY'
};

function readJson(filepath: string): any {
  const content = fs.readFileSync(filepath, 'utf-8');
  return JSON.parse(content);
}

export function getConfigRoot(): ConfigRoot {
  let configPath = getConfigPath();
  if (!fs.existsSync(configPath)) {
    configPath = path.join(process.cwd(), path.basename(configPath));
  }
  const config = new ConfigRoot(readJson(configPath));
  return _.defaultsDeep({}, config, defaultValues);
}

export function getConfigPath(): string {
  return process.env.NODE_ENV !== 'test' ? `${process.cwd()}/config.json` : `${__dirname}/__tests__/config_test.json`;
}

export function findBrokerConfig(configRoot: ConfigRoot, broker: Broker): BrokerConfig {
  const found = configRoot.brokers.find(brokerConfig => brokerConfig.broker === broker);
  if (found === undefined) {
    throw new Error(`Unable to find ${broker} in config.`);
  }
  return found;
}
