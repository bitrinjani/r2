"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatQuote = exports.splitSymbol = exports.cwd = exports.toQuote = exports.toExecution = exports.readJsonFileSync = exports.revive = exports.safeQueryStringStringify = exports.timestampToDate = exports.nonce = exports.hmac = exports.delay = exports.almostEqual = exports.eRound = exports.hr = exports.padEnd = exports.padStart = void 0;
const _ = require("lodash");
const crypto = require("crypto");
const fs = require("fs");
const querystring = require("querystring");
function padStart(s, n) {
    return _.padStart(s.toString(), n);
}
exports.padStart = padStart;
function padEnd(s, n) {
    return _.padEnd(s.toString(), n);
}
exports.padEnd = padEnd;
function hr(width) {
    return _.join(_.times(width, _.constant('-')), '');
}
exports.hr = hr;
function eRound(n) {
    return _.round(n, 10);
}
exports.eRound = eRound;
function almostEqual(a, b, tolerancePercent) {
    return Math.sign(a) === Math.sign(b) && Math.abs(a - b) <= Math.abs(b) * (tolerancePercent / 100);
}
exports.almostEqual = almostEqual;
function delay(time) {
    return new Promise(resolve => setTimeout(resolve, time));
}
exports.delay = delay;
function hmac(secret, text, algo = 'sha256') {
    return crypto
        .createHmac(algo, secret)
        .update(text)
        .digest('hex');
}
exports.hmac = hmac;
exports.nonce = (function () {
    let prev = 0;
    return function () {
        const n = Date.now();
        if (n <= prev) {
            prev += 1;
            return prev.toString();
        }
        prev = n;
        return prev.toString();
    };
})();
function timestampToDate(n) {
    return new Date(n * 1000);
}
exports.timestampToDate = timestampToDate;
function safeQueryStringStringify(o) {
    const noUndefinedFields = _.pickBy(o, _.negate(_.isUndefined));
    return querystring.stringify(noUndefinedFields);
}
exports.safeQueryStringStringify = safeQueryStringStringify;
function revive(T, o) {
    const newObject = Object.create(T.prototype);
    return Object.assign(newObject, o);
}
exports.revive = revive;
function removeBom(s) {
    return s.charCodeAt(0) === 0xfeff ? s.slice(1) : s;
}
function readJsonFileSync(filepath) {
    const content = fs.readFileSync(filepath, 'utf-8');
    return JSON.parse(removeBom(content));
}
exports.readJsonFileSync = readJsonFileSync;
function toExecution(order) {
    return {
        broker: order.broker,
        brokerOrderId: order.brokerOrderId,
        cashMarginType: order.cashMarginType,
        side: order.side,
        symbol: order.symbol
    };
}
exports.toExecution = toExecution;
function toQuote(broker, side, price, volume) {
    return { broker, side, price, volume };
}
exports.toQuote = toQuote;
function cwd() {
    return process.env.NODE_ENV === 'test' ? `${process.cwd()}/src/__tests__/sandbox` : process.cwd();
}
exports.cwd = cwd;
function splitSymbol(symbol) {
    const [baseCcy, quoteCcy] = symbol.split('/');
    return { baseCcy, quoteCcy };
}
exports.splitSymbol = splitSymbol;
function formatQuote(quote) {
    return (`${padEnd(quote.broker, 10)} ${quote.side} ` +
        `${padStart(quote.price.toLocaleString(), 7)} ${_.round(quote.volume, 3)}`);
}
exports.formatQuote = formatQuote;
