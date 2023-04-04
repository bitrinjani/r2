# Analytics Plugin System

Analytics service reads and analyzes historical spread statistics in real-time. It rewrites R2 config (`config.json`) based on the analysis result.

- User-made JavaScript plugin analyzes the statistics and updates the config.
- Any npm module like `simple-statistics` can be imported from the plugins.
- Plugin crashes won't affect the main arbitrager process because Analytics service runs as a separate process.

## Getting Started

A sample plguin `plugins/SimpleSpreadStatHandler.js` is included in the repository. The plugin calculates mean and standard deviation of the percentage of inversed spread from historical data, and set `mean + standard deviation` to `minTargetProfitPercent` config in `config.json`.

To enable the plugin, add the configuration below in `config.json`.

```
  "analytics": {
    "enabled": true,
    "plugin": "SimpleSpreadStatHandler.js",
    "initialHistory": { "minutes": 30 }
  },
```

## Configuration

### enabled

true or false. Enable or disable the plugin.

### plugin

Specify a js file under the `plugin` directory.

### initialHistory

Specify the duration of the history data that is loaded when R2 starts.

Example:

```javascript
"initialHistory": { days: 4, hours: 2, minutes: 7} 
```

Setting long duration could cause slow startup and larger memory usage.

The format is [luxon's Duration.fromObject](https://moment.github.io/luxon/docs/class/src/duration.js~Duration.html).

## Plugin Specifications

The plugin js file should define a class that satisfies the following conditions and is assigned to `module.exports`.

- The constructor receives historical spread statistics data (`SpreadStat[]` type) to initialize itself.
- `handle` method receives real-time spread statistics data (`SpreadStat` type) every `iterationInterval`. After analyzing the data, it returns part of configuration that needs to be updated. Return `undefined` if no config update is required. The method should be `async` function or return `Promise` value.

SpreadStat type:

```typescript
interface SpreadStat {
  timestamp: number; // Unix time in millisecond
  byBroker: { [x: string]: { ask?: Quote; bid?: Quote; spread?: number } }; // Best ask/bid and spread of each broker
  bestCase: SpreadAnalysisResult; // Best ask/bid and spread of aggregated quotes 
  worstCase: SpreadAnalysisResult; // Best ask/bid and spread of aggregated quotes
}

interface SpreadAnalysisResult {
  bid: Quote;
  ask: Quote;
  invertedSpread: number; // bid - ask
  availableVolume: number; 
  targetVolume: number;
  targetProfit: number;
  profitPercentAgainstNotional: number; // `100 * (best bid - best ask) / (mean of best bid and best ask)`
}
```

User can import any npm modules by executing `npm install <npm module>` in user's local repository and `require` in the plugin file.

Example: SimpleSpreadStatHandler.js

```javascript
const _ = require('lodash');
const ss = require('simple-statistics');

const precision = 3;

class SimpleSpreadStatHandler {
  // Constructor is called when initial snapshot of spread stat history has arrived.
  constructor(history) {
    const profitPercentHistory = history.map(x => x.bestCase.profitPercentAgainstNotional);
    this.sampleSize = profitPercentHistory.length;
    this.profitPercentMean = this.sampleSize != 0 ? ss.mean(profitPercentHistory) : 0;
    this.profitPercentVariance = this.sampleSize != 0 ? ss.variance(profitPercentHistory) : 0;
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
    const config = { minTargetProfitPercent };
    return config;
  }
}

module.exports = SimpleSpreadStatHandler;
```

## The list of configs that can be updated in real-time

Global config:
- demoMode
- maxSize
- minSize
- minTargetProfit
- minExitTargetProfit
- minTargetProfitPercent
- minExitTargetProfitPercent
- exitNetProfitRatio
- maxTargetProfit
- maxTargetProfitPercent
- maxTargetVolumePercent
- sleepAfterSend
- maxNetExposure
- maxRetryCount
- orderStatusCheckInterval
- onSingleLeg: OnSingleLegConfig;

  
Broker config:
- enabled
- key
- secret
- maxLongPosition
- maxShortPosition
- commissionPercent
- noTradePeriods
