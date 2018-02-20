import { injectable, inject } from 'inversify';
import symbols from './symbols';
import { Quote, ConfigStore, BrokerPosition, BrokerMap, SpreadAnalysisResult, ActivePairStore } from './types';
import QuoteAggregator from './QuoteAggregator';
import { getLogger } from '@bitr/logger';
import * as WebSocket from 'ws';
import { wssPort } from './constants';
import * as _ from 'lodash';
import PositionService from './PositionService';
import OppotunitySearcher from './OpportunitySearcher';
import OrderService from './OrderService';
import OrderImpl from './OrderImpl';

@injectable()
export default class WebGateway {
  private wss: WebSocket.Server;
  private readonly log = getLogger(this.constructor.name);
  private readonly clients: WebSocket[] = [];

  constructor(
    private readonly quoteAggregator: QuoteAggregator,
    @inject(symbols.ConfigStore) private readonly configStore: ConfigStore,
    private readonly positionService: PositionService,
    private readonly opportunitySearcher: OppotunitySearcher,
    @inject(symbols.ActivePairStore) private readonly activePairStore: ActivePairStore,
    private readonly orderService: OrderService
  ) {}

  async start() {
    const { webGateway } = this.configStore.config;
    if (!webGateway || !webGateway.enabled) {
      return;
    }

    this.log.debug(`Starting ${this.constructor.name}...`);
    this.quoteUpdated = this.quoteUpdated.bind(this);
    this.quoteAggregator.on('quoteUpdated', this.quoteUpdated);
    this.positionUpdated = this.positionUpdated.bind(this);
    this.positionService.on('positionUpdated', this.positionUpdated);
    this.spreadAnalysisDone = this.spreadAnalysisDone.bind(this);
    this.opportunitySearcher.on('spreadAnalysisDone', this.spreadAnalysisDone);
    this.activePairUpdated = this.activePairUpdated.bind(this);
    this.activePairStore.on('change', this.activePairUpdated);
    this.orderCreated = this.orderCreated.bind(this);
    this.orderService.on('orderCreated', this.orderCreated);
    this.orderUpdated = this.orderUpdated.bind(this);
    this.orderService.on('orderUpdated', this.orderUpdated);
    this.orderFinalized = this.orderFinalized.bind(this);
    this.orderService.on('orderFinalized', this.orderFinalized);
    this.wss = new WebSocket.Server({ port: wssPort });
    this.wss.on('connection', ws => {
      ws.on('message', message => {
        this.log.debug(`Received ${JSON.stringify(message)}.`);
      });
      this.clients.push(ws);
    });
    this.activePairUpdated();
    this.log.debug(`Started ${this.constructor.name}.`);
  }

  async stop() {
    const { webGateway } = this.configStore.config;
    if (!webGateway || !webGateway.enabled) {
      return;
    }

    this.log.debug(`Stopping ${this.constructor.name}...`);
    this.orderService.removeListener('orderCreated', this.orderCreated);
    this.orderService.removeListener('orderUpdated', this.orderUpdated);
    this.orderService.removeListener('orderFinalized', this.orderFinalized);
    this.activePairStore.removeListener('change', this.activePairUpdated);
    this.opportunitySearcher.removeListener('spreadAnalysisDone', this.spreadAnalysisDone);
    this.positionService.removeListener('positionUpdated', this.positionUpdated);
    this.quoteAggregator.removeListener('quoteUpdated', this.quoteUpdated);
    this.wss.close(err => {
      if (err) {
        this.log.error(err.message);
      }
    });
    this.log.debug(`Stopped ${this.constructor.name}.`);
  }

  private async quoteUpdated(quotes: Quote[]): Promise<void> {
    this.broadcast('quoteUpdated', quotes);
  }

  private positionUpdated(positions: BrokerMap<BrokerPosition>) {
    this.broadcast('positionUpdated', positions);
  }

  private spreadAnalysisDone(result: SpreadAnalysisResult) {
    this.broadcast('spreadAnalysisDone', result);
  }

  private async activePairUpdated() {
    const activePairs = await this.activePairStore.getAll();
    this.broadcast('activePairUpdated', activePairs);
  }

  private orderCreated(order: OrderImpl) {
    this.broadcast('orderCreated', order);
  }

  private orderUpdated(order: OrderImpl) {
    this.broadcast('orderUpdated', order);
  }

  private orderFinalized(order: OrderImpl) {
    this.broadcast('orderFinalized', order);
  }

  private broadcast(type: string, body: any) {
    for (const client of this.clients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({ type, body }), err => {
          if (err) {
            this.log.debug(err.message);
            _.pull(this.clients, client);
          }
        });
      }
    }
  }
} /* istanbul ignore next */
