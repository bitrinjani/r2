// tslint:disable
import {
  QuoteAggregator, Broker, QuoteSide, ConfigRoot, ConfigStore,
  PositionService, BrokerAdapterRouter, CashMarginType, OrderStatus
} from '../type';
import ArbitragerImpl from '../ArbitragerImpl';
import Quote from '../Quote';

let quoteAggregator,
  config: ConfigRoot,
  configStore, positionMap, positionService,
  baRouter, spreadAnalyzer, quotes;

beforeEach(() => {
  quoteAggregator = {
    start: jest.fn(),
    stop: jest.fn()
  } as QuoteAggregator;
  config = {
    maxNetExposure: 10.0,
    brokers: [
      { broker: Broker.Bitflyer, cashMarginType: CashMarginType.Cash, leverageLevel: 1 },
      { broker: Broker.Coincheck, cashMarginType: CashMarginType.MarginOpen, leverageLevel: 8 },
      { broker: Broker.Quoine, cashMarginType: CashMarginType.NetOut, leverageLevel: 9 }
    ]
  } as ConfigRoot;
  configStore = { config } as ConfigStore;
  positionMap = {
    Coincheck: {
      allowedLongSize: 10,
      allowedShortSize: 10,
      longAllowed: true,
      shortAllowed: true,
      btc: 0.1
    },
    Quoine: {
      allowedLongSize: 10,
      allowedShortSize: 10,
      longAllowed: true,
      shortAllowed: true,
      btc: - 0.1
    }
  };
  positionService = {
    positionMap,
    start: jest.fn(),
    stop: jest.fn(),
    print: jest.fn(),
    isStarted: true,
    netExposure: 0
  } as PositionService;

  baRouter = {
    send: jest.fn(),
    refresh: jest.fn(),
    cancel: jest.fn(),
    getBtcPosition: jest.fn(),
    fetchQuotes: jest.fn()
  } as BrokerAdapterRouter;

  spreadAnalyzer = {
    analyze: jest.fn()
  };

  quotes = [
    new Quote(Broker.Coincheck, QuoteSide.Ask, 3, 1),
    new Quote(Broker.Coincheck, QuoteSide.Bid, 2, 2),
    new Quote(Broker.Quoine, QuoteSide.Ask, 3.5, 3),
    new Quote(Broker.Quoine, QuoteSide.Bid, 2.5, 4)
  ];
});

describe('Arbitrager', () => {
  test('start/stop', async () => {
    const arbitrager = new ArbitragerImpl(quoteAggregator, configStore,
      positionService, baRouter, spreadAnalyzer);
    await arbitrager.start();
    expect(positionService.start).toBeCalled();
    expect(quoteAggregator.onQuoteUpdated).not.toBeUndefined();
    expect(arbitrager.status).toBe('Started');
    await arbitrager.stop();
    expect(positionService.stop).toBeCalled();
    expect(arbitrager.status).toBe('Stopped');
  });

  test('stop without start', async () => {
    const arbitrager = new ArbitragerImpl();
    await arbitrager.stop();
    expect(arbitrager.status).toBe('Stopped');
  });

  test('positionService is not ready', async () => {
    const arbitrager = new ArbitragerImpl(quoteAggregator, configStore,
      positionService, baRouter, spreadAnalyzer);
    await arbitrager.start();
    positionService.isStarted = false;
    await quoteAggregator.onQuoteUpdated([]);
    expect(spreadAnalyzer.analyze).not.toBeCalled();
    expect(baRouter.send).not.toBeCalled();
    expect(arbitrager.status).toBe('Waiting Position Service');
  });

  test('violate maxNetExposure', async () => {
    config.maxNetExposure = 0.1;
    positionService.netExposure = 0.2;
    const arbitrager = new ArbitragerImpl(quoteAggregator, configStore,
      positionService, baRouter, spreadAnalyzer);
    await arbitrager.start();
    await quoteAggregator.onQuoteUpdated([]);
    expect(spreadAnalyzer.analyze).not.toBeCalled();
    expect(baRouter.send).not.toBeCalled();
    expect(arbitrager.status).toBe('Max exposure breached');
  });

  test('SpreadAnalyzer throws', async () => {
    config.maxNetExposure = 10;
    spreadAnalyzer.analyze.mockImplementation(() => { throw new Error(); });
    const arbitrager = new ArbitragerImpl(quoteAggregator, configStore,
      positionService, baRouter, spreadAnalyzer);
    positionService.isStarted = true;
    await arbitrager.start();
    await quoteAggregator.onQuoteUpdated([]);
    expect(spreadAnalyzer.analyze).toBeCalled();
    expect(baRouter.send).not.toBeCalled();
    expect(arbitrager.status).toBe('Spread analysis failed');
  });

  test('Spread not inverted', async () => {
    spreadAnalyzer.analyze.mockImplementation(() => {
      return {
        bestBid: new Quote(Broker.Quoine, QuoteSide.Bid, 400, 4),
        bestAsk: new Quote(Broker.Coincheck, QuoteSide.Ask, 500, 1),
        invertedSpread: -100,
        targetVolume: 1,
        targetProfit: -100
      };
    });
    const arbitrager = new ArbitragerImpl(quoteAggregator, configStore,
      positionService, baRouter, spreadAnalyzer);
    positionService.isStarted = true;
    await arbitrager.start();
    await quoteAggregator.onQuoteUpdated([]);
    expect(spreadAnalyzer.analyze).toBeCalled();
    expect(baRouter.send).not.toBeCalled();
    expect(arbitrager.status).toBe('Spread not inverted');
  });
  
  test('Too small profit', async () => {
    config.minTargetProfit = 1000;
    spreadAnalyzer.analyze.mockImplementation(() => {
      return {
        bestBid: new Quote(Broker.Quoine, QuoteSide.Bid, 600, 4),
        bestAsk: new Quote(Broker.Coincheck, QuoteSide.Ask, 500, 1),
        invertedSpread: 100,
        availableVolume: 1,
        targetVolume: 1,
        targetProfit: 100
      };
    });
    const arbitrager = new ArbitragerImpl(quoteAggregator, configStore,
      positionService, baRouter, spreadAnalyzer);
    positionService.isStarted = true;
    await arbitrager.start();
    await quoteAggregator.onQuoteUpdated([]);
    expect(baRouter.send).not.toBeCalled();
    expect(arbitrager.status).toBe('Too small profit');
  });

  test('Too small profit by minTargetProfitPercent', async () => {
    config.minTargetProfit = 0;
    config.minTargetProfitPercent = 18.4;
    spreadAnalyzer.analyze.mockImplementation(() => {
      return {
        bestBid: new Quote(Broker.Quoine, QuoteSide.Bid, 600, 4),
        bestAsk: new Quote(Broker.Coincheck, QuoteSide.Ask, 500, 1),
        invertedSpread: 100,
        availableVolume: 1,
        targetVolume: 1,
        targetProfit: 100
      };
    });
    const arbitrager = new ArbitragerImpl(quoteAggregator, configStore,
      positionService, baRouter, spreadAnalyzer);
    positionService.isStarted = true;
    await arbitrager.start();
    await quoteAggregator.onQuoteUpdated([]);
    expect(baRouter.send).not.toBeCalled();
    expect(arbitrager.status).toBe('Too small profit');
  });

  test('Too small profit by minTargetProfit', async () => {
    config.minTargetProfit = 101;
    config.minTargetProfitPercent = 10;
    spreadAnalyzer.analyze.mockImplementation(() => {
      return {
        bestBid: new Quote(Broker.Quoine, QuoteSide.Bid, 600, 4),
        bestAsk: new Quote(Broker.Coincheck, QuoteSide.Ask, 500, 1),
        invertedSpread: 100,
        availableVolume: 1,
        targetVolume: 1,
        targetProfit: 100
      };
    });
    const arbitrager = new ArbitragerImpl(quoteAggregator, configStore,
      positionService, baRouter, spreadAnalyzer);
    positionService.isStarted = true;
    await arbitrager.start();
    await quoteAggregator.onQuoteUpdated([]);
    expect(baRouter.send).not.toBeCalled();
    expect(arbitrager.status).toBe('Too small profit');
  });

  test('Demo mode', async () => {
    config.demoMode = true;
    spreadAnalyzer.analyze.mockImplementation(() => {
      return {
        bestBid: new Quote(Broker.Quoine, QuoteSide.Bid, 600, 4),
        bestAsk: new Quote(Broker.Coincheck, QuoteSide.Ask, 500, 1),
        invertedSpread: 100,
        availableVolume: 1,
        targetVolume: 1,
        targetProfit: 100
      };
    });
    const arbitrager = new ArbitragerImpl(quoteAggregator, configStore,
      positionService, baRouter, spreadAnalyzer);
    positionService.isStarted = true;
    await arbitrager.start();
    await quoteAggregator.onQuoteUpdated([]);
    expect(baRouter.send).not.toBeCalled();
    expect(arbitrager.status).toBe('Demo mode');
  });

  test('Send and not filled', async () => {
    config.maxRetryCount = 3;
    spreadAnalyzer.analyze.mockImplementation(() => {
      return {
        bestBid: new Quote(Broker.Quoine, QuoteSide.Bid, 600, 4),
        bestAsk: new Quote(Broker.Coincheck, QuoteSide.Ask, 500, 1),
        invertedSpread: 100,
        availableVolume: 1,
        targetVolume: 1,
        targetProfit: 100
      };
    });
    const arbitrager = new ArbitragerImpl(quoteAggregator, configStore,
      positionService, baRouter, spreadAnalyzer);
    positionService.isStarted = true;
    await arbitrager.start();
    await quoteAggregator.onQuoteUpdated([]);
    expect(arbitrager.status).toBe('MaxRetryCount breached');
  });

  test('Send and refresh throws', async () => {
    config.maxRetryCount = 3;
    spreadAnalyzer.analyze.mockImplementation(() => {
      return {
        bestBid: new Quote(Broker.Quoine, QuoteSide.Bid, 600, 4),
        bestAsk: new Quote(Broker.Coincheck, QuoteSide.Ask, 500, 1),
        invertedSpread: 100,
        availableVolume: 1,
        targetVolume: 1,
        targetProfit: 100
      };
    });
    baRouter.refresh = () => { throw new Error('Mock refresh error.'); };
    const arbitrager = new ArbitragerImpl(quoteAggregator, configStore,
      positionService, baRouter, spreadAnalyzer);
    positionService.isStarted = true;
    await arbitrager.start();
    await quoteAggregator.onQuoteUpdated([]);
    expect(arbitrager.status).toBe('MaxRetryCount breached');
  });


  test('Send and filled', async () => {
    baRouter.refresh.mockImplementation((order) => order.status = OrderStatus.Filled);
    config.maxRetryCount = 3;
    spreadAnalyzer.analyze.mockImplementation(() => {
      return {
        bestBid: new Quote(Broker.Quoine, QuoteSide.Bid, 600, 4),
        bestAsk: new Quote(Broker.Coincheck, QuoteSide.Ask, 500, 1),
        invertedSpread: 100,
        availableVolume: 1,
        targetVolume: 1,
        targetProfit: 100
      };
    });
    const arbitrager = new ArbitragerImpl(quoteAggregator, configStore,
      positionService, baRouter, spreadAnalyzer);
    positionService.isStarted = true;
    await arbitrager.start();
    await quoteAggregator.onQuoteUpdated([]);
    expect(arbitrager.status).toBe('Filled');
  });
});