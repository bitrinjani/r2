"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toShortString = exports.toExecSummary = void 0;
const util_1 = require("./util");
const intl_1 = require("./intl");
const util_2 = require("util");
const _ = require("lodash");
function toExecSummary(order) {
    const { baseCcy } = (0, util_1.splitSymbol)(order.symbol);
    return order.filled
        ? (0, util_2.format)((0, intl_1.default) `FilledSummary`, order.broker, order.side, order.filledSize, baseCcy, _.round(order.averageFilledPrice).toLocaleString())
        : (0, util_2.format)((0, intl_1.default) `UnfilledSummary`, order.broker, order.side, order.size, baseCcy, order.price.toLocaleString(), order.pendingSize, baseCcy);
}
exports.toExecSummary = toExecSummary;
function toShortString(order) {
    const { baseCcy } = (0, util_1.splitSymbol)(order.symbol);
    return `${order.broker} ${order.side} ${order.size} ${baseCcy}`;
}
exports.toShortString = toShortString;
