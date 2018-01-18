import { socket, Socket } from 'zeromq';
import { SpreadStat } from '../types';
import { getLogger } from '@bitr/logger';
import { reportServicePubUrl, reportServiceRepUrl, configStoreSocketUrl } from '../constants';
import { parseBuffer } from '../util';

export default class ComputeEngine {
  private isHandling: boolean;
  private readonly log = getLogger(this.constructor.name);
  private readonly pluginPath = `${process.cwd()}/plugins/SpreadStatHandler`;
  private readonly streamSubscriber: Socket;
  private readonly snapshotRequester: Socket;
  private readonly configUpdater: Socket;
  private spreadStatHandler?: { handle: (spreadStat: SpreadStat) => any };

  constructor() {
    this.configUpdater = socket('push');
    this.snapshotRequester = socket('req');
    this.streamSubscriber = socket('sub');
  }

  start() {
    this.log.debug('Starting ComputeEngine');
    this.configUpdater.bindSync(configStoreSocketUrl);
    this.snapshotRequester.connect(reportServiceRepUrl);
    this.snapshotRequester.on('message', message => this.handleSnapshotMessage(message));
    this.snapshotRequester.send('spreadStatSnapshot');
    this.streamSubscriber.connect(reportServicePubUrl);
    this.streamSubscriber.subscribe('spreadStat');
    this.streamSubscriber.on('message', (topic, message) => this.handleStreamMessage(topic, message));
    process.on('message', message => {
      if (message === 'stop') {
        this.stop();
      }
    });
    this.log.debug('Started.');
  }

  stop() {
    this.log.debug('Stopping ComputeEngine...');
    this.streamSubscriber.close();
    this.snapshotRequester.close();
    this.configUpdater.unbindSync(configStoreSocketUrl);
    this.log.debug('Stopped.');
  }

  private async handleSnapshotMessage(message: Buffer) {
    const snapshot = parseBuffer<SpreadStat[]>(message);
    if (snapshot === undefined) {
      this.log.warn('Failed to parse the initial snapshot message.');
      return;
    }
    try {
      const SpreadStatHandler = await import(this.pluginPath);
      this.spreadStatHandler = new SpreadStatHandler(snapshot);
    } catch (ex) {
      this.log.warn(`Failed to import SpreadStatHandler plugin. ${ex.message}`);
      this.log.debug(ex.stack);
    }
  }

  private async handleStreamMessage(topic: Buffer, message: Buffer) {
    if (this.isHandling) {
      return;
    }
    try {
      this.isHandling = true;
      if (topic.toString() === 'spreadStat') {
        const spreadStat = parseBuffer<SpreadStat>(message);
        if (spreadStat && this.spreadStatHandler) {          
          const config = await this.spreadStatHandler.handle(spreadStat);
          this.configUpdater.send(JSON.stringify(config));
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
