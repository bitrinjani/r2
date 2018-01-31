import BrokerPositionImpl from '../BrokerPositionImpl';
import { options } from '@bitr/logger';
options.enabled = false;

describe('BrokerPosition', () => {
  test('toString format', () => {
    const target = new BrokerPositionImpl();
    target.broker = 'Coincheck';
    target.btc = 0.01;
    target.allowedLongSize = 0.05;
    target.allowedShortSize = 0;
    target.longAllowed = true;
    target.shortAllowed = false;
    expect(target.toString()).toBe('Coincheck :   0.01 BTC, LongAllowed: OK, ShortAllowed: NG');
  });
});