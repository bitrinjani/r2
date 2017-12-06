import { injectable, inject } from 'inversify';
import { ConfigStore, ConfigRoot, ConfigValidator } from './types';
import symbols from './symbols';
import { getConfigRoot } from './util';

@injectable()
export default class JsonConfigStore implements ConfigStore {
  private _config: ConfigRoot;
  
  constructor(
    @inject(symbols.ConfigValidator) configValidator: ConfigValidator
  ) {
    this._config = getConfigRoot();
    configValidator.validate(this._config);
  }

  get config(): ConfigRoot {
    return this._config;
  }
}