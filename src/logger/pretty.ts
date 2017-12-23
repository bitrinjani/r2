import { EOL } from 'os';
import * as split from 'split2';
const Parse = require('fast-json-parse');
const chalk = require('chalk');
import { format as formatDate } from 'date-fns';

interface LogObject {
  level: number;
  msg: string;
  time: number;
  label: string;
}

const dateFormat = 'YYYY-MM-DD HH:mm:ss.SSS';

const levels = {
  default: 'USERLVL',
  60: 'FATAL',
  50: 'ERROR',
  40: 'WARN',
  30: 'INFO',
  20: 'DEBUG',
  10: 'TRACE'
};

export default function pretty(opts: {colorize: boolean, withLabel: boolean, debug: boolean }) {
  const { colorize, withLabel, debug } = opts;
  const stream = split(mapLine);
  let ctx;
  let levelColors;
  const pipe = stream.pipe;
  stream.pipe = (dest: any) => {
    ctx = new chalk.constructor({
      enabled: !!(chalk.supportsColor && colorize)
    });
    levelColors = {
      default: ctx.white,
      60: ctx.bgRed,
      50: ctx.red,
      40: ctx.yellow,
      30: ctx.green,
      20: ctx.blue,
      10: ctx.grey
    };
    return pipe.call(stream, dest);
  };
  return stream;

  function mapLine(json: string): string {
    const parsed = new Parse(json);
    const logObj: LogObject = parsed.value;
    if (parsed.err) {
      return json + EOL;
    }
    if (!debug && logObj.level <= 20) {
      return '';
    }
    const dateString = formatDate(new Date(logObj.time), dateFormat);
    const levelString = levelColors[logObj.level](levels[logObj.level]);
    const labelString = withLabel ? `[${logObj.label}] ` : '';
    return `${dateString} ${levelString} ${labelString}${logObj.msg}${EOL}`;
  }
}
