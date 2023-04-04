"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.spreadStatToCsv = exports.spreadStatCsvHeader = exports.getSpreadStatTimeSeries = void 0;
const util_1 = require("./util");
const os_1 = require("os");
const getSpreadStatTimeSeries = (chronoDB) => chronoDB.getTimeSeries('SpreadStat');
exports.getSpreadStatTimeSeries = getSpreadStatTimeSeries;
exports.spreadStatCsvHeader = [
    'timestamp',
    '[best] ask broker',
    '[best] ask price',
    '[best] ask volume',
    '[best] bid broker',
    '[best] bid price',
    '[best] bid volume',
    '[best] spread',
    '[best] available volume',
    '[best] target volume',
    '[best] target profit',
    '[best] target profit percent',
    '[worst] ask broker',
    '[worst] ask price',
    '[worst] ask volume',
    '[worst] bid broker',
    '[worst] bid price',
    '[worst] bid volume',
    '[worst] spread',
    '[worst] available volume',
    '[worst] target volume',
    '[worst] target profit',
    '[worst] target profit percent'
].join(', ') + os_1.EOL;
function spreadStatToCsv(spreadStat) {
    return [
        new Date(spreadStat.timestamp).toLocaleString(),
        spreadStat.bestCase.ask.broker,
        spreadStat.bestCase.ask.price,
        (0, util_1.eRound)(spreadStat.bestCase.ask.volume),
        spreadStat.bestCase.bid.broker,
        spreadStat.bestCase.bid.price,
        (0, util_1.eRound)(spreadStat.bestCase.bid.volume),
        -spreadStat.bestCase.invertedSpread,
        spreadStat.bestCase.availableVolume,
        spreadStat.bestCase.targetVolume,
        spreadStat.bestCase.targetProfit,
        spreadStat.bestCase.profitPercentAgainstNotional,
        spreadStat.worstCase.ask.broker,
        spreadStat.worstCase.ask.price,
        (0, util_1.eRound)(spreadStat.worstCase.ask.volume),
        spreadStat.worstCase.bid.broker,
        spreadStat.worstCase.bid.price,
        (0, util_1.eRound)(spreadStat.worstCase.bid.volume),
        -spreadStat.worstCase.invertedSpread,
        spreadStat.worstCase.availableVolume,
        spreadStat.worstCase.targetVolume,
        spreadStat.worstCase.targetProfit,
        spreadStat.worstCase.profitPercentAgainstNotional,
    ].join(', ') + os_1.EOL;
}
exports.spreadStatToCsv = spreadStatToCsv;
