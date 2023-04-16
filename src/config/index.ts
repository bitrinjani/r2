import type { BrokerConfig } from "./type";
import type { Broker } from "../types/common";

import * as fs from "fs";
import * as path from "path";

import stripJsonComments from "strip-json-comments";

import { ConfigRoot } from "./type";

export * from "./type";
export * from "./validator";
export * from "./jsonConfigStore";

export function getConfigRoot(): ConfigRoot {
  const configPath = path.join(process.cwd(), "./config.json");
  if(!fs.existsSync(configPath)){
    console.error("There's no configure file.");
    process.exit(1);
  }
  const config = new ConfigRoot(JSON.parse(
    stripJsonComments(fs.readFileSync(configPath, "utf-8"))));
  return config;
}

export function findBrokerConfig(configRoot: ConfigRoot, broker: Broker): BrokerConfig {
  const found = configRoot.brokers.find(brokerConfig => brokerConfig.broker === broker);
  if(found === undefined){
    throw new Error(`Unable to find ${broker} in config.`);
  }
  return found;
}
