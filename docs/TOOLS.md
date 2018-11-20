# Utility scripts

Several utility scripts are available, which run independently from R2 main application. The scripts read keys/secrets in config.json and call exchange API.

The source code is under [tools](https://github.com/bitrinjani/r2/tree/master/tools) directory.

## getBalance - show JPY, BTC balances of each exchange in csv format

```bash
npm run -s getBalance
```

Example:

```
Exchange, Currency, Type, Amount
bitFlyer, JPY, Cash, 300000
bitFlyer, BTC, Cash, 1.234
Coincheck, JPY, Cash, 300000
Coincheck, BTC, Cash, 0.123
Coincheck, JPY, Margin, 200000
Coincheck, JPY, Free Margin, 123456
Coincheck, BTC, Leverage Position, 3.456
Quoine, JPY, Margin, 300000
Quoine, JPY, Free Margin, 123456
Quoine, BTC, Leverage Position, 0.01
Bitbankcc, JPY, Cash, 123456
Bitbankcc, BTC, Cash, 0.123
```

## closeCcPosition - close all leverage positions by market orders in Coincheck

```bash
npm run closeCcPosition
```

## closeBfPosition - sell out all cache positions by market orders in bitFlyer

```bash
npm run closeBfPosition
```

## closeQuPosition - close all leverage positions by market orders in Quoine

```bash
npm run closeQuPosition
```

## closeBbPosition - sell out all cache positions by market orders in Bitbankcc

```bash
npm run closeBbPosition
```

## clearPairs - clear open pair data in R2 internal database. This doesn't send any orders.

```bash
npm run clearPairs
```

## closeAll - execute the four close scripts above, execute clearPairs, then show balances by getBalance.

```bash
npm run closeAll
```
