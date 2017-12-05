import BrokerPosition from '../BrokerPosition';
import { Broker } from '../types';

describe('BrokerPosition', () => {
  test('toString format', () => {
    const target = new BrokerPosition();
    target.broker = Broker.Coincheck;
    target.btc = 0.01;
    target.allowedLongSize = 0.05;
    target.allowedShortSize = 0;
    target.longAllowed = true;
    target.shortAllowed = false;
    expect(target.toString()).toBe('Coincheck :  0.01 BTC, LongAllowed: OK, ShortAllowed: NG');
  });
});