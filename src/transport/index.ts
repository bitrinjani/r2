import pretty from './pretty';
import * as fs from 'fs';
import SlackIntegration from './SlackIntegration';
import LineIntegration from './LineIntegration';
import { SlackConfig, LineConfig } from '../types';
import { mkdir, getConfigRoot } from '../util';
import * as _ from 'lodash';

process.on('SIGINT', () => {
  console.log('SIGINT detected in the transport process. Passing through...');
});

const logdir = './logs';
mkdir(logdir);

const configRoot = getConfigRoot();
const slackConfig = _.get(configRoot, 'logging.slack');
const lineConfig = _.get(configRoot, 'logging.line');

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
addIntegration(SlackIntegration, slackConfig);
addIntegration(LineIntegration, lineConfig);

function addIntegration(
  Integration: { new(config: any): SlackIntegration | LineIntegration },
  config: SlackConfig | LineConfig | undefined
): void {
  if (config && config.enabled) {
    const integration = new Integration(config);
    infoTransform.on('data', line => integration.handler(line as string));
  }
}