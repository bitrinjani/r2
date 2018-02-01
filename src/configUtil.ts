import * as path from 'path';
import * as fs from 'fs';
import { ConfigRoot, Broker, BrokerConfig } from './types';
import { readJsonFileSync } from './util';
import * as _ from 'lodash';

const defaultValues = {
  symbol: 'BTC/JPY'
};

export function getConfigRoot(): ConfigRoot {
  let configPath = getConfigPath();
  if (!fs.existsSync(configPath)) {
    configPath = path.join(process.cwd(), path.basename(configPath));
  }
  const config = new ConfigRoot(readJsonFileSync(configPath));
  return _.defaultsDeep({}, config, defaultValues);
}

export function getConfigPath(): string {
  return process.env.NODE_ENV !== 'test' ? `${process.cwd()}/config.json` : `${__dirname}/__tests__/config_test.json`;
}

export function findBrokerConfig(configRoot: ConfigRoot, broker: Broker): BrokerConfig {
  const found = configRoot.brokers.find(brokerConfig => brokerConfig.broker === broker);
  if (found === undefined) {
    throw new Error(`Unabled to find ${broker} in config.`);
  }
  return found;
}
