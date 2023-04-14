import type { BrokerConfigType } from "../types";

import BrokerAdapterImpl from "./BrokerAdapterImpl";

export function create(config: BrokerConfigType) {
  return new BrokerAdapterImpl(config);
}
