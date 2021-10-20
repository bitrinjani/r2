import BrokerAdapterImpl from './BrokerAdapterImpl';
import { BrokerConfigType } from '../types';

export function create(config: BrokerConfigType, rootSymbol: string) {
  return new BrokerAdapterImpl(config, rootSymbol);
}
