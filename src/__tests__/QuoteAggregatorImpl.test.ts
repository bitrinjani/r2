import 'reflect-metadata';
import QuoteAggregator from '../QuoteAggregator';
import { Broker, QuoteSide } from '../types';
import * as _ from 'lodash';
import { delay } from '../util';
import BrokerAdapterRouter from '../BrokerAdapterRouter';
import { options } from '../logger';
import { DateTime } from 'luxon';
options.enabled = false;

const config = {
  iterationInterval: 3000,
  priceMergeSize: 100,
  brokers: [
    {
      broker: 'Bitflyer',
      enabled: true
    },
    {
      broker: 'Quoine',
      enabled: true,
      maxLongPosition: 0.3,
      maxShortPosition: 0.3
    },
    {
      broker: 'Coincheck',
      enabled: true,
      maxLongPosition: 1,
      maxShortPosition: 0
    }
  ]
};
const configStore = { config };

describe('Quote Aggregator', () => {
  test('folding', async () => {
    configStore.config.iterationInterval = 10;
    const bitflyerBa = {
      broker: 'Bitflyer',
      fetchQuotes: () =>
        Promise.resolve([
          { broker: 'Bitflyer', side: QuoteSide.Ask, price: 500000, volume: 0.1 },
          { broker: 'Bitflyer', side: QuoteSide.Ask, price: 500001, volume: 0.1 }
        ])
    };
    const coincheckBa = {
      broker: 'Coincheck',
      fetchQuotes: () =>
        Promise.resolve([
          { broker: 'Coincheck', side: QuoteSide.Bid, price: 490001, volume: 0.02 },
          { broker: 'Coincheck', side: QuoteSide.Bid, price: 490000, volume: 0.2 }
        ])
    };
    const quoineBa = {
      broker: 'Quoine',
      fetchQuotes: () => Promise.resolve([])
    };
    const baList = [bitflyerBa, coincheckBa, quoineBa];
    const baRouter = new BrokerAdapterRouter(baList);
    const aggregator: QuoteAggregator = new QuoteAggregator(configStore, baRouter);
    const mustBeCalled = jest.fn();
    aggregator.onQuoteUpdated.set('Arbitrager', async quotes => {
      expect(quotes.length).toBe(3);
      expect(quotes[0].toString()).toBe('Bitflyer   Ask 500,000 0.1');
      mustBeCalled();
    });
    await aggregator.start();
    await delay(0);
    await aggregator.stop();
    expect(mustBeCalled.mock.calls.length).toBeGreaterThanOrEqual(1);
  });

  test('folding with noTradePeriods', async () => {
    configStore.config.iterationInterval = 10;
    const current = DateTime.local();
    const start = current.minus({ minutes: 5 });
    const end = current.plus({ minutes: 5 });
    configStore.config.brokers[0].noTradePeriods = [
      [start.toLocaleString(DateTime.TIME_24_SIMPLE), end.toLocaleString(DateTime.TIME_24_SIMPLE)]
    ];
    const bitflyerBa = {
      broker: 'Bitflyer',
      fetchQuotes: () =>
        Promise.resolve([
          { broker: 'Bitflyer', side: QuoteSide.Ask, price: 500000, volume: 0.1 },
          { broker: 'Bitflyer', side: QuoteSide.Ask, price: 500001, volume: 0.1 }
        ])
    };
    const coincheckBa = {
      broker: 'Coincheck',
      fetchQuotes: () =>
        Promise.resolve([
          { broker: 'Coincheck', side: QuoteSide.Bid, price: 490001, volume: 0.02 },
          { broker: 'Coincheck', side: QuoteSide.Bid, price: 490000, volume: 0.2 }
        ])
    };
    const quoineBa = {
      broker: 'Quoine',
      fetchQuotes: () => Promise.resolve([])
    };
    const baList = [bitflyerBa, coincheckBa, quoineBa];
    const baRouter = new BrokerAdapterRouter(baList);
    const aggregator: QuoteAggregator = new QuoteAggregator(configStore, baRouter);
    const mustBeCalled = jest.fn();
    aggregator.onQuoteUpdated.set('Arbitrager', async quotes => {
      expect(quotes.length).toBe(1);
      mustBeCalled();
    });
    await aggregator.start();
    await delay(0);
    await aggregator.stop();
    expect(mustBeCalled.mock.calls.length).toBeGreaterThanOrEqual(1);
  });

  test('folding with noTradePeriods -> no matching period', async () => {
    configStore.config.iterationInterval = 10;
    const current = DateTime.local();
    const start = current.plus({ minutes: 5 });
    const end = current.plus({ minutes: 15 });
    configStore.config.brokers[0].noTradePeriods = [
      [start.toLocaleString(DateTime.TIME_24_SIMPLE), end.toLocaleString(DateTime.TIME_24_SIMPLE)]
    ];
    const bitflyerBa = {
      broker: 'Bitflyer',
      fetchQuotes: () =>
        Promise.resolve([
          { broker: 'Bitflyer', side: QuoteSide.Ask, price: 500000, volume: 0.1 },
          { broker: 'Bitflyer', side: QuoteSide.Ask, price: 500001, volume: 0.1 }
        ])
    };
    const coincheckBa = {
      broker: 'Coincheck',
      fetchQuotes: () =>
        Promise.resolve([
          { broker: 'Coincheck', side: QuoteSide.Bid, price: 490001, volume: 0.02 },
          { broker: 'Coincheck', side: QuoteSide.Bid, price: 490000, volume: 0.2 }
        ])
    };
    const quoineBa = {
      broker: 'Quoine',
      fetchQuotes: () => Promise.resolve([])
    };
    const baList = [bitflyerBa, coincheckBa, quoineBa];
    const baRouter = new BrokerAdapterRouter(baList);
    const aggregator: QuoteAggregator = new QuoteAggregator(configStore, baRouter);
    const mustBeCalled = jest.fn();
    aggregator.onQuoteUpdated.set('Arbitrager', async quotes => {
      expect(quotes.length).toBe(3);
      mustBeCalled();
    });
    await aggregator.start();
    await delay(0);
    await aggregator.stop();
    expect(mustBeCalled.mock.calls.length).toBeGreaterThanOrEqual(1);
  });

  test('folding with noTradePeriods -> invalid period', async () => {
    configStore.config.iterationInterval = 10;
    configStore.config.brokers[0].noTradePeriods = [
      ['00_00', '01_00']
    ];
    const bitflyerBa = {
      broker: 'Bitflyer',
      fetchQuotes: () =>
        Promise.resolve([
          { broker: 'Bitflyer', side: QuoteSide.Ask, price: 500000, volume: 0.1 },
          { broker: 'Bitflyer', side: QuoteSide.Ask, price: 500001, volume: 0.1 }
        ])
    };
    const coincheckBa = {
      broker: 'Coincheck',
      fetchQuotes: () =>
        Promise.resolve([
          { broker: 'Coincheck', side: QuoteSide.Bid, price: 490001, volume: 0.02 },
          { broker: 'Coincheck', side: QuoteSide.Bid, price: 490000, volume: 0.2 }
        ])
    };
    const quoineBa = {
      broker: 'Quoine',
      fetchQuotes: () => Promise.resolve([])
    };
    const baList = [bitflyerBa, coincheckBa, quoineBa];
    const baRouter = new BrokerAdapterRouter(baList);
    const aggregator: QuoteAggregator = new QuoteAggregator(configStore, baRouter);
    const mustBeCalled = jest.fn();
    aggregator.onQuoteUpdated.set('Arbitrager', async quotes => {
      expect(quotes.length).toBe(3);
      mustBeCalled();
    });
    await aggregator.start();
    await delay(0);
    await aggregator.stop();
    expect(mustBeCalled.mock.calls.length).toBeGreaterThanOrEqual(1);
  });

  test('folding when a broker is disabled', async () => {
    configStore.config.iterationInterval = 11;
    config.brokers[0].enabled = false;
    const bitflyerBa = {
      broker: 'Bitflyer',
      fetchQuotes: () =>
        Promise.resolve([
          { broker: 'Bitflyer', side: QuoteSide.Ask, price: 500000, volume: 0.1 },
          { broker: 'Bitflyer', side: QuoteSide.Ask, price: 500001, volume: 0.01 }
        ])
    };
    const coincheckBa = {
      broker: 'Coincheck',
      fetchQuotes: () =>
        Promise.resolve([
          { broker: 'Coincheck', side: QuoteSide.Bid, price: 490001, volume: 0.02 },
          { broker: 'Coincheck', side: QuoteSide.Bid, price: 490000, volume: 0.2 }
        ])
    };
    const quoineBa = {
      broker: 'Quoine',
      fetchQuotes: () => Promise.resolve([])
    };
    const baList = [bitflyerBa, coincheckBa, quoineBa];
    const baRouter = new BrokerAdapterRouter(baList);
    const aggregator: QuoteAggregator = new QuoteAggregator(configStore, baRouter);
    const mustBeCalled = jest.fn();
    aggregator.onQuoteUpdated.set('Arbitrager', async quotes => {
      expect(quotes.length).toBe(1);
      mustBeCalled();
    });
    await aggregator.start();
    await delay(0);
    await aggregator.stop();
    expect(mustBeCalled.mock.calls.length).toBeGreaterThanOrEqual(1);
  });

  test('onQuoteUpdated', async () => {
    configStore.config.iterationInterval = 12;
    const bitflyerBa = {
      broker: 'Bitflyer',
      fetchQuotes: () =>
        Promise.resolve([
          { broker: 'Bitflyer', side: QuoteSide.Ask, price: 500000, volume: 0.1 },
          { broker: 'Bitflyer', side: QuoteSide.Ask, price: 500001, volume: 0.01 }
        ])
    };
    const quoineBa = {
      broker: 'Quoine',
      fetchQuotes: () => Promise.resolve([])
    };
    const coincheckBa = {
      broker: 'Coincheck',
      fetchQuotes: () => Promise.resolve([])
    };
    const baList = [bitflyerBa, quoineBa, coincheckBa];
    const baRouter = new BrokerAdapterRouter(baList);
    const aggregator: QuoteAggregator = new QuoteAggregator(configStore, baRouter);
    const fn = jest.fn();
    aggregator.onQuoteUpdated.set('Arbitrager', fn);
    await aggregator.start();
    await delay(0);
    expect(fn.mock.calls.length).toBeGreaterThan(0);
    await aggregator.stop();
  });

  test('onQuoteUpdated without event handler', async () => {
    configStore.config.iterationInterval = 12;
    const bitflyerBa = {
      broker: 'Bitflyer',
      fetchQuotes: () =>
        Promise.resolve([
          { broker: 'Bitflyer', side: QuoteSide.Ask, price: 500000, volume: 0.1 },
          { broker: 'Bitflyer', side: QuoteSide.Ask, price: 500001, volume: 0.01 }
        ])
    };
    const quoineBa = {
      broker: 'Quoine',
      fetchQuotes: () => Promise.resolve([])
    };
    const coincheckBa = {
      broker: 'Coincheck',
      fetchQuotes: () => Promise.resolve([])
    };
    const baList = [bitflyerBa, quoineBa, coincheckBa];
    const baRouter = new BrokerAdapterRouter(baList);
    const aggregator: QuoteAggregator = new QuoteAggregator(configStore, baRouter);
    await aggregator.start();
    await delay(0);
    await aggregator.stop();
  });

  test('when already running', async () => {
    configStore.config.iterationInterval = 12;
    const bitflyerBa = {
      broker: 'Bitflyer',
      fetchQuotes: () => Promise.resolve([])
    };
    const quoineBa = {
      broker: 'Quoine',
      fetchQuotes: jest.fn()
    };
    const coincheckBa = {
      broker: 'Coincheck',
      fetchQuotes: () => Promise.resolve([])
    };
    const baList = [bitflyerBa, quoineBa, coincheckBa];
    const baRouter = new BrokerAdapterRouter(baList);
    const aggregator: QuoteAggregator = new QuoteAggregator(configStore, baRouter);
    aggregator.isRunning = true;
    await aggregator.start();
    await aggregator.stop();
    expect(quoineBa.fetchQuotes).not.toBeCalled();
  });

  test('fetchQuotes throws', async () => {
    configStore.config.iterationInterval = 12;
    const bitflyerBa = {
      broker: 'Bitflyer',
      fetchQuotes: () => Promise.resolve([])
    };
    const quoineBa = {
      broker: 'Quoine',
      fetchQuotes: async () => {
        throw new Error('Mock fetchQuotes failed.');
      }
    };
    const coincheckBa = {
      broker: 'Coincheck',
      fetchQuotes: () => Promise.resolve([])
    };
    const baList = [bitflyerBa, quoineBa, coincheckBa];
    const baRouter = new BrokerAdapterRouter(baList);
    const aggregator: QuoteAggregator = new QuoteAggregator(configStore, baRouter);
    await aggregator.start();
    await aggregator.stop();
    expect(aggregator.quotes.length).toBe(0);
  });
});

test('stop without start', () => {
  const aggregator = new QuoteAggregator(configStore, []);
  aggregator.stop();
});
