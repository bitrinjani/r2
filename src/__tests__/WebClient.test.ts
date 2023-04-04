
// tslint:disable:max-line-length
import WebClient from '../WebClient';
import { RequestInit } from 'node-fetch';
import * as nock from 'nock';
import { options } from '@bitr/logger';
options.enabled = false;

const baseUrl = 'http://local';
const mocky = nock(baseUrl);
mocky.get('/v2/a').reply(200, {
  'field1': 'value1',
  'field2': 'value2'
});
mocky.get('/v2/b').reply(400, 'bad request');

interface MockResponse {
  field1: string;
  field2: string;
}

describe('WebClient', () => {
  test('HTTP Code 200', () => {
    const path = '/v2/a';
    const init: RequestInit = {
      headers: {
        'Content-Type': 'application/json'
      }
    };
    const rc = new WebClient(baseUrl);
    return rc.fetch<MockResponse>(path, init).then(x => expect(x.field2).toBe('value2'));
  });

  test('HTTP Code 400', () => {
    const path = '/v2/b';
    const init: RequestInit = {
      headers: {
        'Content-Type': 'application/json'
      }
    };
    const rc = new WebClient(baseUrl);
    const expected = 'HTTP request failed. Response from http://local/v2/b. Status Code: 400 (Bad Request) Content: bad request';
    return rc.fetch<MockResponse>(path, init).catch(x => expect(x.message).toBe(expected));
  });

  afterAll(() => {
    nock.restore();
  });
});