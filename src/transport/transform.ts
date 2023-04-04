import { EOL } from 'os';
import * as split from 'split2';
import * as Parse from 'fast-json-parse';
import { format as formatDate } from 'date-fns';

interface LogObject {
  level: number;
  msg: string;
  time: number;
  label: string;
  hidden: boolean;
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

export function pretty(opts: { withLabel: boolean; debug: boolean; hidden: boolean }) {
  const { withLabel, debug, hidden } = opts;
  const stream = split((json: string): string => {
    try {
      const parsed = new Parse(json);
      const logObj: LogObject = parsed.value;
      if (parsed.err) {
        return json + EOL;
      }
      if (!debug && logObj.level <= 20) {
        return '';
      }
      if (hidden && logObj.hidden) {
        return '';
      }
      const dateString = formatDate(new Date(logObj.time), dateFormat);
      const levelString = levels[logObj.level];
      const labelString = withLabel ? `[${logObj.label}] ` : '';
      return `${dateString} ${levelString} ${labelString}${logObj.msg}${EOL}`;
    } catch (ex) {
      return '';
    }
  });
  return stream;
}

export function splitToJson() {
  const stream = split((json: string): string => {
    try {
      const parsed = new Parse(json);
      const logObj: LogObject = parsed.value;
      if (parsed.err) {
        return json + EOL;
      }
      if (logObj.level <= 20 || logObj.hidden) {
        return '';
      }
      return JSON.stringify({
        time: logObj.time,
        level: levels[logObj.level],
        msg: logObj.msg
      });
    } catch (ex) {
      return '';
    }
  });
  return stream;
}
