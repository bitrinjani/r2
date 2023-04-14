import { getLogger } from "@bitr/logger";

import t from "./i18n";
import "reflect-metadata";
import PositionService from "./positionService";
import QuoteAggregator from "./quoteAggregator";
import ReportService from "./reportService";
import symbols from "./symbols";

import type { BrokerAdapter, ConfigStore } from "./types";
import type { Container } from "inversify";

import { closeChronoDB } from "./chrono";
import Arbitrager from "./arbitrager";
import BrokerStabilityTracker from "./brokerStabilityTracker";
import WebGateway from "./webGateway";

export default class AppRoot {
  private readonly log = getLogger(this.constructor.name);
  private services: { start: () => Promise<void>, stop: () => Promise<void> }[];

  constructor(private readonly ioc: Container) {}

  async start(): Promise<void> {
    try{
      this.log.info(t`StartingTheService`);
      await this.bindBrokers();
      this.services = [
        this.ioc.get(QuoteAggregator),
        this.ioc.get(PositionService),
        this.ioc.get(Arbitrager),
        this.ioc.get(ReportService),
        this.ioc.get(BrokerStabilityTracker),
        this.ioc.get(WebGateway),
      ];
      for(const service of this.services){
        await service.start();
      }
      this.log.info(t`SuccessfullyStartedTheService`);
    } catch(ex){
      this.log.error(ex.message);
      this.log.debug(ex.stack);
    }
  }

  async stop(): Promise<void> {
    try{
      this.log.info(t`StoppingTheService`);
      for(const service of this.services.slice().reverse()){
        await service.stop();
      }
      await closeChronoDB();
      this.log.info(t`SuccessfullyStoppedTheService`);
    } catch(ex){
      this.log.error(ex.message);
      this.log.debug(ex.stack);
    }
  }

  private async bindBrokers(): Promise<void> {
    const configStore = this.ioc.get<ConfigStore>(symbols.ConfigStore);
    const brokerConfigs = configStore.config.brokers;
    const bindTasks = brokerConfigs.map(async brokerConfig => {
      const brokerName = brokerConfig.broker;
      const brokerModule = brokerConfig.npmPath
        ? await this.tryImport(brokerConfig.npmPath)
        : await this.tryImport(`./${brokerName}`) || await this.tryImport(`@bitr/${brokerName}`);
      if(brokerModule === undefined){
        throw new Error(`Unable to find ${brokerName} package.`);
      }
      const brokerAdapter = brokerModule.create(brokerConfig);
      this.ioc.bind<BrokerAdapter>(symbols.BrokerAdapter).toConstantValue(brokerAdapter);
    });
    await Promise.all(bindTasks);
  }

  private async tryImport(path: string): Promise<any> {
    try{
      const module = await import(path);
      if(module.create === undefined){
        return undefined;
      }
      return module;
    } catch(ex){
      return undefined;
    }
  }
}
