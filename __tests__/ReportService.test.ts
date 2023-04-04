import ReportService from '../ReportService';
import * as rimraf from 'rimraf';
import * as mkdirp from 'mkdirp';
import { toQuote, cwd } from '../util';
import { QuoteSide } from '../types';
import SpreadAnalyzer from '../SpreadAnalyzer';
import { socket } from 'zeromq';
import { reportServiceRepUrl } from '../constants';
import { SnapshotRequester } from '../messages';
import QuoteAggregator from '../QuoteAggregator';
import { AwaitableEventEmitter } from '@bitr/awaitable-event-emitter';

function createQuoteAggregatorMock() {
  const aee: QuoteAggregator = new AwaitableEventEmitter();
  aee.start = jest.fn();
  aee.stop = jest.fn();
  return aee as QuoteAggregator;
}

describe('ReportService', () => {
  afterAll(() => {
    // delete sandbox
    rimraf.sync(cwd());
  });

  test('start/stop', async () => {
    const quoteAggregator = createQuoteAggregatorMock();
    const spreadAnalyzer = { getSpreadStat: jest.fn() };
    const timeSeries = { put: jest.fn() };
    const config = {};

    const rs = new ReportService(quoteAggregator, spreadAnalyzer, timeSeries, { config });
    rimraf.sync(rs.reportDir);
    await rs.start();
    expect(quoteAggregator.listenerCount('quoteUpdated')).toBe(1);
    await rs.stop();
    expect(quoteAggregator.listenerCount('quoteUpdated')).toBe(0);
  });

  test('start/stop with existing dir', async () => {
    const quoteAggregator = createQuoteAggregatorMock();
    const spreadAnalyzer = { getSpreadStat: jest.fn() };
    const timeSeries = { put: jest.fn() };
    const config = {};

    const rs = new ReportService(quoteAggregator, spreadAnalyzer, timeSeries, { config });
    mkdirp.sync(rs.reportDir);
    await rs.start();
    expect(quoteAggregator.listenerCount('quoteUpdated')).toBe(1);
    await rs.stop();
    expect(quoteAggregator.listenerCount('quoteUpdated')).toBe(0);
  });

  test('fire event', async () => {
    const quoteAggregator = createQuoteAggregatorMock();
    const spreadAnalyzer = { getSpreadStat: jest.fn() };
    const timeSeries = { put: jest.fn() };
    const config = {};

    const rs = new ReportService(quoteAggregator, spreadAnalyzer, timeSeries, { config });
    mkdirp.sync(rs.reportDir);
    await rs.start();
    expect(quoteAggregator.listenerCount('quoteUpdated')).toBe(1);
    await quoteAggregator.emitParallel('quoteUpdated', []);
    await rs.stop();
    expect(quoteAggregator.listenerCount('quoteUpdated')).toBe(0);
  });

  test('fire event 2', async () => {
    const quoteAggregator = createQuoteAggregatorMock();
    const spreadAnalyzer = new SpreadAnalyzer({
      config: {
        minSize: 0.005,
        maxSize: 100,
        brokers: [{ broker: 'Coincheck', commissionPercent: 0 }, { broker: 'Quoine', commissionPercent: 0 }]
      }
    } as any);
    const timeSeries = { put: jest.fn() };
    const config = {};

    const rs = new ReportService(quoteAggregator, spreadAnalyzer, timeSeries, { config });
    mkdirp.sync(rs.reportDir);
    await rs.start();
    expect(quoteAggregator.listenerCount('quoteUpdated')).toBe(1);
    await quoteAggregator.emitParallel('quoteUpdated', [
      toQuote('Coincheck', QuoteSide.Ask, 3, 1),
      toQuote('Coincheck', QuoteSide.Bid, 2, 2),
      toQuote('Quoine', QuoteSide.Ask, 3.5, 3),
      toQuote('Quoine', QuoteSide.Bid, 2.5, 4)
    ]);
    await rs.stop();
    expect(quoteAggregator.listenerCount('quoteUpdated')).toBe(0);
  });

  test('start/stop with analytics', async () => {
    const quoteAggregator = createQuoteAggregatorMock();
    const spreadAnalyzer = { getSpreadStat: jest.fn() };
    const timeSeries = { put: jest.fn(), query: jest.fn() };
    const config = {
      analytics: {
        enabled: true,
        plugin: 'SimpleSpreadStatHandler.js',
        initialHistory: { minutes: 10 }
      }
    };

    const rs = new ReportService(quoteAggregator, spreadAnalyzer, timeSeries, { config });
    rimraf.sync(rs.reportDir);
    try {
      await rs.start();
      expect(quoteAggregator.listenerCount('quoteUpdated')).toBe(1);
      await rs.stop();
      expect(quoteAggregator.listenerCount('quoteUpdated')).toBe(0);
    } catch (ex) {
      if (process.env.CI && ex.message === 'Address already in use') return;
      expect(true).toBe(false);
    }
  });

  test('fire event with analytics', async () => {
    const config = {
      minSize: 0.005,
      maxSize: 100,
      analytics: {
        enabled: true,
        plugin: 'SimpleSpreadStatHandler.js',
        initialHistory: { minutes: 10 }
      },
      brokers: [{ broker: 'Coincheck', commissionPercent: 0 }, { broker: 'Quoine', commissionPercent: 0 }]
    };
    const quoteAggregator = createQuoteAggregatorMock();
    const spreadAnalyzer = new SpreadAnalyzer({ config });
    const timeSeries = { put: jest.fn(), query: jest.fn() };

    const rs = new ReportService(quoteAggregator, spreadAnalyzer, timeSeries, { config });
    mkdirp.sync(rs.reportDir);
    try {
      await rs.start();
      expect(quoteAggregator.listenerCount('quoteUpdated')).toBe(1);
      await quoteAggregator.emitParallel('quoteUpdated', [
        toQuote('Coincheck', QuoteSide.Ask, 3, 1),
        toQuote('Coincheck', QuoteSide.Bid, 2, 2),
        toQuote('Quoine', QuoteSide.Ask, 3.5, 3),
        toQuote('Quoine', QuoteSide.Bid, 2.5, 4)
      ]);
      await rs.stop();
      expect(quoteAggregator.listenerCount('quoteUpdated')).toBe(0);
    } catch (ex) {
      if (process.env.CI && ex.message === 'Address already in use') return;
      expect(true).toBe(false);
    }
  });

  test('respond snapshot request', async () => {
    const config = {
      minSize: 0.005,
      maxSize: 100,
      analytics: {
        enabled: true,
        plugin: 'SimpleSpreadStatHandler.js',
        initialHistory: { minutes: 10 }
      },
      brokers: [{ broker: 'Coincheck', commissionPercent: 0 }, { broker: 'Quoine', commissionPercent: 0 }]
    };
    const quoteAggregator = createQuoteAggregatorMock();
    const spreadAnalyzer = new SpreadAnalyzer({ config });
    const timeSeries = { put: jest.fn(), query: () => [{ value: 'dummy' }] };

    const rs = new ReportService(quoteAggregator, spreadAnalyzer, timeSeries, { config });
    mkdirp.sync(rs.reportDir);
    let client;
    try {
      await rs.start();
      client = new SnapshotRequester(reportServiceRepUrl);
      const reply = await client.request({ type: 'spreadStatSnapshot' });
      expect(reply.success).toBe(true);
      expect(reply.data).toEqual(['dummy']);
      await rs.stop();
    } catch (ex) {
      if (process.env.CI && ex.message === 'Address already in use') return;
      expect(true).toBe(false);
    } finally {
      if (client) client.dispose();
    }
  });

  test('invalid request', async () => {
    const config = {
      minSize: 0.005,
      maxSize: 100,
      analytics: {
        enabled: true,
        plugin: 'SimpleSpreadStatHandler.js',
        initialHistory: { minutes: 10 }
      },
      brokers: [{ broker: 'Coincheck', commissionPercent: 0 }, { broker: 'Quoine', commissionPercent: 0 }]
    };
    const quoteAggregator = createQuoteAggregatorMock();
    const spreadAnalyzer = new SpreadAnalyzer({ config });
    const timeSeries = { put: jest.fn(), query: () => [] };

    const rs = new ReportService(quoteAggregator, spreadAnalyzer, timeSeries, { config });
    mkdirp.sync(rs.reportDir);
    let client;
    try {
      await rs.start();
      client = new SnapshotRequester(reportServiceRepUrl);
      const reply = await client.request('invalid');
      expect(reply.success).toBe(false);
      await rs.stop();
    } catch (ex) {
      if (process.env.CI && ex.message === 'Address already in use') return;
      expect(true).toBe(false);
    } finally {
      if (client) client.dispose();
    }
  });
});
