"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calcProfit = exports.calcCommission = void 0;
const _ = require("lodash");
const configUtil_1 = require("./configUtil");
const types_1 = require("./types");
function calcCommission(price, volume, commissionPercent) {
    return commissionPercent !== undefined ? price * volume * (commissionPercent / 100) : 0;
}
exports.calcCommission = calcCommission;
function calcProfit(orders, config) {
    const commission = _(orders).sumBy(o => {
        const brokerConfig = (0, configUtil_1.findBrokerConfig)(config, o.broker);
        return calcCommission(o.averageFilledPrice, o.filledSize, brokerConfig.commissionPercent);
    });
    const profit = _(orders).sumBy(o => (o.side === types_1.OrderSide.Sell ? 1 : -1) * o.filledNotional) - commission;
    return { profit, commission };
}
exports.calcProfit = calcProfit;
