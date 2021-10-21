import { BrokerConfigType } from "../types";
import BrokerAdapterImpl from './BrokerAdapterImpl';

export default class Broker {
  private broker: string;

  constructor(broker: string) {
    this.broker = broker;
  }

  create(config: BrokerConfigType, symbol: string) {
    return new BrokerAdapterImpl(this.broker, symbol, config);
  }
}