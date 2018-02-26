import pretty from './pretty';
import * as fs from 'fs';
import SlackIntegration from './SlackIntegration';
import LineIntegration from './LineIntegration';
import { SlackConfig, LineConfig } from '../types';
import { getConfigRoot } from '../configUtil';
import * as mkdirp from 'mkdirp';
import * as _ from 'lodash';
import * as WebSocket from 'ws';
import { wssLogPort } from '../constants';

process.on('SIGINT', () => {
  console.log('SIGINT detected in the transport process. Passing through...');
});

const logdir = './logs';
mkdirp.sync(logdir);

let configRoot;

try {
  configRoot = getConfigRoot();
} catch (ex) {
  console.log(ex.message);
}

// console output
process.stdin.pipe(pretty({ colorize: true, withLabel: false, debug: false })).pipe(process.stdout);

// debug.log
const debugFile = fs.createWriteStream('logs/debug.log', { flags: 'a' });
process.stdin.pipe(pretty({ colorize: false, withLabel: true, debug: true })).pipe(debugFile);

// info.log
const infoTransform = process.stdin.pipe(pretty({ colorize: false, withLabel: true, debug: false }));
const infoFile = fs.createWriteStream('logs/info.log', { flags: 'a' });
infoTransform.pipe(infoFile);

// notification integrations
if (configRoot) {
  const slackConfig = _.get(configRoot, 'logging.slack');
  const lineConfig = _.get(configRoot, 'logging.line');
  addIntegration(SlackIntegration, slackConfig);
  addIntegration(LineIntegration, lineConfig);
}

const clients: WebSocket[] = [];
if (_.get(configRoot, 'webGateway.enabled')) {
  const wss = new WebSocket.Server({ port: wssLogPort });
  wss.on('connection', ws => {
    ws.on('error', err => {});
    clients.push(ws);
  });
}

infoTransform.on('data', line => {
  try {
    broadcast('log', line);
  } catch (err) {}
});

function broadcast(type: string, body: any) {
  for (const client of clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({ type, body }), err => {
        if (err) {
          _.pull(clients, client);
        }
      });
    }
  }
}

function addIntegration(
  Integration: { new (config: any): SlackIntegration | LineIntegration },
  config: SlackConfig | LineConfig | undefined
): void {
  if (config && config.enabled) {
    const integration = new Integration(config);
    infoTransform.on('data', line => integration.handler(line as string));
  }
}
