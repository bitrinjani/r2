import type { Broker } from "./types";


import { inject, injectable } from "inversify";
import _ from "lodash";

import symbols from "./symbols";
import { ConfigStore } from "./types";

const MAX = 10;
const MIN = 1;

@injectable()
export default class BrokerStabilityTracker {
  private readonly stabilityMap: Map<Broker, number>;
  private timer;

  constructor(@inject(symbols.ConfigStore) private readonly configStore: ConfigStore) {
    const brokers = this.configStore.config.brokers.map(b => b.broker);
    this.stabilityMap = new Map<Broker, number>(brokers.map(b => [b, MAX] as [string, number]));
  }

  async start() {
    if(this.configStore.config.stabilityTracker){
      const interval = this.configStore.config.stabilityTracker.recoveryInterval || 60 * 1000;
      this.timer = setInterval(() => this.recover(), interval);
    }
  }

  async stop() {
    if(this.timer){
      clearInterval(this.timer);
    }
  }

  decrement(broker: Broker) {
    if(this.stabilityMap.has(broker)){
      const counter = this.stability(broker);
      const newValue = counter - 1;
      this.stabilityMap.set(broker, _.clamp(newValue, MIN, MAX));
    }
  }

  isStable(broker: Broker): boolean {
    if(!this.stabilityMap.has(broker)){
      return false;
    }
    const counter = this.stability(broker);
    let threshold = 0;
    if(this.configStore.config.stabilityTracker){
      threshold = this.configStore.config.stabilityTracker.threshold || 0;
    }
    return counter >= threshold;
  }

  stability(broker: Broker): number {
    return this.stabilityMap.get(broker);
  }

  private increment(broker: Broker) {
    const counter = this.stability(broker);
    const newValue = counter + 1;
    this.stabilityMap.set(broker, _.clamp(newValue, MIN, MAX));
  }

  private recover() {
    const brokers = this.configStore.config.brokers.map(b => b.broker);
    for(const broker of brokers){
      this.increment(broker);
    }
  }
} /* istanbul ignore next */
