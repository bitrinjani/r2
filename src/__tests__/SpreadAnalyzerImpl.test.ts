import 'reflect-metadata';
import SpreadAnalyzerImpl from '../SpreadAnalyzerImpl';
import { Broker, QuoteSide, ConfigStore } from '../type';
import * as _ from 'lodash';
import Quote from '../Quote';

test('Test SpreadAnlyzerImpl', async () => {
  const config = { maxSize: 0.5 };
  const configStore = { config } as ConfigStore;
  const positionMap = {
    Coincheck: {
      allowedLongSize: 10,
      allowedShortSize: 10,
      longAllowed: true,
      shortAllowed: true
    },
    Quoine: {
      allowedLongSize: 10,
      allowedShortSize: 10,
      longAllowed: true,
      shortAllowed: true
    }
  } ;

  const quotes = [
    new Quote(Broker.Coincheck, QuoteSide.Ask, 3, 1),
    new Quote(Broker.Coincheck, QuoteSide.Bid, 2, 2),
    new Quote(Broker.Quoine, QuoteSide.Ask, 3.5, 3),
    new Quote(Broker.Quoine, QuoteSide.Bid, 2.5, 4)
  ];

  const target = new SpreadAnalyzerImpl(configStore);
  const result = await target.analyze(quotes, positionMap);
  expect(result.bestAsk.broker).toBe(Broker.Coincheck);
  expect(result.bestAsk.price).toBe(3);
  expect(result.bestAsk.volume).toBe(1);
  expect(result.bestBid.broker).toBe(Broker.Quoine);
  expect(result.bestBid.price).toBe(2.5);
  expect(result.bestBid.volume).toBe(4);
  expect(result.invertedSpread).toBe(-0.5);
  expect(result.targetVolume).toBe(0.5);
});