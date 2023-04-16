import type { BrokerConfigType } from "../../config";

import BrokerAdapterImpl from "./BrokerAdapterImpl";

export function create(config: BrokerConfigType) {
  return new BrokerAdapterImpl(config);
}
