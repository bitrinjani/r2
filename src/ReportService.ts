import SpreadAnalyzer from './SpreadAnalyzer';
import { injectable, inject } from 'inversify';
import symbols from './symbols';
import {
  SpreadStatTimeSeries,
  Quote,
  ConfigStore,
  ZmqSocket
} from './types';
import QuoteAggregator from './QuoteAggregator';
import { spreadStatToCsv, spreadStatCsvHeader } from './SpreadStatTimeSeries';
import * as fs from 'fs';
import * as mkdirp from 'mkdirp';
import { promisify } from 'util';
import { socket } from 'zeromq';
import { fork, ChildProcess } from 'child_process';
import { reportServicePubUrl, reportServiceRepUrl } from './constants';
import { getLogger } from '@bitr/logger';
import { cwd } from './util';
import { Duration, DateTime } from 'luxon';
import { SnapshotResponder } from './messages';

const writeFile = promisify(fs.writeFile);

@injectable()
export default class ReportService {
  private readonly log = getLogger(this.constructor.name);
  private readonly analyticsPath = `${__dirname}/analytics`;
  private readonly reportDir = `${cwd()}/reports`;
  private readonly spreadStatReport = `${this.reportDir}/spreadStat.csv`;
  private spreadStatWriteStream: fs.WriteStream;
  private readonly streamPublisher: ZmqSocket;
  private snapshotResponder: SnapshotResponder;
  private analyticsProcess: ChildProcess;

  constructor(
    private readonly quoteAggregator: QuoteAggregator,
    private readonly spreadAnalyzer: SpreadAnalyzer,
    @inject(symbols.SpreadStatTimeSeries) private readonly spreadStatTimeSeries: SpreadStatTimeSeries,
    @inject(symbols.ConfigStore) private readonly configStore: ConfigStore
  ) {
    this.streamPublisher = socket('pub') as ZmqSocket;
  }

  async start() {
    this.log.debug('Starting ReportService...');
    mkdirp.sync(this.reportDir);
    if (!fs.existsSync(this.spreadStatReport)) {
      await writeFile(this.spreadStatReport, spreadStatCsvHeader, { flag: 'a' });
    }
    this.spreadStatWriteStream = fs.createWriteStream(this.spreadStatReport, { flags: 'a' });
    this.quoteAggregator.onQuoteUpdated.set(this.constructor.name, quotes => this.quoteUpdated(quotes));
    const { analytics } = this.configStore.config;
    if (analytics && analytics.enabled) {
      const duration = Duration.fromObject(analytics.initialHistory);
      const dt = DateTime.local();
      const start = dt.minus(duration).toJSDate();
      const end = dt.toJSDate();
      const snapshot = await this.spreadStatTimeSeries.query({ start, end });
      this.snapshotResponder = new SnapshotResponder(reportServiceRepUrl, (request, respond) => {
        if (request && request.type === 'spreadStatSnapshot') {
          respond({ success: true, data: snapshot.map(s => s.value) });
        } else {
          respond({ success: false, reason: 'invalid request' });
        }
      });
      this.streamPublisher.bindSync(reportServicePubUrl);
      this.analyticsProcess = fork(this.analyticsPath, [], { stdio: [0, 1, 2, 'ipc'] });
    }
    this.log.debug('Started.');
  }

  async stop() {
    this.log.debug('Stopping ReportService...');
    this.quoteAggregator.onQuoteUpdated.delete(this.constructor.name);
    this.spreadStatWriteStream.close();
    if (this.analyticsProcess) {
      await promisify(this.analyticsProcess.send).bind(this.analyticsProcess)('stop');
      this.analyticsProcess.kill();
      this.streamPublisher.unbindSync(reportServicePubUrl);
      this.streamPublisher.removeAllListeners('message');
      this.snapshotResponder.dispose();
    }
    this.streamPublisher.close();
    this.log.debug('Stopped.');
  }

  private async quoteUpdated(quotes: Quote[]): Promise<void> {
    const stat = await this.spreadAnalyzer.getSpreadStat(quotes);
    if (stat) {
      await this.spreadStatTimeSeries.put(stat);
      await promisify(this.spreadStatWriteStream.write).bind(this.spreadStatWriteStream)(spreadStatToCsv(stat));
      const { analytics } = this.configStore.config;
      if (analytics && analytics.enabled && this.analyticsProcess.connected) {
        this.streamPublisher.send(['spreadStat', JSON.stringify(stat)]);
      }
    }
  }
} /* istanbul ignore next */
