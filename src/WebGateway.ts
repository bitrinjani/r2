import { injectable, inject } from 'inversify';
import symbols from './symbols';
import { Quote, ConfigStore, BrokerPosition, BrokerMap, SpreadAnalysisResult } from './types';
import QuoteAggregator from './QuoteAggregator';
import { getLogger } from '@bitr/logger';
import * as WebSocket from 'ws';
import { wssPort } from './constants';
import * as _ from 'lodash';
import PositionService from './PositionService';
import OppotunitySearcher from './OpportunitySearcher';

@injectable()
export default class WebGateway {
  private readonly log = getLogger(this.constructor.name);
  private quoteUpdatedRef: (quotes: Quote[]) => Promise<void>;
  private positionUpdatedRef: (positions: BrokerMap<BrokerPosition>) => void;
  private spreadAnalysisDoneRef: (result: SpreadAnalysisResult) => void;
  private readonly clients: WebSocket[] = [];

  constructor(
    private readonly quoteAggregator: QuoteAggregator,
    @inject(symbols.ConfigStore) private readonly configStore: ConfigStore,
    private readonly positionService: PositionService,
    private readonly opportunitySearcher: OppotunitySearcher
  ) {}

  async start() {
    const { webGateway } = this.configStore.config;
    if (webGateway && webGateway.enabled) {
      this.log.debug(`Starting ${this.constructor.name}...`);
      this.quoteUpdatedRef = this.quoteUpdated.bind(this);
      this.quoteAggregator.on('quoteUpdated', this.quoteUpdatedRef);
      this.positionUpdatedRef = this.positionUpdated.bind(this);
      this.positionService.on('positionUpdated', this.positionUpdatedRef);
      this.spreadAnalysisDoneRef = this.spreadAnalysisDone.bind(this);
      this.opportunitySearcher.on('spreadAnalysisDone', this.spreadAnalysisDoneRef);
      const wss = new WebSocket.Server({ port: wssPort });
      wss.on('connection', ws => {
        ws.on('message', message => {
          this.log.debug(`Received ${JSON.stringify(message)}.`);
        });
        this.clients.push(ws);
      });
      this.log.debug('Started ${this.constructor.name}.');
    }
  }

  async stop() {
    this.log.debug('Stopping ${this.constructor.name}...');
    this.quoteAggregator.removeListener('quoteUpdated', this.quoteUpdatedRef);
    this.log.debug('Stopped ${this.constructor.name}.');
  }

  private async quoteUpdated(quotes: Quote[]): Promise<void> {
    this.broadcast('quotes', quotes);
  }

  private positionUpdated(positions: BrokerMap<BrokerPosition>) {
    this.broadcast('positions', positions);
  }

  private spreadAnalysisDone(result: SpreadAnalysisResult) {
    this.broadcast('spreadAnalaysisResult', result);
  }

  private broadcast(type: string, body: any) {
    for (const client of this.clients) {
      client.send(JSON.stringify({ type, body }), err => {
        if (err) {
          this.log.debug(err.message);
          _.pull(this.clients, client);
        }
      });
    }
  }
} /* istanbul ignore next */
