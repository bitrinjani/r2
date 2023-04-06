import BrokerAdapterImpl from './BrokerAdapterImpl';
import { BrokerConfigType } from '../types';

export function create(config: BrokerConfigType): BrokerAdapterImpl {
  return new BrokerAdapterImpl(config);
}
