import 'reflect-metadata';
import PositionServiceImpl from '../PositionServiceImpl';
import { Broker } from '../type';
import * as _ from 'lodash';
import { delay } from '../util';

test('Test PositionServiceImpl', async () => {
  const config = {
    brokers: [{
      broker: Broker.Quoine,
      enabled: true,
      maxLongPosition: 0.3,
      maxShortPosition: 0.3
    }, {
      broker: Broker.Coincheck,
      enabled: true,
      maxLongPosition: 1,
      maxShortPosition: 0
    }]
  };

  const configStore = { config };
  const baRouter = {
    getBtcPosition: broker => broker === Broker.Quoine ? 0.2 : -0.3
  };

  const ps = new PositionServiceImpl(configStore, baRouter);
  await ps.start();
  const positions = _.values(ps.positionMap);
  const exposure = ps.netExposure;
  ps.stop();
  const ccPos = _.find(positions, x => x.broker === Broker.Coincheck);
  expect(positions.length).toBe(2);
  expect(exposure).toBe(-0.1);
  expect(ccPos.btc).toBe(-0.3);
  expect(ccPos.longAllowed).toBe(true);
  expect(ccPos.shortAllowed).toBe(false);
  expect(ccPos.allowedLongSize).toBe(1.3);
  expect(ccPos.allowedShortSize).toBe(0);
});
