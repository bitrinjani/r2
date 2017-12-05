import { injectable, inject } from 'inversify';
import { ConfigStore, ConfigRoot, ConfigValidator } from './types';
import symbols from './symbols';
import { readJsonFileSync } from './util';

@injectable()
export default class JsonConfigStore implements ConfigStore {
  private _config: ConfigRoot;
  
  constructor(
    @inject(symbols.ConfigValidator) configValidator: ConfigValidator,
    path: string = `${__dirname}/config.json`
  ) {
    this._config = new ConfigRoot(readJsonFileSync(path));
    configValidator.validate(this._config);
  }

  get config(): ConfigRoot {
    return this._config;
  }
}