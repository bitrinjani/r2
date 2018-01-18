import { injectable } from 'inversify';
import { ConfigStore, ConfigRoot } from './types';
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
  timer: NodeJS.Timer;
  private readonly log = getLogger(this.constructor.name);
  private readonly pullSocket: Socket;
  private TTL = 5 * 1000;
  private cache?: ConfigRoot;

  constructor(private readonly configValidator: ConfigValidator) {
    this.pullSocket = socket('pull');
    this.pullSocket.connect(configStoreSocketUrl);
    this.pullSocket.on('message', async message => {
      try {
        const newConfig = parseBuffer(message);
        if (newConfig === undefined) {
          this.log.debug(`Invalid message received. Message: ${message.toString()}`);
          return;
        }
        await this.setConfig(_.merge({}, getConfigRoot(), newConfig));
        this.log.debug(`Config updated with ${JSON.stringify(newConfig)}`);
      } catch (ex) {
        this.log.warn(`Failed to write config. Error: ${ex.message}`);
        this.log.debug(ex.stack);
      }
    }); 
  }

  close() {
    this.pullSocket.close();
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

  private async setConfig(config: ConfigRoot) {
    this.configValidator.validate(config);
    await writeFile(getConfigPath(), JSON.stringify(config, undefined, 2));
    this.updateCache(config);
  }

  private updateCache(config: ConfigRoot) {
    this.cache = config;
    clearTimeout(this.timer);
    this.timer = setTimeout(() => (this.cache = undefined), this.TTL);
  }
} /* istanbul ignore next */
