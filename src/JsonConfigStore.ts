import { injectable } from 'inversify';
import { ConfigStore, ConfigRoot, ConfigRequest } from './types';
import { getConfigRoot, getConfigPath } from './configUtil';
import ConfigValidator from './ConfigValidator';
import { setTimeout } from 'timers';
import { socket, Socket } from 'zeromq';
import { configStoreSocketUrl } from './constants';
import { parseBuffer } from './util';
import * as _ from 'lodash';
import * as fs from 'fs';
import { promisify } from 'util';
import { getLogger } from '@bitr/logger';

const writeFile = promisify(fs.writeFile);

@injectable()
export default class JsonConfigStore implements ConfigStore {
  private readonly log = getLogger(this.constructor.name);
  private timer: NodeJS.Timer;
  private readonly server: Socket;
  private readonly TTL = 5 * 1000;
  private cache?: ConfigRoot;

  constructor(private readonly configValidator: ConfigValidator) {
    this.server = socket('rep');
    this.server.on('message', message => this.messageHandler(message));
    this.server.bindSync(configStoreSocketUrl);
  }

  get config(): ConfigRoot {
    if (this.cache) {
      return this.cache;
    }
    const config = getConfigRoot();
    this.configValidator.validate(config);
    this.updateCache(config);
    return config;
  }

  async set(config: ConfigRoot) {
    this.configValidator.validate(config);
    await writeFile(getConfigPath(), JSON.stringify(config, undefined, 2));
    this.updateCache(config);
  }

  close() {
    this.server.unbindSync(configStoreSocketUrl);
    this.server.close();
  }

  private async messageHandler(message: Buffer) {
    const parsed = parseBuffer<ConfigRequest>(message);
    if (parsed === undefined) {
      this.log.debug(`Invalid message received. Message: ${message.toString()}`);
      this.server.send(JSON.stringify({ success: false, reason: 'invalid message' }));
      return;
    }
    switch (parsed.type) {
      case 'set':
        try {
          const newConfig = parsed.data;
          await this.set(_.merge({}, getConfigRoot(), newConfig));
          this.server.send(JSON.stringify({ success: true }));
          this.log.debug(`Config updated with ${JSON.stringify(newConfig)}`);
        } catch (ex) {
          this.server.send(JSON.stringify({ success: false, reason: 'invalid config' }));
          this.log.warn(`Failed to update config. Error: ${ex.message}`);
          this.log.debug(ex.stack);
        }
        break;
      case 'get':
        this.server.send(JSON.stringify({ success: true, data: getConfigRoot() }));
        break;
      default:
        this.log.warn(`ConfigStore received an invalid message. Message: ${parsed}`);
        this.server.send(JSON.stringify({ success: false, reason: 'invalid message type' }));
        break;
    }
  }

  private updateCache(config: ConfigRoot) {
    this.cache = config;
    clearTimeout(this.timer);
    this.timer = setTimeout(() => (this.cache = undefined), this.TTL);
  }
} /* istanbul ignore next */
