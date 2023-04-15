import type { BrokerConfig } from "./type";
import type { Broker } from "../types/common";

import * as fs from "fs";
import * as path from "path";

import * as _ from "lodash";

import { ConfigRoot } from "./type";

export * from "./type";
import ConfigValidator from "./validator";
export const ConfigValidator = ConfigValidator;

const defaultValues = {
  symbol: "BTC/JPY",
};


export function getConfigRoot(): ConfigRoot {
  const configPath = path.join(process.cwd(), "config.json");
  if(!fs.existsSync(configPath)){
    console.log("There's no configure file.");
  }
  const config = new ConfigRoot(JSON.parse(fs.readFileSync(configPath, "utf-8")));
  return _.defaultsDeep({}, config, defaultValues);
}

export function findBrokerConfig(configRoot: ConfigRoot, broker: Broker): BrokerConfig {
  const found = configRoot.brokers.find(brokerConfig => brokerConfig.broker === broker);
  if(found === undefined){
    throw new Error(`Unable to find ${broker} in config.`);
  }
  return found;
}
