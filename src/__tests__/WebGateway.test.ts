import WebGateway from '../WebGateway';
import { delay } from '../util';
import { EventEmitter } from 'events';
import * as WebSocket from 'ws';

describe('WebGateway', () => {
  let quoteAggregator, positionService, opportunitySearcher, activePairStore, orderService;

  beforeEach(() => {
    quoteAggregator = new EventEmitter();
    positionService = new EventEmitter();
    opportunitySearcher = new EventEmitter();
    activePairStore = new EventEmitter();
    activePairStore.getAll = jest.fn().mockImplementation(() => []);
    orderService = new EventEmitter();
  });

  test('start, stop - not enabled', async () => {
    const config = { webGateway: { enabled: false } };
    const configStore = new EventEmitter() as any;
    configStore.config = config;
    const wg = new WebGateway(
      quoteAggregator,
      configStore,
      positionService,
      opportunitySearcher,
      activePairStore,
      orderService
    );
    await wg.start();
    await delay(0);
    await wg.stop();
    await delay(0);
  });

  test('start, stop - enabled', async () => {
    const config = { webGateway: { enabled: true }, brokers: [{ key: 'key', secret: 'secret' }] };
    const configStore = new EventEmitter() as any;
    configStore.config = config;
    const wg = new WebGateway(
      quoteAggregator,
      configStore,
      positionService,
      opportunitySearcher,
      activePairStore,
      orderService
    );
    try {
      await wg.start();
      await delay(0);
    } finally {
      await wg.stop();
      await delay(0);
    }
  });

  test('emit events', async () => {
    const config = { webGateway: { enabled: true }, brokers: [{ key: 'key', secret: 'secret' }] };
    const configStore = new EventEmitter() as any;
    configStore.config = config;
    const wg = new WebGateway(
      quoteAggregator,
      configStore,
      positionService,
      opportunitySearcher,
      activePairStore,
      orderService
    );
    let ws;
    try {
      await wg.start();
      await delay(10);
      ws = new WebSocket('ws://localhost:8720');
      await delay(10);
      quoteAggregator.emit('quoteUpdated');
      positionService.emit('positionUpdated');
      opportunitySearcher.emit('spreadAnalysisDone');
      opportunitySearcher.emit('limitCheckDone');
      activePairStore.emit('change');
      orderService.emit('orderCreated');
      orderService.emit('orderUpdated');
      orderService.emit('orderFinalized');
      configStore.emit('configUpdated', config);
      await delay(0);
    } finally {
      ws.close();
      await wg.stop();
      await delay(0);
    }
  });

  test('emit events - no ws client', async () => {
    const config = { webGateway: { enabled: true }, brokers: [{ key: 'key', secret: 'secret' }] };
    const configStore = new EventEmitter() as any;
    configStore.config = config;
    const wg = new WebGateway(
      quoteAggregator,
      configStore,
      positionService,
      opportunitySearcher,
      activePairStore,
      orderService
    );
    try {
      await wg.start();
      await delay(10);
      await delay(10);
      quoteAggregator.emit('quoteUpdated');
      await delay(0);
    } finally {
      await wg.stop();
      await delay(0);
    }
  });
});
