import LineIntegration from '../../logger/LineIntegration';
import { LineConfig } from '../../type';
import * as nock from 'nock';

const lineUrl = 'https://notify-api.line.me/api/notify';
const lineApi = nock(lineUrl);
lineApi.post('').reply(200, 'ok');

describe('LineIntegration', () => {
  test('line', () => {
    const config = {
      enabled: true,
      token: 'TOKEN',
      keywords: ['error', 'profit']
    } as LineConfig;
    const line = new LineIntegration(config);
    line.handler('test message');
    line.handler('with keyword: profit');
  });

  test('line with no keyword', () => {
    const config = {
      enabled: true,
      token: 'TOKEN',
    } as LineConfig;
    const line = new LineIntegration(config);
    line.handler('test message');
    line.handler('with keyword: profit');
  });

  afterAll(() => {
    nock.restore();
  });
});