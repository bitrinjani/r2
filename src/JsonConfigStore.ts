import { injectable } from 'inversify';
import { ConfigStore, ConfigRoot } from './types';
import { getConfigRoot } from './configUtil';
import ConfigValidator from './ConfigValidator';

@injectable()
export default class JsonConfigStore implements ConfigStore {
  private _config: ConfigRoot;

  constructor(configValidator: ConfigValidator) {
    this._config = getConfigRoot();
    configValidator.validate(this._config);
  }

  get config(): ConfigRoot {
    return this._config;
  }
} /* istanbul ignore next */
