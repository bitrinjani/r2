import { ActivePairStore, OrderPair } from './types';
import OrderImpl from './OrderImpl';
import { revive } from './util';
import { ChronoDB } from '@bitr/chronodb';

export const getActivePairStore = (chronoDB: ChronoDB): ActivePairStore =>
  chronoDB.getTimeSeries<OrderPair>(
    'ActivePair',
    orderPair => orderPair.map(o => revive(OrderImpl, o)) as OrderPair
  );
