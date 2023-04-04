"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.splitToJson = exports.pretty = void 0;
const os_1 = require("os");
const split = require("split2");
const Parse = require("fast-json-parse");
const date_fns_1 = require("date-fns");
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
function pretty(opts) {
    const { withLabel, debug, hidden } = opts;
    const stream = split((json) => {
        try {
            const parsed = new Parse(json);
            const logObj = parsed.value;
            if (parsed.err) {
                return json + os_1.EOL;
            }
            if (!debug && logObj.level <= 20) {
                return '';
            }
            if (hidden && logObj.hidden) {
                return '';
            }
            const dateString = (0, date_fns_1.format)(new Date(logObj.time), dateFormat);
            const levelString = levels[logObj.level];
            const labelString = withLabel ? `[${logObj.label}] ` : '';
            return `${dateString} ${levelString} ${labelString}${logObj.msg}${os_1.EOL}`;
        }
        catch (ex) {
            return '';
        }
    });
    return stream;
}
exports.pretty = pretty;
function splitToJson() {
    const stream = split((json) => {
        try {
            const parsed = new Parse(json);
            const logObj = parsed.value;
            if (parsed.err) {
                return json + os_1.EOL;
            }
            if (logObj.level <= 20 || logObj.hidden) {
                return '';
            }
            return JSON.stringify({
                time: logObj.time,
                level: levels[logObj.level],
                msg: logObj.msg
            });
        }
        catch (ex) {
            return '';
        }
    });
    return stream;
}
exports.splitToJson = splitToJson;
