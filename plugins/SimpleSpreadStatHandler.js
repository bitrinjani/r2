const _ = require('lodash');
const ss = require('simple-statistics');
const { getLogger } = require('@bitr/logger');

const precision = 3;

class SimpleSpreadStatHandler {
  // Constructor is called when initial snapshot of spread stat history has arrived.
  constructor(history) {
    this.log = getLogger(this.constructor.name);
    const profitPercentHistory = history.map(x => x.bestCase.profitPercentAgainstNotional);
    this.sampleSize = profitPercentHistory.length;
    this.profitPercentMean = this.sampleSize != 0 ? ss.mean(profitPercentHistory) : 0;
    this.profitPercentVariance = this.sampleSize != 0 ? ss.sampleVariance(profitPercentHistory) : 0;
  }

  // The method is called each time new spread stat has arrived, by default every 3 seconds.
  // Return value: part of ConfigRoot or undefined.
  // If part of ConfigRoot is returned, the configuration will be merged. If undefined is returned, no update will be made.
  async handle(spreadStat) {
    const newData = spreadStat.bestCase.profitPercentAgainstNotional;
    // add new data to mean
    this.profitPercentMean = ss.addToMean(this.profitPercentMean, this.sampleSize, newData);
    // add new data to variance
    this.profitPercentVariance = ss.combineVariances(
      this.profitPercentVariance,
      this.profitPercentMean,
      this.sampleSize,
      0,
      newData,
      1
    );

    this.sampleSize++;

    // set μ + σ to minTargetProfitPercent
    const n = this.sampleSize;
    const mean = this.profitPercentMean;
    const standardDeviation = Math.sqrt(this.profitPercentVariance * n/(n-1));
    const minTargetProfitPercent = _.round(mean + standardDeviation, precision);
    if (_.isNaN(minTargetProfitPercent)) {
      return undefined;
    }
    this.log.info(
      `μ: ${_.round(mean, precision)}, σ: ${_.round(
        standardDeviation,
        precision
      )}, n: ${n} => minTargetProfitPercent: ${minTargetProfitPercent}`
    );
    const config = { minTargetProfitPercent };
    return config;
  }
}

module.exports = SimpleSpreadStatHandler;
