import { socket } from 'zeromq';
import { SpreadStat, ZmqSocket, AnalyticsConfig } from '../types';
import { getLogger } from '@bitr/logger';
import { reportServicePubUrl, reportServiceRepUrl, configStoreSocketUrl } from '../constants';
import { parseBuffer } from '../util';
import { SnapshotRequester, ConfigRequester } from '../messages';

export interface SpreadStatHandlerPlugin {
  handle: (spreadStat: SpreadStat) => any;
}

export default class AnalyticsService {
  private config: AnalyticsConfig;
  private isHandling: boolean;
  private readonly log = getLogger(this.constructor.name);
  private readonly pluginDir = `${process.cwd()}/plugins`;
  private readonly streamSubscriber: ZmqSocket;
  private readonly snapshotRequester: SnapshotRequester;
  private readonly configRequester: ConfigRequester;
  private spreadStatHandler: SpreadStatHandlerPlugin;

  constructor() {
    this.configRequester = new ConfigRequester(configStoreSocketUrl);
    this.snapshotRequester = new SnapshotRequester(reportServiceRepUrl);
    this.streamSubscriber = socket('sub') as ZmqSocket;
  }

  async start(): Promise<void> {
    this.log.debug('Starting AnalyticsService');
    this.config = await this.getConfig();
    const snapshotMessage = await this.snapshotRequester.request({ type: 'spreadStatSnapshot' });
    if (!snapshotMessage.success || snapshotMessage.data === undefined) {
      throw new Error('Failed to initial snapshot message.');
    }
    this.spreadStatHandler = await this.getSpreadStatHandler(snapshotMessage.data);
    this.streamSubscriber.connect(reportServicePubUrl);
    this.streamSubscriber.subscribe('spreadStat');
    this.streamSubscriber.on('message', (topic, message) => this.handleStream(topic, message));
    process.on('message', message => {
      if (message === 'stop') {
        this.log.info('Analysis process received stop message.');
        this.stop();
      }
    });
    this.log.debug('Started.');
  }

  async stop(): Promise<void> {
    this.log.debug('Stopping AnalyticsService...');
    try {
      this.streamSubscriber.close();
      this.snapshotRequester.dispose();
      this.configRequester.dispose();
    } catch (ex) {
      this.log.warn(ex.message);
      this.log.debug(ex.stack);
    }
    this.log.debug('Stopped.');
  }

  private async getConfig(): Promise<AnalyticsConfig> {
    const reply = await this.configRequester.request({ type: 'get' });
    if (!reply.success || reply.data === undefined) {
      throw new Error('Analytics failed to get the config.');
    }
    return reply.data.analytics;
  }

  private async getSpreadStatHandler(snapshot: SpreadStat[]): Promise<SpreadStatHandlerPlugin> {
    const SpreadStatHandler = await import(`${this.pluginDir}/${this.config.plugin}`);
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
          if (config) {
            this.log.debug(`Sending to config store... ${JSON.stringify(config)}`);
            const reply = await this.configRequester.request({ type: 'set', data: config });
            this.log.debug(`Reply from config store: ${reply}`);
          }
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
