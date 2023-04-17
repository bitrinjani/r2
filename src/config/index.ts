import type { BrokerConfigType, ConfigRootType } from "./type";
import type { Broker } from "../types/common";
import type { Static } from "@sinclair/typebox";

import * as fs from "fs";
import * as path from "path";

import { TypeCompiler } from "@sinclair/typebox/compiler";
import { Value } from "@sinclair/typebox/value";
import stripJsonComments from "strip-json-comments";

import { ConfigRoot } from "./type";
import { CashMarginType } from "../types/common";

export { AnalyticsConfigType } from "./type";
export * from "./configStore";

const DEVELOPMENT_PHASE = false;

export type FormedBrokerConfigType = Omit<BrokerConfigType, "cashMarginType"> & {
  cashMarginType: CashMarginType,
};
export type FormedConfigRootType = Omit<ConfigRootType, "brokers"> & {
  brokers: FormedBrokerConfigType[],
};

class ConfigLoader {
  protected static _instance: ConfigLoader = null;
  protected _config: FormedConfigRootType = null;
  
  protected constructor(){
    this.load();
  }
  
  static get instance(){
    if(this._instance){
      return this._instance;
    }else{
      return this._instance = new this();
    }
  }
  
  get config(){
    return this._config;
  }

  protected transformBrokerConfig(brokerConfig: BrokerConfigType){
    return {
      ...brokerConfig,
      cashMarginType: CashMarginType[brokerConfig.cashMarginType] || CashMarginType.Cash,
      noTradePeriods: brokerConfig.noTradePeriods || [],
    };
  }
  
  load(){
    const configPath = path.join(process.cwd(), "./config.json");

    if(!fs.existsSync(configPath)){
      console.error("There's no configure file.");
      process.exit(1);
    }

    const checker = TypeCompiler.Compile(ConfigRoot);

    const config = JSON.parse(
      stripJsonComments(fs.readFileSync(configPath, "utf-8")));

    const errs = [...checker.Errors(config)];
    if(errs.length > 0){
      const er = new Error("Invalid config.json");
      console.error(errs);
      Object.defineProperty(er, "errors", {
        value: errs,
      });
      throw er;
    }
    
    if(DEVELOPMENT_PHASE && (typeof config !== "object" || !("debug" in config) || !config.debug)){
      console.error("This is still a development phase, and running without debug mode is currently disabled.");
      console.error("You should use the latest version instead of the current branch.");
      process.exit(1);
    }
    
    const rawConfig = Object.assign(
      // empty object
      Object.create(null),
      // default options
      Value.Create(ConfigRoot),
      // optional options default value
      {
        minTargetProfitPercent: 1,
        maxTargetProfit: undefined,
        maxTargetProfitPercent: undefined,
        maxTargetVolumePercent: 50,
        acceptablePriceRange: undefined,
        logging: undefined,
      },
      // loaded config
      config,
    ) as unknown as Static<typeof ConfigRoot>;

    this._config = {
      ...rawConfig,
      brokers: rawConfig.brokers.map(broker => this.transformBrokerConfig(broker)),
    };

    Object.freeze(this._config);
  }
}

export function getConfig(){
  ConfigLoader.instance.load();
  return ConfigLoader.instance.config;
}

export function findBrokerConfig(broker: Broker): FormedBrokerConfigType {
  const found = getConfig().brokers.find(brokerConfig => brokerConfig.broker === broker);
  if(found === undefined){
    throw new Error(`Unable to find ${broker} in config.`);
  }
  return found;
}
