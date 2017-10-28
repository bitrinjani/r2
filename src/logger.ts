import { format as formatDate } from 'date-fns';
import * as fs from 'fs';
import * as path from 'path';
import { createLogger, format, transports } from 'winston';
const { combine, timestamp, label, printf } = format;
import * as util from 'util';

const mysplat = format((info) => {
  if (info.splat) {
    info.message = util.format(info.message, ...info.splat);
    info.splat = undefined;
  }
  return info;
});

const logdir = './logs';

export function getLogger(name: string): Logger {
  mkdir(logdir);
  const localtime = () => formatDate(new Date(), 'YYYY-MM-DD HH:mm:ss.SSS');
  const formatForConsole = combine(
    mysplat(), 
    format.colorize(), 
    printf(info => `[${info.level}] ${info.message}`)
  );
  const formatForFile = combine(
    mysplat(),
    label({ label: name }),
    timestamp({ format: localtime }),
    printf(info => `${info.timestamp} ${info.level} [${info.label}] ${info.message}`)
  );
  return createLogger({
    format: formatForFile,
    transports: [
      new transports.Console({ format: formatForConsole, level: 'info' }),
      new transports.File({ filename: path.join(logdir, 'info.log'), level: 'info' }),
      new transports.File({ filename: path.join(logdir, 'debug.log'), level: 'debug' })
    ]
  });
}

function mkdir(dir: string) {
  try {
    fs.mkdirSync(dir);
  } catch (err) {
    if (err.code !== 'EEXIST') {
      throw err;
    }
  }
}

interface Logger {
  debug: LogFunc;
  info: LogFunc;
  warn: LogFunc;
  error: LogFunc;
}

interface LogFunc {
  (msg: any, ...args: any[]): void;
}