// tslint:disable
import {
  QuoteAggregator,
  Broker,
  QuoteSide,
  ConfigRoot,
  ConfigStore,
  PositionService,
  BrokerAdapterRouter,
  CashMarginType,
  OrderStatus,
  OrderSide,
  OnSingleLegConfig
} from '../types';
import ArbitragerImpl from '../ArbitragerImpl';
import Quote from '../Quote';
import LimitCheckerFactoryImpl from '../LimitCheckerFactoryImpl';
import SpreadAnalyzerImpl from '../SpreadAnalyzerImpl';
import { delay } from '../util';
import { options } from '../logger';
options.enabled = false;

let quoteAggregator,
  config: ConfigRoot,
  configStore,
  positionMap,
  positionService,
  baRouter,
  spreadAnalyzer,
  quotes,
  limitCheckerFactory;

beforeEach(() => {
  quoteAggregator = {
    start: jest.fn(),
    stop: jest.fn()
  } as QuoteAggregator;
  config = {
    maxNetExposure: 10.0,
    minSize: 0.005,
    brokers: [
      {
        broker: Broker.Bitflyer,
        cashMarginType: CashMarginType.Cash,
        leverageLevel: 1,
        maxLongPosition: 100,
        maxShortPosition: 100
      },
      {
        broker: Broker.Coincheck,
        cashMarginType: CashMarginType.MarginOpen,
        leverageLevel: 8,
        maxLongPosition: 100,
        maxShortPosition: 100
      },
      {
        broker: Broker.Quoine,
        cashMarginType: CashMarginType.NetOut,
        leverageLevel: 9,
        maxLongPosition: 100,
        maxShortPosition: 100
      }
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
      btc: -0.1
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

  limitCheckerFactory = new LimitCheckerFactoryImpl(configStore, positionService);

  quotes = [
    new Quote(Broker.Coincheck, QuoteSide.Ask, 3, 1),
    new Quote(Broker.Coincheck, QuoteSide.Bid, 2, 2),
    new Quote(Broker.Quoine, QuoteSide.Ask, 3.5, 3),
    new Quote(Broker.Quoine, QuoteSide.Bid, 2.5, 4)
  ];
});

describe('Arbitrager', () => {
  test('start/stop', async () => {
    const arbitrager = new ArbitragerImpl(
      quoteAggregator,
      configStore,
      positionService,
      baRouter,
      spreadAnalyzer,
      limitCheckerFactory
    );
    await arbitrager.start();
    expect(quoteAggregator.onQuoteUpdated).not.toBeUndefined();
    expect(arbitrager.status).toBe('Started');
    await arbitrager.stop();
    expect(arbitrager.status).toBe('Stopped');
  });

  test('stop without start', async () => {
    const arbitrager = new ArbitragerImpl(undefined, {config: {OnSingleLegConfig:{}});    
    await arbitrager.stop();
    expect(arbitrager.status).toBe('Stopped');
  });

  test('SpreadAnalyzer throws', async () => {
    config.maxNetExposure = 10;
    spreadAnalyzer.analyze.mockImplementation(() => {
      throw new Error();
    });
    const arbitrager = new ArbitragerImpl(
      quoteAggregator,
      configStore,
      positionService,
      baRouter,
      spreadAnalyzer,
      limitCheckerFactory
    );
    positionService.isStarted = true;
    await arbitrager.start();
    await quoteAggregator.onQuoteUpdated([]);
    expect(spreadAnalyzer.analyze).toBeCalled();
    expect(baRouter.send).not.toBeCalled();
    expect(arbitrager.status).toBe('Spread analysis failed');
  });

  test('violate maxNetExposure', async () => {
    spreadAnalyzer.analyze.mockImplementation(() => {
      return {
        bestBid: new Quote(Broker.Quoine, QuoteSide.Bid, 400, 4),
        bestAsk: new Quote(Broker.Coincheck, QuoteSide.Ask, 500, 1),
        invertedSpread: -100,
        targetVolume: 1,
        targetProfit: -100
      };
    });
    config.maxNetExposure = 0.1;
    positionService.netExposure = 0.2;
    const arbitrager = new ArbitragerImpl(
      quoteAggregator,
      configStore,
      positionService,
      baRouter,
      spreadAnalyzer,
      limitCheckerFactory
    );
    await arbitrager.start();
    await quoteAggregator.onQuoteUpdated([]);
    expect(spreadAnalyzer.analyze).toBeCalled();
    expect(baRouter.send).not.toBeCalled();
    expect(arbitrager.status).toBe('Max exposure breached');
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
    const arbitrager = new ArbitragerImpl(
      quoteAggregator,
      configStore,
      positionService,
      baRouter,
      spreadAnalyzer,
      limitCheckerFactory
    );
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
    const arbitrager = new ArbitragerImpl(
      quoteAggregator,
      configStore,
      positionService,
      baRouter,
      spreadAnalyzer,
      limitCheckerFactory
    );
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
    const arbitrager = new ArbitragerImpl(
      quoteAggregator,
      configStore,
      positionService,
      baRouter,
      spreadAnalyzer,
      limitCheckerFactory
    );
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
    const arbitrager = new ArbitragerImpl(
      quoteAggregator,
      configStore,
      positionService,
      baRouter,
      spreadAnalyzer,
      limitCheckerFactory
    );
    positionService.isStarted = true;
    await arbitrager.start();
    await quoteAggregator.onQuoteUpdated([]);
    expect(baRouter.send).not.toBeCalled();
    expect(arbitrager.status).toBe('Too small profit');
  });

  test('Too large profit by maxTargetProfit', async () => {
    config.maxTargetProfit = 99;
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
    const arbitrager = new ArbitragerImpl(
      quoteAggregator,
      configStore,
      positionService,
      baRouter,
      spreadAnalyzer,
      limitCheckerFactory
    );
    positionService.isStarted = true;
    await arbitrager.start();
    await quoteAggregator.onQuoteUpdated([]);
    expect(baRouter.send).not.toBeCalled();
    expect(arbitrager.status).toBe('Too large profit');
  });

  test('Too large profit by maxTargetProfitPercent', async () => {
    config.maxTargetProfitPercent = 15;
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
    const arbitrager = new ArbitragerImpl(
      quoteAggregator,
      configStore,
      positionService,
      baRouter,
      spreadAnalyzer,
      limitCheckerFactory
    );
    positionService.isStarted = true;
    await arbitrager.start();
    await quoteAggregator.onQuoteUpdated([]);
    expect(baRouter.send).not.toBeCalled();
    expect(arbitrager.status).toBe('Too large profit');
  });

  test('Demo mode', async () => {
    config.maxTargetProfitPercent = 20;
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
    const arbitrager = new ArbitragerImpl(
      quoteAggregator,
      configStore,
      positionService,
      baRouter,
      spreadAnalyzer,
      limitCheckerFactory
    );
    positionService.isStarted = true;
    await arbitrager.start();
    await quoteAggregator.onQuoteUpdated([]);
    expect(baRouter.send).not.toBeCalled();
    expect(arbitrager.status).toBe('Demo mode');
  });

  test('Send and both orders filled', async () => {
    let i = 1;
    baRouter.refresh = jest.fn().mockImplementation(order => {
      order.status = OrderStatus.Filled;
    };
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
    const arbitrager = new ArbitragerImpl(
      quoteAggregator,
      configStore,
      positionService,
      baRouter,
      spreadAnalyzer,
      limitCheckerFactory
    );
    positionService.isStarted = true;
    await arbitrager.start();
    await quoteAggregator.onQuoteUpdated([]);
    expect(arbitrager.status).toBe('Filled');
    expect(baRouter.refresh.mock.calls.length).toBe(2);
    expect(baRouter.send.mock.calls.length).toBe(2);
    expect(baRouter.cancel.mock.calls.length).toBe(0);
  });

  test('Send and only buy order filled', async () => {
    let i = 1;
    baRouter.refresh = order => {
      if (order.side === OrderSide.Buy) {
        order.status = OrderStatus.Filled;
      }
    };
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
    const arbitrager = new ArbitragerImpl(
      quoteAggregator,
      configStore,
      positionService,
      baRouter,
      spreadAnalyzer,
      limitCheckerFactory
    );
    positionService.isStarted = true;
    await arbitrager.start();
    await quoteAggregator.onQuoteUpdated([]);
    expect(arbitrager.status).toBe('MaxRetryCount breached');
  });

  test('Send and only sell order filled', async () => {
    let i = 1;
    baRouter.refresh = jest.fn().mockImplementation(order => {
      if (order.side === OrderSide.Sell) {
        order.status = OrderStatus.Filled;
      }
    });
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
    const arbitrager = new ArbitragerImpl(
      quoteAggregator,
      configStore,
      positionService,
      baRouter,
      spreadAnalyzer,
      limitCheckerFactory
    );
    positionService.isStarted = true;
    await arbitrager.start();
    await quoteAggregator.onQuoteUpdated([]);
    expect(arbitrager.status).toBe('MaxRetryCount breached');
    expect(baRouter.refresh.mock.calls.length).toBe(6);
    expect(baRouter.send.mock.calls.length).toBe(2);
    expect(baRouter.cancel.mock.calls.length).toBe(1);
  });

  test('Send and only sell order filled -> reverse', async () => {
    config.onSingleLeg = { action: 'Reverse', options: { limitMovePercent: 10 } };
    let i = 1;
    baRouter.refresh = jest.fn().mockImplementation(async order => {
      order.filledSize = 0;
      if (order.side === OrderSide.Sell) {
        order.status = OrderStatus.Filled;
        order.filledSize = 1;
      }
    });
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
    const arbitrager = new ArbitragerImpl(
      quoteAggregator,
      configStore,
      positionService,
      baRouter,
      spreadAnalyzer,
      limitCheckerFactory
    );
    positionService.isStarted = true;
    await arbitrager.start();
    await quoteAggregator.onQuoteUpdated([]);
    expect(arbitrager.status).toBe('MaxRetryCount breached');
    expect(baRouter.refresh.mock.calls.length).toBe(7);
    expect(baRouter.send.mock.calls.length).toBe(3);
    expect(baRouter.cancel.mock.calls.length).toBe(2);
  });

  test('Send and sell order filled and buy order partial filled -> reverse', async () => {
    config.onSingleLeg = { action: 'Reverse', options: { limitMovePercent: 10 } };
    let i = 1;
    baRouter.refresh = jest.fn().mockImplementation(async order => {
      order.filledSize = 0.3;
      if (order.side === OrderSide.Sell) {
        order.status = OrderStatus.Filled;
        order.filledSize = 1;
      }
    });
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
    const arbitrager = new ArbitragerImpl(
      quoteAggregator,
      configStore,
      positionService,
      baRouter,
      spreadAnalyzer,
      limitCheckerFactory
    );
    positionService.isStarted = true;
    await arbitrager.start();
    await quoteAggregator.onQuoteUpdated([]);
    expect(arbitrager.status).toBe('MaxRetryCount breached');
    expect(baRouter.refresh.mock.calls.length).toBe(7);
    expect(baRouter.send.mock.calls.length).toBe(3);
    expect(baRouter.cancel.mock.calls.length).toBe(2);
  });

  test('Send and sell order unfilled and buy order partial filled -> reverse', async () => {
    config.onSingleLeg = { action: 'Reverse', options: { limitMovePercent: 10 } };
    let i = 1;
    baRouter.refresh = jest.fn().mockImplementation(async order => {
      order.filledSize = 0.3;
      if (order.side === OrderSide.Sell) {
        order.filledSize = 0;
      }
    });
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
    const arbitrager = new ArbitragerImpl(
      quoteAggregator,
      configStore,
      positionService,
      baRouter,
      spreadAnalyzer,
      limitCheckerFactory
    );
    positionService.isStarted = true;
    await arbitrager.start();
    await quoteAggregator.onQuoteUpdated([]);
    expect(arbitrager.status).toBe('MaxRetryCount breached');
    expect(baRouter.refresh.mock.calls.length).toBe(7);
    expect(baRouter.send.mock.calls.length).toBe(3);
    expect(baRouter.cancel.mock.calls.length).toBe(3);
  });

  test('Send and only buy order filled -> reverse', async () => {
    config.onSingleLeg = { action: 'Reverse', options: { limitMovePercent: 10 } };
    let i = 1;
    baRouter.refresh = jest.fn().mockImplementation(async order => {
      order.filledSize = 0;
      if (order.side === OrderSide.Buy) {
        order.status = OrderStatus.Filled;
        order.filledSize = 1;
      }
    });
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
    const arbitrager = new ArbitragerImpl(
      quoteAggregator,
      configStore,
      positionService,
      baRouter,
      spreadAnalyzer,
      limitCheckerFactory
    );
    positionService.isStarted = true;
    await arbitrager.start();
    await quoteAggregator.onQuoteUpdated([]);
    expect(arbitrager.status).toBe('MaxRetryCount breached');
    expect(baRouter.refresh.mock.calls.length).toBe(7);
    expect(baRouter.send.mock.calls.length).toBe(3);
    expect(baRouter.cancel.mock.calls.length).toBe(2);
  });

  test('Send and buy order filled and sel order partial filled -> reverse', async () => {
    config.onSingleLeg = { action: 'Reverse', options: { limitMovePercent: 10 } };
    let i = 1;
    baRouter.refresh = jest.fn().mockImplementation(async order => {
      order.filledSize = 0.3;
      if (order.side === OrderSide.Buy) {
        order.status = OrderStatus.Filled;
        order.filledSize = 1;
      }
    });
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
    const arbitrager = new ArbitragerImpl(
      quoteAggregator,
      configStore,
      positionService,
      baRouter,
      spreadAnalyzer,
      limitCheckerFactory
    );
    positionService.isStarted = true;
    await arbitrager.start();
    await quoteAggregator.onQuoteUpdated([]);
    expect(arbitrager.status).toBe('MaxRetryCount breached');
    expect(baRouter.refresh.mock.calls.length).toBe(7);
    expect(baRouter.send.mock.calls.length).toBe(3);
    expect(baRouter.cancel.mock.calls.length).toBe(2);
  });

  test('Send and buy order unfilled and sel order partial filled -> reverse', async () => {
    config.onSingleLeg = { action: 'Reverse', options: { limitMovePercent: 10 } };
    let i = 1;
    baRouter.refresh = jest.fn().mockImplementation(async order => {
      order.filledSize = 0.3;
      if (order.side === OrderSide.Buy) {
        order.filledSize = 0;
      }
    });
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
    const arbitrager = new ArbitragerImpl(
      quoteAggregator,
      configStore,
      positionService,
      baRouter,
      spreadAnalyzer,
      limitCheckerFactory
    );
    positionService.isStarted = true;
    await arbitrager.start();
    await quoteAggregator.onQuoteUpdated([]);
    expect(arbitrager.status).toBe('MaxRetryCount breached');
    expect(baRouter.refresh.mock.calls.length).toBe(7);
    expect(baRouter.send.mock.calls.length).toBe(3);
    expect(baRouter.cancel.mock.calls.length).toBe(3);
  });

  test('Send and both orders partial filled -> reverse', async () => {
    config.onSingleLeg = { action: 'Reverse', options: { limitMovePercent: 10 } };
    let i = 1;
    baRouter.refresh = jest.fn().mockImplementation(async order => {
      order.filledSize = 0.7;
      if (order.side === OrderSide.Buy) {
        order.filledSize = 0.2;
      }
    });
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
    const arbitrager = new ArbitragerImpl(
      quoteAggregator,
      configStore,
      positionService,
      baRouter,
      spreadAnalyzer,
      limitCheckerFactory
    );
    positionService.isStarted = true;
    await arbitrager.start();
    await quoteAggregator.onQuoteUpdated([]);
    expect(arbitrager.status).toBe('MaxRetryCount breached');
    expect(baRouter.refresh.mock.calls.length).toBe(7);
    expect(baRouter.send.mock.calls.length).toBe(3);
    expect(baRouter.cancel.mock.calls.length).toBe(3);
  });

  test('Send and both orders same quantity partial filled -> reverse', async () => {
    config.onSingleLeg = { action: 'Reverse', options: { limitMovePercent: 10 } };
    let i = 1;
    baRouter.refresh = jest.fn().mockImplementation(async order => {
      order.filledSize = 0.8;
      if (order.side === OrderSide.Buy) {
        order.filledSize = 0.8;
      }
    });
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
    const arbitrager = new ArbitragerImpl(
      quoteAggregator,
      configStore,
      positionService,
      baRouter,
      spreadAnalyzer,
      limitCheckerFactory
    );
    positionService.isStarted = true;
    await arbitrager.start();
    await quoteAggregator.onQuoteUpdated([]);
    expect(arbitrager.status).toBe('MaxRetryCount breached');
    expect(baRouter.refresh.mock.calls.length).toBe(6);
    expect(baRouter.send.mock.calls.length).toBe(2);
    expect(baRouter.cancel.mock.calls.length).toBe(2);
  });

  test('Send and both orders unfilled -> reverse', async () => {
    config.onSingleLeg = { action: 'Reverse', options: { limitMovePercent: 10 } };
    let i = 1;
    baRouter.refresh = jest.fn().mockImplementation(async order => {
      order.filledSize = 0;
      if (order.side === OrderSide.Buy) {
        order.filledSize = 0;
      }
    });
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
    const arbitrager = new ArbitragerImpl(
      quoteAggregator,
      configStore,
      positionService,
      baRouter,
      spreadAnalyzer,
      limitCheckerFactory
    );
    positionService.isStarted = true;
    await arbitrager.start();
    await quoteAggregator.onQuoteUpdated([]);
    expect(arbitrager.status).toBe('MaxRetryCount breached');
    expect(baRouter.refresh.mock.calls.length).toBe(6);
    expect(baRouter.send.mock.calls.length).toBe(2);
    expect(baRouter.cancel.mock.calls.length).toBe(2);
  });

  test('Send and only buy order filled -> reverse -> fill', async () => {
    config.onSingleLeg = { action: 'Reverse', options: { limitMovePercent: 10 } };
    let i = 1;
    const fillBuy = async order => {
      order.filledSize = 0;
      if (order.side === OrderSide.Buy) {
        order.status = OrderStatus.Filled;
        order.filledSize = 1;
      }
    };
    baRouter.refresh = jest
      .fn()
      .mockImplementationOnce(fillBuy)
      .mockImplementationOnce(fillBuy)
      .mockImplementationOnce(async order => {order.status = OrderStatus.Filled});
    config.maxRetryCount = 1;
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
    const arbitrager = new ArbitragerImpl(
      quoteAggregator,
      configStore,
      positionService,
      baRouter,
      spreadAnalyzer,
      limitCheckerFactory
    );
    positionService.isStarted = true;
    await arbitrager.start();
    await quoteAggregator.onQuoteUpdated([]);
    expect(arbitrager.status).toBe('MaxRetryCount breached');
    expect(baRouter.refresh.mock.calls.length).toBe(3);
    expect(baRouter.send.mock.calls.length).toBe(3);
    expect(baRouter.cancel.mock.calls.length).toBe(1);
    baRouter.refresh.mockReset();
  });

  test('Send and only buy order filled -> reverse -> send throws', async () => {
    config.onSingleLeg = { action: 'Reverse', options: { limitMovePercent: 10 } };
    let i = 1;
    baRouter.refresh = jest.fn().mockImplementation(async order => {
      order.filledSize = 0;
      if (order.side === OrderSide.Buy) {
        order.status = OrderStatus.Filled;
        order.filledSize = 1;
      }
    });
    baRouter.send = jest
      .fn()
      .mockImplementationOnce(() => {})
      .mockImplementationOnce(() => {})
      .mockImplementationOnce(() => {
        throw new Error();
      });
    config.maxRetryCount = 3;
    spreadAnalyzer.analyze.mockReturnValue({
      bestBid: new Quote(Broker.Quoine, QuoteSide.Bid, 600, 4),
      bestAsk: new Quote(Broker.Coincheck, QuoteSide.Ask, 500, 1),
      invertedSpread: 100,
      availableVolume: 1,
      targetVolume: 1,
      targetProfit: 100
    });
    const arbitrager = new ArbitragerImpl(
      quoteAggregator,
      configStore,
      positionService,
      baRouter,
      spreadAnalyzer,
      limitCheckerFactory
    );
    positionService.isStarted = true;
    await arbitrager.start();
    await quoteAggregator.onQuoteUpdated([]);
    expect(arbitrager.status).toBe('MaxRetryCount breached');
    expect(baRouter.refresh.mock.calls.length).toBe(6);
    expect(baRouter.send.mock.calls.length).toBe(3);
    expect(baRouter.cancel.mock.calls.length).toBe(1);
    baRouter.send.mockReset();
  });

  test('Send and only sell order filled -> proceed', async () => {
    config.onSingleLeg = { action: 'Proceed', options: { limitMovePercent: 10 } };
    let i = 1;
    baRouter.refresh = jest.fn().mockImplementation(async order => {
      order.filledSize = 0;
      if (order.side === OrderSide.Sell) {
        order.status = OrderStatus.Filled;
        order.filledSize = 1;
      }
    });
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
    const arbitrager = new ArbitragerImpl(
      quoteAggregator,
      configStore,
      positionService,
      baRouter,
      spreadAnalyzer,
      limitCheckerFactory
    );
    positionService.isStarted = true;
    await arbitrager.start();
    await quoteAggregator.onQuoteUpdated([]);
    expect(arbitrager.status).toBe('MaxRetryCount breached');
    expect(baRouter.refresh.mock.calls.length).toBe(7);
    expect(baRouter.send.mock.calls.length).toBe(3);
    expect(baRouter.cancel.mock.calls.length).toBe(2);
  });

  test('Send and only buy order filled -> proceed', async () => {
    config.onSingleLeg = { action: 'Proceed', options: { limitMovePercent: 10 } };
    let i = 1;
    baRouter.refresh = jest.fn().mockImplementation(async order => {
      order.filledSize = 0;
      if (order.side === OrderSide.Buy) {
        order.status = OrderStatus.Filled;
        order.filledSize = 1;
      }
    });
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
    const arbitrager = new ArbitragerImpl(
      quoteAggregator,
      configStore,
      positionService,
      baRouter,
      spreadAnalyzer,
      limitCheckerFactory
    );
    positionService.isStarted = true;
    await arbitrager.start();
    await quoteAggregator.onQuoteUpdated([]);
    expect(arbitrager.status).toBe('MaxRetryCount breached');
    expect(baRouter.refresh.mock.calls.length).toBe(7);
    expect(baRouter.send.mock.calls.length).toBe(3);
    expect(baRouter.cancel.mock.calls.length).toBe(2);
  });

  test('Send and buy order filled and sell order partial filled -> proceed', async () => {
    config.onSingleLeg = { action: 'Proceed', options: { limitMovePercent: 10 } };
    let i = 1;
    baRouter.refresh = jest.fn().mockImplementation(async order => {
      order.filledSize = 0.3;
      if (order.side === OrderSide.Buy) {
        order.status = OrderStatus.Filled;
        order.filledSize = 1;
      }
    });
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
    const arbitrager = new ArbitragerImpl(
      quoteAggregator,
      configStore,
      positionService,
      baRouter,
      spreadAnalyzer,
      limitCheckerFactory
    );
    positionService.isStarted = true;
    await arbitrager.start();
    await quoteAggregator.onQuoteUpdated([]);
    expect(arbitrager.status).toBe('MaxRetryCount breached');
    expect(baRouter.refresh.mock.calls.length).toBe(7);
    expect(baRouter.send.mock.calls.length).toBe(3);
    expect(baRouter.cancel.mock.calls.length).toBe(2);
  });

  test('Send and buy order unfilled and sell order partial filled -> proceed', async () => {
    config.onSingleLeg = { action: 'Proceed', options: { limitMovePercent: 10 } };
    let i = 1;
    baRouter.refresh = jest.fn().mockImplementation(async order => {
      order.filledSize = 0.3;
      if (order.side === OrderSide.Buy) {
        order.filledSize = 0;
      }
    });
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
    const arbitrager = new ArbitragerImpl(
      quoteAggregator,
      configStore,
      positionService,
      baRouter,
      spreadAnalyzer,
      limitCheckerFactory
    );
    positionService.isStarted = true;
    await arbitrager.start();
    await quoteAggregator.onQuoteUpdated([]);
    expect(arbitrager.status).toBe('MaxRetryCount breached');
    expect(baRouter.refresh.mock.calls.length).toBe(7);
    expect(baRouter.send.mock.calls.length).toBe(3);
    expect(baRouter.cancel.mock.calls.length).toBe(3);
  });

  test('Send and both orders partial filled -> proceed', async () => {
    config.onSingleLeg = { action: 'Proceed', options: { limitMovePercent: 10 } };
    let i = 1;
    baRouter.refresh = jest.fn().mockImplementation(async order => {
      order.filledSize = 0.7;
      if (order.side === OrderSide.Buy) {
        order.filledSize = 0.2;
      }
    });
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
    const arbitrager = new ArbitragerImpl(
      quoteAggregator,
      configStore,
      positionService,
      baRouter,
      spreadAnalyzer,
      limitCheckerFactory
    );
    positionService.isStarted = true;
    await arbitrager.start();
    await quoteAggregator.onQuoteUpdated([]);
    expect(arbitrager.status).toBe('MaxRetryCount breached');
    expect(baRouter.refresh.mock.calls.length).toBe(7);
    expect(baRouter.send.mock.calls.length).toBe(3);
    expect(baRouter.cancel.mock.calls.length).toBe(3);
  });

  test('Send and both orders same quantity partial filled -> proceed', async () => {
    config.onSingleLeg = { action: 'Proceed', options: { limitMovePercent: 10 } };
    let i = 1;
    baRouter.refresh = jest.fn().mockImplementation(async order => {
      order.filledSize = 0.8;
      if (order.side === OrderSide.Buy) {
        order.filledSize = 0.8;
      }
    });
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
    const arbitrager = new ArbitragerImpl(
      quoteAggregator,
      configStore,
      positionService,
      baRouter,
      spreadAnalyzer,
      limitCheckerFactory
    );
    positionService.isStarted = true;
    await arbitrager.start();
    await quoteAggregator.onQuoteUpdated([]);
    expect(arbitrager.status).toBe('MaxRetryCount breached');
    expect(baRouter.refresh.mock.calls.length).toBe(6);
    expect(baRouter.send.mock.calls.length).toBe(2);
    expect(baRouter.cancel.mock.calls.length).toBe(2);
  });

  test('Send and both orders unfilled -> proceed', async () => {
    config.onSingleLeg = { action: 'Proceed', options: { limitMovePercent: 10 } };
    let i = 1;
    baRouter.refresh = jest.fn().mockImplementation(async order => {
      order.filledSize = 0;
      if (order.side === OrderSide.Buy) {
        order.filledSize = 0;
      }
    });
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
    const arbitrager = new ArbitragerImpl(
      quoteAggregator,
      configStore,
      positionService,
      baRouter,
      spreadAnalyzer,
      limitCheckerFactory
    );
    positionService.isStarted = true;
    await arbitrager.start();
    await quoteAggregator.onQuoteUpdated([]);
    expect(arbitrager.status).toBe('MaxRetryCount breached');
    expect(baRouter.refresh.mock.calls.length).toBe(6);
    expect(baRouter.send.mock.calls.length).toBe(2);
    expect(baRouter.cancel.mock.calls.length).toBe(2);
  });

  test('Send and only buy order filled -> invalid action', async () => {
    config.onSingleLeg = { action: 'Invalid', options: { limitMovePercent: 10 } };
    let i = 1;
    baRouter.refresh = jest.fn().mockImplementation(async order => {
      order.filledSize = 0;
      if (order.side === OrderSide.Buy) {
        order.status = OrderStatus.Filled;
        order.filledSize = 1;
      }
    });
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
    const arbitrager = new ArbitragerImpl(
      quoteAggregator,
      configStore,
      positionService,
      baRouter,
      spreadAnalyzer,
      limitCheckerFactory
    );
    positionService.isStarted = true;
    await arbitrager.start();
    await quoteAggregator.onQuoteUpdated([]);
    expect(arbitrager.status).toBe('Order send/refresh failed');
    expect(baRouter.refresh.mock.calls.length).toBe(6);
    expect(baRouter.send.mock.calls.length).toBe(2);
    expect(baRouter.cancel.mock.calls.length).toBe(1);
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
    const arbitrager = new ArbitragerImpl(
      quoteAggregator,
      configStore,
      positionService,
      baRouter,
      spreadAnalyzer,
      limitCheckerFactory
    );
    positionService.isStarted = true;
    await arbitrager.start();
    await quoteAggregator.onQuoteUpdated([]);
    expect(arbitrager.status).toBe('MaxRetryCount breached');
  });

  test('Send throws', async () => {
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
    baRouter.send = () => {
      throw new Error('Mock refresh error.');
    };
    const arbitrager = new ArbitragerImpl(
      quoteAggregator,
      configStore,
      positionService,
      baRouter,
      spreadAnalyzer,
      limitCheckerFactory
    );
    positionService.isStarted = true;
    await arbitrager.start();
    await quoteAggregator.onQuoteUpdated([]);
    expect(arbitrager.status).toBe('Order send/refresh failed');
  });

  test('Send throws', async () => {
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
    baRouter.send = () => {
      throw new Error('Mock error: insufficient balance');
    };
    const arbitrager = new ArbitragerImpl(
      quoteAggregator,
      configStore,
      positionService,
      baRouter,
      spreadAnalyzer,
      limitCheckerFactory
    );
    positionService.isStarted = true;
    await arbitrager.start();
    await quoteAggregator.onQuoteUpdated([]);
    await quoteAggregator.onQuoteUpdated([]);
    expect(arbitrager.shouldStop).toBe(true);
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
    baRouter.refresh = () => {
      throw new Error('Mock refresh error.');
    };
    const arbitrager = new ArbitragerImpl(
      quoteAggregator,
      configStore,
      positionService,
      baRouter,
      spreadAnalyzer,
      limitCheckerFactory
    );
    positionService.isStarted = true;
    await arbitrager.start();
    await quoteAggregator.onQuoteUpdated([]);
    expect(arbitrager.status).toBe('MaxRetryCount breached');
  });

  test('Send and filled', async () => {
    baRouter.refresh.mockImplementation(order => (order.status = OrderStatus.Filled));
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
    const arbitrager = new ArbitragerImpl(
      quoteAggregator,
      configStore,
      positionService,
      baRouter,
      spreadAnalyzer,
      limitCheckerFactory
    );
    positionService.isStarted = true;
    await arbitrager.start();
    await quoteAggregator.onQuoteUpdated([]);
    expect(arbitrager.status).toBe('Filled');
  });

  test('Send and filled with commission', async () => {
    baRouter.refresh.mockImplementation(order => (order.status = OrderStatus.Filled));
    config.maxRetryCount = 3;
    config.brokers[0].commissionPercent = 0.1;
    config.brokers[1].commissionPercent = 0.2;
    config.brokers[2].commissionPercent = 0.3;
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
    const arbitrager = new ArbitragerImpl(
      quoteAggregator,
      configStore,
      positionService,
      baRouter,
      spreadAnalyzer,
      limitCheckerFactory
    );
    positionService.isStarted = true;
    await arbitrager.start();
    await quoteAggregator.onQuoteUpdated([]);
    expect(arbitrager.status).toBe('Filled');
  });

  test('Close filled orders', async () => {
    const quotes = [
      new Quote(Broker.Quoine, QuoteSide.Ask, 700, 4),
      new Quote(Broker.Quoine, QuoteSide.Bid, 600, 4),
      new Quote(Broker.Coincheck, QuoteSide.Ask, 500, 1),
      new Quote(Broker.Coincheck, QuoteSide.Bid, 400, 1)
    ];
    baRouter.refresh.mockImplementation(order => (order.status = OrderStatus.Filled));
    config.maxRetryCount = 3;
    config.minTargetProfit = 50;
    config.minExitTargetProfit = -1000;
    const spreadAnalyzer = new SpreadAnalyzerImpl(configStore);
    const arbitrager = new ArbitragerImpl(
      quoteAggregator,
      configStore,
      positionService,
      baRouter,
      spreadAnalyzer,
      limitCheckerFactory
    );
    positionService.isStarted = true;
    await arbitrager.start();
    await quoteAggregator.onQuoteUpdated(quotes);
    expect(arbitrager.status).toBe('Filled');
    expect(arbitrager.activePairs.length).toBe(1);
    // closing
    await quoteAggregator.onQuoteUpdated(quotes);
    expect(arbitrager.status).toBe('Closed');
    expect(arbitrager.activePairs.length).toBe(0);
  });

  test('Close filled orders with minExitTargetProfitPercent', async () => {
    const quotes = [
      new Quote(Broker.Quoine, QuoteSide.Ask, 700, 4),
      new Quote(Broker.Quoine, QuoteSide.Bid, 600, 4),
      new Quote(Broker.Coincheck, QuoteSide.Ask, 500, 1),
      new Quote(Broker.Coincheck, QuoteSide.Bid, 400, 1)
    ];
    baRouter.refresh.mockImplementation(order => (order.status = OrderStatus.Filled));
    config.maxRetryCount = 3;
    config.minTargetProfit = 50;
    config.minExitTargetProfitPercent = -80;
    const spreadAnalyzer = new SpreadAnalyzerImpl(configStore);
    const arbitrager = new ArbitragerImpl(
      quoteAggregator,
      configStore,
      positionService,
      baRouter,
      spreadAnalyzer,
      limitCheckerFactory
    );
    positionService.isStarted = true;
    await arbitrager.start();
    await quoteAggregator.onQuoteUpdated(quotes);
    expect(arbitrager.status).toBe('Filled');
    expect(arbitrager.activePairs.length).toBe(1);
    // closing
    await quoteAggregator.onQuoteUpdated(quotes);
    expect(arbitrager.status).toBe('Closed');
    expect(arbitrager.activePairs.length).toBe(0);
  });

  test('Not close filled orders with minExitTargetProfitPercent', async () => {
    const quotes = [
      new Quote(Broker.Quoine, QuoteSide.Ask, 700, 4),
      new Quote(Broker.Quoine, QuoteSide.Bid, 600, 4),
      new Quote(Broker.Coincheck, QuoteSide.Ask, 500, 1),
      new Quote(Broker.Coincheck, QuoteSide.Bid, 400, 1)
    ];
    baRouter.refresh.mockImplementation(order => (order.status = OrderStatus.Filled));
    config.maxRetryCount = 3;
    config.minTargetProfit = 50;
    config.minExitTargetProfitPercent = -20;
    const spreadAnalyzer = new SpreadAnalyzerImpl(configStore);
    const arbitrager = new ArbitragerImpl(
      quoteAggregator,
      configStore,
      positionService,
      baRouter,
      spreadAnalyzer,
      limitCheckerFactory
    );
    positionService.isStarted = true;
    await arbitrager.start();
    await quoteAggregator.onQuoteUpdated(quotes);
    expect(arbitrager.status).toBe('Filled');
    expect(arbitrager.activePairs.length).toBe(1);
    // closing
    await quoteAggregator.onQuoteUpdated(quotes);
    expect(arbitrager.status).toBe('Filled');
    expect(arbitrager.activePairs.length).toBe(2);
  });

  test('Close two filled orders', async () => {
    const quotes = [
      new Quote(Broker.Quoine, QuoteSide.Ask, 700, 4),
      new Quote(Broker.Quoine, QuoteSide.Bid, 600, 4),
      new Quote(Broker.Coincheck, QuoteSide.Ask, 500, 1),
      new Quote(Broker.Coincheck, QuoteSide.Bid, 400, 1)
    ];
    baRouter.refresh.mockImplementation(order => (order.status = OrderStatus.Filled));
    config.maxRetryCount = 3;
    config.minTargetProfit = 50;
    config.minExitTargetProfit = -200;
    const spreadAnalyzer = new SpreadAnalyzerImpl(configStore);
    const arbitrager = new ArbitragerImpl(
      quoteAggregator,
      configStore,
      positionService,
      baRouter,
      spreadAnalyzer,
      limitCheckerFactory
    );
    positionService.isStarted = true;
    await arbitrager.start();
    await quoteAggregator.onQuoteUpdated(quotes);
    expect(arbitrager.status).toBe('Filled');
    expect(arbitrager.activePairs.length).toBe(1);
    await quoteAggregator.onQuoteUpdated(quotes);
    expect(arbitrager.status).toBe('Filled');
    expect(arbitrager.activePairs.length).toBe(2);

    //closing
    const quotes2 = [
      new Quote(Broker.Quoine, QuoteSide.Ask, 620, 4),
      new Quote(Broker.Quoine, QuoteSide.Bid, 600, 4),
      new Quote(Broker.Coincheck, QuoteSide.Ask, 500, 1),
      new Quote(Broker.Coincheck, QuoteSide.Bid, 450, 1)
    ];
    await quoteAggregator.onQuoteUpdated(quotes2);
    expect(arbitrager.status).toBe('Closed');
    expect(arbitrager.activePairs.length).toBe(1);
    await quoteAggregator.onQuoteUpdated(quotes2);
    expect(arbitrager.status).toBe('Closed');
    expect(arbitrager.activePairs.length).toBe(0);
  });

  test('Closing filled orders with no lastResult in spread analyzer', async () => {
    const quotes = [
      new Quote(Broker.Quoine, QuoteSide.Ask, 700, 4),
      new Quote(Broker.Quoine, QuoteSide.Bid, 600, 4),
      new Quote(Broker.Coincheck, QuoteSide.Ask, 500, 1),
      new Quote(Broker.Coincheck, QuoteSide.Bid, 400, 1)
    ];
    baRouter.refresh.mockImplementation(order => (order.status = OrderStatus.Filled));
    config.maxRetryCount = 3;
    config.minTargetProfit = 50;
    config.minExitTargetProfit = -1000;
    const spreadAnalyzer = new SpreadAnalyzerImpl(configStore);
    const arbitrager = new ArbitragerImpl(
      quoteAggregator,
      configStore,
      positionService,
      baRouter,
      spreadAnalyzer,
      limitCheckerFactory
    );
    positionService.isStarted = true;
    await arbitrager.start();
    await quoteAggregator.onQuoteUpdated(quotes);
    expect(arbitrager.status).toBe('Filled');
    expect(arbitrager.activePairs.length).toBe(1);
    // closing
    await quoteAggregator.onQuoteUpdated(quotes);
    expect(arbitrager.status).toBe('Closed');
    expect(arbitrager.activePairs.length).toBe(0);
  });

  test('Closing filled orders when spread analyzer throws', async () => {
    const quotes = [
      new Quote(Broker.Quoine, QuoteSide.Ask, 700, 4),
      new Quote(Broker.Quoine, QuoteSide.Bid, 600, 4),
      new Quote(Broker.Coincheck, QuoteSide.Ask, 500, 1),
      new Quote(Broker.Coincheck, QuoteSide.Bid, 400, 1)
    ];
    baRouter.refresh.mockImplementation(order => (order.status = OrderStatus.Filled));
    config.maxRetryCount = 3;
    config.minTargetProfit = 50;
    config.minExitTargetProfit = -1000;
    const spreadAnalyzer = new SpreadAnalyzerImpl(configStore);
    const arbitrager = new ArbitragerImpl(
      quoteAggregator,
      configStore,
      positionService,
      baRouter,
      spreadAnalyzer,
      limitCheckerFactory
    );
    positionService.isStarted = true;
    await arbitrager.start();
    await quoteAggregator.onQuoteUpdated(quotes);
    expect(arbitrager.status).toBe('Filled');
    expect(arbitrager.activePairs.length).toBe(1);
    // closing
    await quoteAggregator.onQuoteUpdated([]);
    expect(arbitrager.status).toBe('Spread analysis failed');
    expect(arbitrager.activePairs.length).toBe(1);
  });
});
