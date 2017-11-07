import { injectable, inject } from 'inversify';
import { ConfigStore, ConfigRoot, ConfigValidator } from './type';
import symbols from './symbols';

@injectable()
export default class JsonConfigStore implements ConfigStore {
  private _config: ConfigRoot;
  
  constructor(
    @inject(symbols.ConfigValidator) configValidator: ConfigValidator,
    path: string = './config.json'
  ) {
    this._config = new ConfigRoot(require(path));
    configValidator.validate(this._config);
  }

  get config(): ConfigRoot {
    return this._config;
  }
}