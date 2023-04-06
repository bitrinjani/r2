import { expect } from 'chai';
import ConfigValidator from '../ConfigValidator';
import { ConfigRoot } from '../types';
import { options } from '@bitr/logger';
options.enabled = false;

const config: ConfigRoot = require('./config_test.json');

describe('ConfigValidator', () => {
  it('validate valid config', () => {
    const target = new ConfigValidator();
    target.validate(config);
  });

  it('validate valid config with a brokers is disabled', () => {
    const target = new ConfigValidator();
    config.brokers[0].enabled = false;
    target.validate(config);
    config.brokers[0].enabled = true;
    config.brokers[1].enabled = false;
    target.validate(config);
    config.brokers[1].enabled = true;
    config.brokers[2].enabled = false;
    target.validate(config);
  });

  it('validate with only one broker is enabled', () => {
    const target = new ConfigValidator();
    config.brokers[0].enabled = false;
    config.brokers[1].enabled = false;
    expect(() => target.validate(config)).to.throw();
  });
});
