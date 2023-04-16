import type { FormedBrokerConfigType } from "../../config";

import BrokerAdapterImpl from "./BrokerAdapterImpl";

export function create(config: FormedBrokerConfigType) {
  return new BrokerAdapterImpl(config);
}
