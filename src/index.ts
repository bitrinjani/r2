import type { BrokerAdapter, ConfigStore } from "./types";
import type { Container } from "inversify";

import { exec } from "child_process";

import { getLogger } from "@bitr/logger";

import Arbitrager from "./arbitrager";
import BrokerStabilityTracker from "./brokerStabilityTracker";
import { closeChronoDB } from "./chrono";
import container from "./container.config";
import t from "./i18n";
import "reflect-metadata";
import PositionService from "./positionService";
import QuoteAggregator from "./quoteAggregator";
import ReportService from "./reportService";
import symbols from "./symbols";
import WebGateway from "./webGateway";


process.title = "r2app";

class AppRoot {
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
      if(!brokerConfig.enabled){
        console.error(`${brokerName} is not enabled.`);
        return;
      }
      const brokerModule = await this.tryImport(`./${brokerName}`);
      if(brokerModule === undefined){
        console.error(`Unable to find ${brokerName} package.`);
        return;
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

const app = new AppRoot(container);
// eslint-disable-next-line @typescript-eslint/no-floating-promises
app.start();

function exit(code: number = 0) {
  exec(`pkill ${process.title}`);
  process.exit(code);
}

process.on("SIGINT", async () => {
  console.log("SIGINT received. Stopping...");
  await app.stop();
  console.log("Stopped app.");
  exit(1);
});

process.on("unhandledRejection", async (reason) => {
  console.error(reason);
  await app.stop();
  console.log("Stopped app.");
  exit(1);
});
