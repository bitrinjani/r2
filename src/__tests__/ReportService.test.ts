import ReportService from '../ReportService';
import * as rimraf from 'rimraf';
import * as mkdirp from 'mkdirp';
import { toQuote, cwd, parseBuffer } from '../util';
import { QuoteSide } from '../types';
import SpreadAnalyzer from '../SpreadAnalyzer';
import { socket } from 'zeromq';
import { reportServiceRepUrl } from '../constants';

describe('ReportService', () => {
  afterAll(() => {
    // delete sandbox
    rimraf.sync(cwd());
  });

  test('start/stop', async () => {
    const quoteAggregator = { onQuoteUpdated: new Map() };
    const spreadAnalyzer = { getSpreadStat: jest.fn() };
    const timeSeries = { put: jest.fn() };
    const config = {};

    const rs = new ReportService(quoteAggregator, spreadAnalyzer, timeSeries, { config });
    rimraf.sync(rs.reportDir);
    await rs.start();
    expect(quoteAggregator.onQuoteUpdated.size).toBe(1);
    await rs.stop();
    expect(quoteAggregator.onQuoteUpdated.size).toBe(0);
  });

  test('start/stop with existing dir', async () => {
    const quoteAggregator = { onQuoteUpdated: new Map() };
    const spreadAnalyzer = { getSpreadStat: jest.fn() };
    const timeSeries = { put: jest.fn() };
    const config = {};

    const rs = new ReportService(quoteAggregator, spreadAnalyzer, timeSeries, { config });
    mkdirp.sync(rs.reportDir);
    await rs.start();
    expect(quoteAggregator.onQuoteUpdated.size).toBe(1);
    await rs.stop();
    expect(quoteAggregator.onQuoteUpdated.size).toBe(0);
  });

  test('fire event', async () => {
    const quoteAggregator = { onQuoteUpdated: new Map() };
    const spreadAnalyzer = { getSpreadStat: jest.fn() };
    const timeSeries = { put: jest.fn() };
    const config = {};

    const rs = new ReportService(quoteAggregator, spreadAnalyzer, timeSeries, { config });
    mkdirp.sync(rs.reportDir);
    await rs.start();
    expect(quoteAggregator.onQuoteUpdated.size).toBe(1);
    await quoteAggregator.onQuoteUpdated.get(ReportService.name)([]);
    await rs.stop();
    expect(quoteAggregator.onQuoteUpdated.size).toBe(0);
  });

  test('fire event 2', async () => {
    const quoteAggregator = { onQuoteUpdated: new Map() };
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
    expect(quoteAggregator.onQuoteUpdated.size).toBe(1);
    await quoteAggregator.onQuoteUpdated.get(ReportService.name)([
      toQuote('Coincheck', QuoteSide.Ask, 3, 1),
      toQuote('Coincheck', QuoteSide.Bid, 2, 2),
      toQuote('Quoine', QuoteSide.Ask, 3.5, 3),
      toQuote('Quoine', QuoteSide.Bid, 2.5, 4)
    ]);
    await rs.stop();
    expect(quoteAggregator.onQuoteUpdated.size).toBe(0);
  });

  test('start/stop with analytics', async () => {
    const quoteAggregator = { onQuoteUpdated: new Map() };
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
    await rs.start();
    expect(quoteAggregator.onQuoteUpdated.size).toBe(1);
    await rs.stop();
    expect(quoteAggregator.onQuoteUpdated.size).toBe(0);
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
    const quoteAggregator = { onQuoteUpdated: new Map() };
    const spreadAnalyzer = new SpreadAnalyzer({ config });
    const timeSeries = { put: jest.fn(), query: jest.fn() };

    const rs = new ReportService(quoteAggregator, spreadAnalyzer, timeSeries, { config });
    mkdirp.sync(rs.reportDir);
    await rs.start();
    expect(quoteAggregator.onQuoteUpdated.size).toBe(1);
    await quoteAggregator.onQuoteUpdated.get(ReportService.name)([
      toQuote('Coincheck', QuoteSide.Ask, 3, 1),
      toQuote('Coincheck', QuoteSide.Bid, 2, 2),
      toQuote('Quoine', QuoteSide.Ask, 3.5, 3),
      toQuote('Quoine', QuoteSide.Bid, 2.5, 4)
    ]);
    await rs.stop();
    expect(quoteAggregator.onQuoteUpdated.size).toBe(0);
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
    const quoteAggregator = { onQuoteUpdated: new Map() };
    const spreadAnalyzer = new SpreadAnalyzer({ config });
    const timeSeries = { put: jest.fn(), query: () => ['dummy'] };

    const rs = new ReportService(quoteAggregator, spreadAnalyzer, timeSeries, { config });
    mkdirp.sync(rs.reportDir);
    await rs.start();
    const client = socket('req');
    client.connect(reportServiceRepUrl);
    const reply = await new Promise(resolve => {
      client.once('message', resolve);
      client.send('spreadStatSnapshot');
    });
    await rs.stop();
    client.close();
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
    const quoteAggregator = { onQuoteUpdated: new Map() };
    const spreadAnalyzer = new SpreadAnalyzer({ config });
    const timeSeries = { put: jest.fn(), query: () => [] };

    const rs = new ReportService(quoteAggregator, spreadAnalyzer, timeSeries, { config });
    mkdirp.sync(rs.reportDir);
    await rs.start();
    const client = socket('req');
    client.connect(reportServiceRepUrl);
    const reply = await new Promise(resolve => {
      client.once('message', resolve);
      client.send('invalid');
    });
    expect(parseBuffer(reply).success).toBe(false);
    await rs.stop();
    client.close();
  });
});
