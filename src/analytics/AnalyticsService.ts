import { socket } from 'zeromq';
import { SpreadStat, ConfigRoot, ZmqSocket, AnalyticsConfig } from '../types';
import { getLogger } from '@bitr/logger';
import { reportServicePubUrl, reportServiceRepUrl, configStoreSocketUrl } from '../constants';
import { parseBuffer } from '../util';

export interface SpreadStatHandlerPlugin {
  handle: (spreadStat: SpreadStat) => any;
}

export default class AnalyticsService {
  private config: AnalyticsConfig;
  private isHandling: boolean;
  private readonly log = getLogger(this.constructor.name);
  private readonly pluginDir = `${process.cwd()}/plugins`;
  private readonly streamSubscriber: ZmqSocket;
  private readonly snapshotRequester: ZmqSocket;
  private readonly configRequester: ZmqSocket;
  private spreadStatHandler: SpreadStatHandlerPlugin;

  constructor() {
    this.configRequester = socket('req') as ZmqSocket;
    this.snapshotRequester = socket('req') as ZmqSocket;
    this.streamSubscriber = socket('sub') as ZmqSocket;
  }

  async start(): Promise<void> {
    this.log.debug('Starting AnalyticsService');
    this.config = await this.getConfig();
    this.snapshotRequester.connect(reportServiceRepUrl);
    const snapshotMessage = await new Promise<Buffer>(resolve => {
      this.snapshotRequester.once('message', resolve);
      this.snapshotRequester.send('spreadStatSnapshot');
    });
    this.spreadStatHandler = await this.getSpreadStatHandler(snapshotMessage);
    this.streamSubscriber.connect(reportServicePubUrl);
    this.streamSubscriber.subscribe('spreadStat');
    this.streamSubscriber.on('message', (topic, message) => this.handleStream(topic, message));
    process.on('message', message => {
      if (message === 'stop') {
        this.stop();
      }
    });
    this.log.debug('Started.');
  }

  async stop(): Promise<void> {
    this.log.debug('Stopping AnalyticsService...');
    this.streamSubscriber.close();
    this.snapshotRequester.close();
    this.configRequester.close();
    this.log.debug('Stopped.');
  }

  private async getConfig(): Promise<AnalyticsConfig> {
    this.configRequester.connect(configStoreSocketUrl);
    const reply = await new Promise<Buffer>(resolve => {
      this.configRequester.once('message', resolve);
      this.configRequester.send(JSON.stringify({ type: 'get' }));
    });
    const parsed = parseBuffer<{ success: boolean, data: ConfigRoot }>(reply);
    if (parsed === undefined || !parsed.success) {
      throw new Error('Analytics failed to get the config.');
    }
    return parsed.data.analytics;
  }

  private async getSpreadStatHandler(message: Buffer): Promise<SpreadStatHandlerPlugin> {
    const snapshot = parseBuffer<SpreadStat[]>(message);
    if (snapshot === undefined) {
      throw new Error('Failed to parse the initial snapshot message.');
    }
    const SpreadStatHandler = await import(`${this.pluginDir}/${this.config.fileName}`);
    return new SpreadStatHandler(snapshot);
  }

  private async handleStream(topic: Buffer, message: Buffer): Promise<void> {
    if (this.isHandling) {
      return;
    }
    try {
      this.isHandling = true;
      if (topic.toString() === 'spreadStat') {
        this.log.debug('Received spread-stat message.');
        const spreadStat = parseBuffer<SpreadStat>(message);
        if (spreadStat) {
          const config = await this.spreadStatHandler.handle(spreadStat);
          this.log.debug(`Sending to config store... ${JSON.stringify(config)}`);
          const reply = await new Promise<Buffer>(resolve => {
            this.configRequester.once('message', resolve);
            this.configRequester.send(JSON.stringify({ type: 'set', data: config }));
          });
          this.log.debug(`Reply from config store: ${reply}`);
        }
      }
    } catch (ex) {
      this.log.warn(`${ex.message}`);
      this.log.debug(ex.stack);
    } finally {
      this.isHandling = false;
    }
  }
}
