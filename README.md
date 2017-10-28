# R2 Bitcoin Arbitrager

R2 Bitcoin Arbitrager is an automatic arbitrage trading application targeting Bitcoin exchanges operated in Japan.

This application is implemented with Node.js/TypeScript. The previous version was implemented by C# on .NET Framework in [Rinjani repository](https://github.com/bitrinjani/rinjani). To get more extensibility, expecially for Web UI, it was ported to Node.js.

## Getting Started

1. Install [Node.js](https://nodejs.org) 8.5 or newer.
2. Clone this repository.
  ```bash
  git clone https://github.com/bitrinjani/r2.git
  ```
3. Run `npm install`. (or `yarn`)
```bash
cd r2
npm install
```
4. Rename `config_default.json` in src folder to `config.json`
5. Replace `key` and `secret` fields with your API keys (tokens) and secrets. 
6. Start the application by `npm start` or `yarn start`.
```bash
npm start
```

### Prerequisites
The application should work on any OS that supports Node.js, such as:
- Windows
- Mac OS
- Linux

#### Supported Exchanges
Currently, the Arbitrager supports three exchanges operated in Japan.

- Bitflyer (Cash)
- Quoine (Leverage)
- Coincheck (Leverage)

## How it works
1. Every 3 seconds, the Arbitrager fetches quotes from exchanges.
1. Verifies if the max net exposure (`maxNetExposure` config) is not breached.
1. Filters out quotes that are not usable for arbitrage. For example, if `maxShortPosition` config is 0 and the current position is 0 for a broker, ask quotes for the broker are filtered out.
1. Calculates best ask and best bid. If the spread is not inverted, there is no arbitrage opportunity, so the arbitrager waits for the next iteration.
1. Verifies if there is enough expected profit. If the expected profit is smaller than `minTargetProfit` config, the Arbitrager waits for the next iteration.
1. Arbitrage the spread by sending a buy leg and a sell leg to each broker.
1. With 3 seconds interval, the Arbitrager checks if the legs are filled or not.
1. If the both legs are filled, shows the profit. 

## Configuration

All configurations are stored in `config.json`.

### Global Config
|Name|Values|Description|
|----|------|-----------|
|language|"ja" or "en"|UI language. Japanese or English.|
|demoMode|true or false|If it's True, the arbitrager analyzes spreads but doesn't send any trade.|
|priceMergeSize|number|Merges small quotes into the specified price ladder before analyzing arbitrage opportunity.|
|maxSize|number|Maximum BTC size to be sent to a broker.|
|minSize|number|Minimum BTC size to be sent to a broker.|
|minTargetProfit|number|Minimum JPY size to try to arbitrage.|
|iterationInterval|Millisecond|Time lapse in milliseconds of an iteration. When it's set to 3000, the quotes fetch and the spreads analysis for all the brokers are done every 3 seconds|
|positionRefreshInterval|Millisecond|Time lapse in milliseconds of position data refresh. Position data is used to check max exposure and long/short availability for each broker.|
|sleepAfterSend|Millisecond|Time lapse in milliseconds after one arbitrage is done.|
|maxNetExposure|number|Maximum total net exposure. If net exposure qty is larger than this value, Arbitrager stops.| 
|maxRetryCount|number|Maximum retry count to check if arbitrage orders are filled or not. If the orders are not filled after the retries, Arbitrager tries to cancel the orders and continues.|
|orderStatusCheckInterval|Millisecond|Time lapse in milliseconds to check if arbitrage orders are filled or not.|

### Broker config
|Name|Values|Description|
|----|------|-----------|
|broker|Bitflyer, Quoine or Coincheck|Broker enum|
|enabled|true or false|Enable the broker for arbitrage|
|key|string|Broker API Key or Token|
|secret|string|BrokerAPI Secret|
|maxLongPosition|number|Maximum long position allowed for the broker.|
|maxShortPosition|number|Maximum short position allowed for the broker|
|cashMarginType|Cash, MarginOpen, MarginClose, NetOut|Arbitrage order type. Currently, this option is not fully supported. Please do not change from the default values.|

### Log files
All log files are saved under `logs` directory.

|File name|Description|
|---------|-----------|
|info.log|Standard log file|
|debug.log|Verbose logging, including all REST HTTP requests and responses in JSON format|

## Running the tests
`test` script runs [ts-jest](https://github.com/kulshekhar/ts-jest).

```
npm test
```

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details

## Inspirations
[Blackbird](https://github.com/butor/blackbird), which targets US exchanges. 
