import { injectable, inject } from 'inversify';
import symbols from './symbols';
import {
  Quote,
  ConfigStore,
  BrokerPosition,
  BrokerMap,
  SpreadAnalysisResult,
  ActivePairStore,
  ConfigRoot
} from './types';
import QuoteAggregator from './QuoteAggregator';
import { getLogger } from '@bitr/logger';
import * as WebSocket from 'ws';
import { wssPort } from './constants';
import * as _ from 'lodash';
import PositionService from './PositionService';
import OppotunitySearcher from './OpportunitySearcher';
import OrderService from './OrderService';
import OrderImpl from './OrderImpl';
import * as express from 'express';
import * as http from 'http';
import { promisify } from 'util';
import { autobind } from 'core-decorators';
const opn = require('opn');

@injectable()
@autobind
export default class WebGateway {
  private readonly eventMapper: [any, string, any][];
  private server: http.Server;
  private app: express.Express;
  private wss: WebSocket.Server;
  private readonly log = getLogger(this.constructor.name);
  private readonly clients: WebSocket[] = [];
  private readonly staticPath: string = `${process.cwd()}/webui/dist`;

  constructor(
    private readonly quoteAggregator: QuoteAggregator,
    @inject(symbols.ConfigStore) private readonly configStore: ConfigStore,
    private readonly positionService: PositionService,
    private readonly opportunitySearcher: OppotunitySearcher,
    @inject(symbols.ActivePairStore) private readonly activePairStore: ActivePairStore,
    private readonly orderService: OrderService
  ) {
    this.eventMapper = [
      [this.quoteAggregator, 'quoteUpdated', this.quoteUpdated],
      [this.positionService, 'positionUpdated', this.positionUpdated],
      [this.opportunitySearcher, 'spreadAnalysisDone', this.spreadAnalysisDone],
      [this.opportunitySearcher, 'limitCheckDone', this.limitCheckDone],
      [this.activePairStore, 'change', this.activePairUpdated],
      [this.orderService, 'orderCreated', this.orderCreated],
      [this.orderService, 'orderUpdated', this.orderUpdated],
      [this.orderService, 'orderFinalized', this.orderFinalized],
      [this.configStore, 'configUpdated', this.configUpdated]
    ];
  }

  async start() {
    const { webGateway } = this.configStore.config;
    if (!webGateway || !webGateway.enabled) {
      return;
    }

    this.log.debug(`Starting ${this.constructor.name}...`);
    for (const e of this.eventMapper) {
      e[0].on(e[1], e[2]);
    }
    this.app = express();
    this.app.use(express.static(this.staticPath));
    this.app.get('*', (req, res) => {
      res.sendFile(`${this.staticPath}/index.html`);
    });
    this.server = this.app.listen(wssPort, webGateway.host, () => {
      this.log.debug(`Express started listening on ${wssPort}.`);
    });
    this.wss = new WebSocket.Server({ server: this.server });
    this.wss.on('connection', ws => {
      ws.on('error', err => {
        this.log.debug(err.message);
      });
      this.clients.push(ws);
    });
    this.activePairUpdated();
    this.configUpdated(this.configStore.config);
    opn(`http://${webGateway.host}:${wssPort}`);
    this.log.debug(`Started ${this.constructor.name}.`);
  }

  async stop() {
    const { webGateway } = this.configStore.config;
    if (!webGateway || !webGateway.enabled) {
      return;
    }

    this.log.debug(`Stopping ${this.constructor.name}...`);
    await promisify(this.wss.close.bind(this.wss))();
    await promisify(this.server.close.bind(this.server))();
    for (const e of this.eventMapper) {
      e[0].removeListener(e[1], e[2]);
    }
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

  private limitCheckDone(message: string) {
    this.broadcast('limitCheckDone', message);
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

  private configUpdated(config: ConfigRoot) {
    this.broadcast('configUpdated', this.sanitize(config));
  }

  private sanitize(config: ConfigRoot): ConfigRoot {
    const copy = _.cloneDeep(config);
    for (const brokerConfig of copy.brokers) {
      delete brokerConfig.key;
      delete brokerConfig.secret;
    }
    delete copy.logging;
    return copy;
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
