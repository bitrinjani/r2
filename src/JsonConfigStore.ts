import { injectable } from 'inversify';
import { ConfigStore, ConfigRoot } from './types';
import { getConfigRoot } from './configUtil';
import ConfigValidator from './ConfigValidator';
import { setTimeout } from 'timers';

@injectable()
export default class JsonConfigStore implements ConfigStore {
  private TTL = 5 * 1000;
  private cache?: ConfigRoot;

  constructor(private readonly configValidator: ConfigValidator) {}

  get config(): ConfigRoot {
    if (this.cache) {
      return this.cache;
    }
    const config = getConfigRoot();
    this.configValidator.validate(config);
    this.cache = config;
    setTimeout(() => (this.cache = undefined), this.TTL);
    return config;
  }
} /* istanbul ignore next */
