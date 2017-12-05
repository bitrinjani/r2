import * as nock from 'nock';
import LoggerFactory from '../../logger/LoggerFactory';
import { ConfigRoot } from '../../types';

const slackUrl = 'https://hooks.slack.com/services';
const slackApi = nock(slackUrl);
slackApi.post('/xxxxxx').reply(200, 'ok');

describe('LoggerFactory', () => {
  test('create', () => {
    const config = {
      logging: {
        slack: {
          enabled: true,
          url: 'https://hooks.slack.com/services/xxxxxx',
          channel: '#ch1',
          username: 'abc',
          keywords: ['error', 'profit']
        }
      }
    } as ConfigRoot;
    const factory = new LoggerFactory(config);
    const logger = factory.create('logname');
    logger.info('test log');
    expect(logger).not.toBeUndefined();
  });

  afterAll(() => {
    nock.restore();
  });
});