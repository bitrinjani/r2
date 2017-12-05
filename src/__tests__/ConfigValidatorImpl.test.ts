import ConfigValidatorImpl from '../ConfigValidatorImpl';
import { ConfigRoot } from '../type';

const config: ConfigRoot = require('./config_test.json');

describe('ConfigValidatorImpl', () => {
  test('validate valid config', () => {
    const target = new ConfigValidatorImpl();
    target.validate(config);
  });

  test('validate valid config with a brokers is disabled', () => {
    const target = new ConfigValidatorImpl();
    config.brokers[0].enabled = false;
    target.validate(config);
    config.brokers[0].enabled = true;
    config.brokers[1].enabled = false;
    target.validate(config);
    config.brokers[1].enabled = true;
    config.brokers[2].enabled = false;
    target.validate(config);
  });

  test('validate with only one broker is enabled', () => {
    const target = new ConfigValidatorImpl();
    config.brokers[0].enabled = false;
    config.brokers[1].enabled = false;
    expect(() => target.validate(config)).toThrow();
  });
});