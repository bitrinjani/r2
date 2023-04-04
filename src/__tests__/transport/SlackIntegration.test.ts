import SlackIntegration from '../../transport/SlackIntegration';
import { SlackConfig } from '../../types';
import * as nock from 'nock';
import * as util from '../../util';

const slackUrl = 'https://hooks.slack.com/services';
const slackApi = nock(slackUrl);
slackApi.post('/xxxxxx').reply(200, 'ok');
slackApi.post('/xxxxxx').replyWithError('mock error');

describe('SlackIntegration', () => {
  test('slack', () => {
    const config = {
      enabled: true,
      url: 'https://hooks.slack.com/services/xxxxxx',
      channel: '#ch1',
      username: 'abc',
      keywords: ['error', 'profit']
    } as SlackConfig;
    const slack = new SlackIntegration(config);
    slack.handler('test message');
    slack.handler('with keyword: profit');
  });

  test('slack exception handling', async () => {
    const config = {
      enabled: true,
      url: 'https://hooks.slack.com/services/xxxxxx',
      channel: '#ch1',
      username: 'abc',
      keywords: ['error', 'profit']
    } as SlackConfig;
    const slack = new SlackIntegration(config);
    slack.handler('test message');
    slack.handler('with keyword: profit');
    await util.delay(0);
  });

  test('slack with no keyword', () => {
    const config = {
      enabled: true,
      url: 'https://hooks.slack.com/services/xxxxxx',
      channel: '#ch1',
      username: 'abc'
    } as SlackConfig;
    const slack = new SlackIntegration(config);
    slack.handler('test message');
    slack.handler('with keyword: profit');
  });

  afterAll(() => {
    nock.restore();
  });
});