import { format as formatDate } from 'date-fns';
import * as _ from 'lodash';
import * as path from 'path';
import * as winston from 'winston';
import { mkdir, getConfigRoot } from '../util';
import lessSplat from './lessSplat';
import SlackIntegration from './SlackIntegration';
import LineIntegration from './LineIntegration';
import { SlackConfig, LineConfig, ConfigRoot } from '../types';

interface LogFunc {
  (msg: any, ...args: any[]): void;
}

export interface Logger {
  debug: LogFunc;
  info: LogFunc;
  warn: LogFunc;
  error: LogFunc;
}

export default class LoggerFactory {
  private static logdir = './logs';
  private static dateFormat = 'YYYY-MM-DD HH:mm:ss.SSS';
  private loggerCache: Map<string, Logger> = new Map<string, Logger>();

  constructor(private readonly config: ConfigRoot = getConfigRoot()) {
    mkdir(LoggerFactory.logdir);
  }

  create(name: string): Logger {
    if (this.loggerCache.has(name)) {
      return this.loggerCache.get(name) as Logger;
    }
    const localtime = () => formatDate(new Date(), LoggerFactory.dateFormat);
    const formatForConsole = winston.format.combine(
      lessSplat(),
      winston.format.colorize(),
      winston.format.timestamp({ format: localtime }),
      winston.format.printf(info => `${info.timestamp} [${info.level}] ${info.message}`)
    );
    const formatForFile = winston.format.combine(
      lessSplat(),
      winston.format.label({ label: name }),
      winston.format.timestamp({ format: localtime }),
      winston.format.printf(info => `${info.timestamp} ${info.level} [${info.label}] ${info.message}`)
    );
    const consoleTransport = new winston.transports.Console({ format: formatForConsole, level: 'info' });
    const infoFileTransport = new winston.transports.File(
      { format: formatForFile, filename: path.join(LoggerFactory.logdir, 'info.log'), level: 'info' });
    const debugFileTransport = new winston.transports.File(
      { format: formatForFile, filename: path.join(LoggerFactory.logdir, 'debug.log'), level: 'debug' });
    const transportList = [consoleTransport, infoFileTransport, debugFileTransport];
    this.addIntegration(infoFileTransport, SlackIntegration, this.getSlackConfig());
    this.addIntegration(infoFileTransport, LineIntegration, this.getLineConfig());
    const logger = winston.createLogger({
      format: formatForFile,
      transports: transportList
    });
    this.loggerCache.set(name, logger);
    return logger;
  }

  private getSlackConfig(): SlackConfig | undefined {
    return _.get(this.config, 'logging.slack');
  }

  private getLineConfig(): LineConfig | undefined {
    return _.get(this.config, 'logging.line');
  }

  private addIntegration(
    transport: { on: any },
    Integration: { new(config: any): SlackIntegration | LineIntegration },
    config: SlackConfig | LineConfig | undefined
  ): void {
    if (config && config.enabled) {
      const integration = new Integration(config);
      transport.on('logged', info => integration.handler(info[Symbol.for('message')]));
    }
  }
}