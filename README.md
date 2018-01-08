[日本語はこちら](http://qiita.com/bitrinjani/items/3ed756da9baf7d171306)

[![Build Status](https://travis-ci.org/bitrinjani/r2.svg?branch=master)](https://travis-ci.org/bitrinjani/r2) [![Coverage Status](https://coveralls.io/repos/github/bitrinjani/r2/badge.svg?branch=master&i=5)](https://coveralls.io/github/bitrinjani/r2?branch=master)
# R2 Bitcoin Arbitrager

R2 Bitcoin Arbitrager is an automatic arbitrage trading application targeting Bitcoin exchanges operated in Japan.

![Screenshot](screenshot.gif)

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

or

1. Install [Docker](https://docs.docker.com/engine/installation/)
2. Clone this repository.
  ```bash
  git clone https://github.com/bitrinjani/r2.git
  ```
3. Run `docker build` and `docker run`.
  ```
  cd r2
  docker build -t r2:latest .
  docker run --rm -it r2:latest
  ```

### Prerequisites
R2 works on any OS that supports Node.js, such as:
- Windows
- Mac OS
- Linux

#### Supported Exchanges
R2 supports three exchanges operated in Japan.

|Exchange|Cash|Margin|
|----|------|-----------|
|bitFlyer|✔️| |
|Quoine|✔️|✔️|
|Coincheck|✔️|✔️|

## How it works
1. Every 3 seconds, R2 concurrently fetches quotes from exchanges.
1. Verifies if the max net exposure (`maxNetExposure` config) is not breached.
1. Filters out quotes that are not usable for arbitrage. For example, if `maxShortPosition` config is 0 and the current position is 0 for a broker, the ask quotes for the broker will be filtered out.
1. Calculates the best ask and the best bid from the filtered quotes. If there is no arbitrage opportunity, R2 waits for the next iteration.
1. Verifies if there is enough expected profit. If the expected profit is smaller than `minTargetProfit` config, R2 waits for the next iteration.
1. R2 concurrently sends a buy leg and a sell leg to each broker that offered the best bid or the best ask.
1. R2 checks whether the legs are filled or not for the configured period, say 30 seconds.
1. If the both legs are filled, shows the profit.

## Architecture Overview

![diagram](diagram.png)

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
|minTargetProfit|number|Minimum target profit in JPY. R2 attempts arbitrage if the expected profit calculated from current quotes is larger than minTargetProfit.|
|minTargetProfitPercent|number|Minimum target profit in percent against notional. Profit percentage against notional is calculated by `100 * profit / (MID price * volume)`. When both minTargetProfit and minTargetProfitPercent is greater than zero, the larger one is effective.|
|maxTargetProfit|number|[Optional] Max target profit. This is a safe-guard for abnormal quotes. If the expected profit is larger than this, R2 won't attempt arbitrage.|
|maxTargetProfitPercent|number|[Optional] Max target profit in percent.|
|minExitTargetProfit|number|Min target profit for closing order pairs. If the expected profit of closing existing pairs is larger than minExitTargetProfit, R2 attempts to close the pair.|
|minExitTargetProfitPercent|number|[Optional] Min target profit in percent for closing order pairs.|
|exitNetProfitRatio|number|[Optional] R2 attempts to close open pairs when the spread has decreased by this percentage. For example, when the open profit of an open pair is 200 JPY and exitNetProfitRatio is 20(%), R2 closes the pair once the closing cost has became 160.
|iterationInterval|Millisecond|Time lapse in milliseconds of an iteration. When it's set to 3000, the quotes fetch and the spreads analysis for all the brokers are done every 3 seconds|
|positionRefreshInterval|Millisecond|Time lapse in milliseconds of position data refresh. Position data is used to check max exposure and long/short availability for each broker.|
|sleepAfterSend|Millisecond|Time lapse in milliseconds after one arbitrage is done.|
|maxNetExposure|number|Maximum total net exposure. If net exposure qty is larger than this value, Arbitrager stops.| 
|maxRetryCount|number|Maximum retry count to check if arbitrage orders are filled or not. If the orders are not filled after the retries, Arbitrager tries to cancel the orders and continues.|
|orderStatusCheckInterval|Millisecond|Time lapse in milliseconds to check if arbitrage orders are filled or not.|
|onSingleLeg|-|See onSingleLeg config|

#### onSingleLeg config details

The onSingleLeg config specifies what action should be taken when only one leg is filled.

```json:config.json
...
  "onSingleLeg": {
    "action": "Reverse",
    "actionOnExit": "Proceed",
    "options": {
      "limitMovePercent": 5,
      "ttl": 3000
    }
  },
...
````

- action: Action to be taken when only one leg is opened.
    - Cancel: Cancel the unfilled order.
    - Reverse: After canceling the unfilled order, R2 sends a limit order to the opposite side of the filled order. The limit price depends on limitMovePercent config. 
    - Proceed: After canceling the unfilled order, R2 sends another order to the same side of the unfilled order. The limit price depends on limitMovePercent config.
- actionOnExit: Action to be taken when only one leg is closed. Cancel, Reverse, or Proceed.
- options
    - limitMovePercent: Set the limit price created by the action to the price worse than the original order by limitMovePercent %. 
    - ttl: Time to Live of the limit order created by the action。

### Broker config
|Name|Values|Description|
|----|------|-----------|
|broker|Bitflyer, Quoine or Coincheck|Broker enum|
|enabled|true or false|Enable the broker for arbitrage|
|key|string|Broker API Key or Token|
|secret|string|BrokerAPI Secret|
|maxLongPosition|number|Maximum long position allowed for the broker.|
|maxShortPosition|number|Maximum short position allowed for the broker|
|cashMarginType|Cash, MarginOpen, MarginClose, NetOut|Arbitrage order type. Not all options are supported for each exchange. See the table below.|
|commissionPercent|number|Comission percentage for each trade. Commission JPY amount is calculated by `target price * target volume * (commissionPercent / 100)`. Arbitrager calculates expected profit by `inversed spread * volume - commission JPY amount`.|  

#### Supported cashMarginType 

|Exchange|Supported option|
|--------|----------------|
|Bitflyer|Cash|
|Quoine|Cash, NetOut|
|Coincheck|Cash, MarginOpen, NetOut|

Quoine's NetOut is natively handled by Exchange API. Quoine can close multiple positions by one order.
Coincheck's NetOut is artificially handled by R2 because the exchange doesn't support netout operation. Coincheck's NetOut works as below.
1. The arbitrager finds leverage positions with the following conditions.
  - The opposite side of the sending order
  - Almost same amount as the sending order. 'Almost same' here means within 1% difference
2. If the positions are found, the arbitrager closes the oldest one.
3. If not found, the arbitrager opens a new position.

Please note this implementation doesn't close multiple positions by one order.

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

## Disclaimer

USE THE SOFTWARE AT YOUR OWN RISK. YOU ARE RESPONSIBLE FOR YOUR OWN MONEY. THE AUTHOR HAS NO RESPONSIBILITY FOR YOUR TRADING RESULTS.

## Inspirations
[Blackbird](https://github.com/butor/blackbird), which targets US exchanges. 
