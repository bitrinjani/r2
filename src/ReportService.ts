import SpreadAnalyzer from './SpreadAnalyzer';
import { injectable, inject } from 'inversify';
import symbols from './symbols';
import { SpreadStatTimeSeries, Quote } from './types';
import QuoteAggregator from './QuoteAggregator';
import { spreadStatToCsv, spreadStatCsvHeader } from './SpreadStatTimeSeries';
import * as fs from 'fs';
import * as mkdirp from 'mkdirp';
import { promisify } from 'util';

const writeFile = promisify(fs.writeFile);

@injectable()
export default class ReportService {
  private reportDir = `${process.cwd()}/reports`;
  private spreadStatReport = `${this.reportDir}/spreadStat.csv`;  
  private spreadStatWriteStream: fs.WriteStream;

  constructor(
    private readonly quoteAggregator: QuoteAggregator,
    private readonly spreadAnalyzer: SpreadAnalyzer,
    @inject(symbols.SpreadStatTimeSeries) private readonly spreadStatTimeSeries: SpreadStatTimeSeries
  ) {}

  async start() {
    mkdirp.sync(this.reportDir);
    if (!fs.existsSync(this.spreadStatReport)) {
      await writeFile(this.spreadStatReport, spreadStatCsvHeader, { flag: 'a' });
    }
    this.spreadStatWriteStream = fs.createWriteStream(this.spreadStatReport, { flags: 'a' });
    this.quoteAggregator.onQuoteUpdated.set(this.constructor.name, quotes => this.quoteUpdated(quotes));
  }

  async stop() {
    this.quoteAggregator.onQuoteUpdated.delete(this.constructor.name);
    this.spreadStatWriteStream.close();
  }

  private async quoteUpdated(quotes: Quote[]): Promise<void> {
    const stat = await this.spreadAnalyzer.getSpreadStat(quotes);
    if (stat) {
      await this.spreadStatTimeSeries.put(stat);
      this.spreadStatWriteStream.write(spreadStatToCsv(stat));
    }
  }
} /* istanbul ignore next */
