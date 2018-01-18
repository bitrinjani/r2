import SpreadAnalyzer from './SpreadAnalyzer';
import { injectable, inject } from 'inversify';
import symbols from './symbols';
import { SpreadStatTimeSeries, Quote, ConfigStore } from './types';
import QuoteAggregator from './QuoteAggregator';
import { spreadStatToCsv, spreadStatCsvHeader } from './SpreadStatTimeSeries';
import * as fs from 'fs';
import * as mkdirp from 'mkdirp';
import { promisify } from 'util';
import { socket, Socket } from 'zeromq';
import { fork, ChildProcess } from 'child_process';
import { subDays } from 'date-fns';
import { reportServicePubUrl, reportServiceRepUrl } from './constants';
import { getLogger } from '@bitr/logger';

// patch for @types/zeromq
interface ZmqSocket extends Socket {
  removeAllListeners: any;
}

const writeFile = promisify(fs.writeFile);

@injectable()
export default class ReportService {
  private readonly log = getLogger(this.constructor.name);
  private readonly computeEnginePath = `${__dirname}/ComputeEngine`;
  private readonly nDaysForSnapshot = 3;
  private readonly reportDir = `${process.cwd()}/reports`;
  private readonly spreadStatReport = `${this.reportDir}/spreadStat.csv`;
  private readonly spreadStatWriteStream: fs.WriteStream;
  private readonly streamPublisher: ZmqSocket;
  private readonly snapshotResponder: ZmqSocket;
  private computeEngineProcess: ChildProcess;

  constructor(
    private readonly quoteAggregator: QuoteAggregator,
    private readonly spreadAnalyzer: SpreadAnalyzer,
    @inject(symbols.SpreadStatTimeSeries) private readonly spreadStatTimeSeries: SpreadStatTimeSeries,
    @inject(symbols.ConfigStore) private readonly configStore: ConfigStore
  ) {
    this.spreadStatWriteStream = fs.createWriteStream(this.spreadStatReport, { flags: 'a' });
    this.snapshotResponder = socket('rep') as ZmqSocket;
    this.streamPublisher = socket('pub') as ZmqSocket;
  }

  async start() {
    this.log.debug('Starting ReportService...');
    mkdirp.sync(this.reportDir);
    if (!fs.existsSync(this.spreadStatReport)) {
      await writeFile(this.spreadStatReport, spreadStatCsvHeader, { flag: 'a' });
    }
    this.quoteAggregator.onQuoteUpdated.set(this.constructor.name, quotes => this.quoteUpdated(quotes));
    const { analytics } = this.configStore.config;
    if (analytics && analytics.enabled) {
      const start = subDays(new Date(), analytics.days || this.nDaysForSnapshot);
      const end = new Date();
      const snapshot = await this.spreadStatTimeSeries.query({ start, end });
      this.snapshotResponder.on('message', request => {
        if (request.toString() === 'spreadStatSnapshot') {
          this.snapshotResponder.send(JSON.stringify(snapshot.map(s => s.value)));
        }
      });
      this.streamPublisher.bindSync(reportServicePubUrl);
      this.snapshotResponder.bindSync(reportServiceRepUrl);
      this.computeEngineProcess = fork(this.computeEnginePath, [], { stdio: [0, 1, 2, 'ipc'] });
    }
    this.log.debug('Started.');
  }

  async stop() {
    this.log.debug('Stopping ReportService...');
    this.quoteAggregator.onQuoteUpdated.delete(this.constructor.name);
    this.spreadStatWriteStream.close();
    const { analytics } = this.configStore.config;
    if (analytics && analytics.enabled) {
      await promisify(this.computeEngineProcess.send).bind(this.computeEngineProcess)('stop');
      this.computeEngineProcess.kill();
      this.streamPublisher.unbindSync(reportServicePubUrl);
      this.streamPublisher.removeAllListeners('message');
      this.snapshotResponder.unbindSync(reportServiceRepUrl);
      this.snapshotResponder.removeAllListeners('message');
    }
    this.streamPublisher.close();
    this.snapshotResponder.close();
    this.log.debug('Stopped.');
  }

  private async quoteUpdated(quotes: Quote[]): Promise<void> {
    const stat = await this.spreadAnalyzer.getSpreadStat(quotes);
    if (stat) {
      await this.spreadStatTimeSeries.put(stat);
      await promisify(this.spreadStatWriteStream.write).bind(this.spreadStatWriteStream)(spreadStatToCsv(stat));
      const { analytics } = this.configStore.config;
      if (analytics && analytics.enabled) {
        this.streamPublisher.send(['spreadStat', JSON.stringify(stat)]);
      }
    }
  }
} /* istanbul ignore next */
