import BrokerAdapterImpl from './BrokerAdapterImpl';
import { BrokerConfigType } from '../types';

export function create(config: BrokerConfigType) {
  return new BrokerAdapterImpl(config);
}
