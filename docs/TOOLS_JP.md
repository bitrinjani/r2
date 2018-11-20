# 補助スクリプト

R2の裁定プロセスとは別で、単体で動作する補助スクリプトをいくつか用意しています。
config.jsonのキー、シークレットを読み取り取引所APIを実行します。
ソースは[toolsディレクトリ](https://github.com/bitrinjani/r2/tree/master/tools)下です。

## getBalance - 各取引所のJPY, BTC残高をCSV形式で出力

```bash
npm run -s getBalance
```

出力例:

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

## closeCcPosition - Coincheckの全レバレッジポジションを成行注文でクローズ

```bash
npm run closeCcPosition
```

## closeBfPosition - bitFlyerの全現物BTCを成行注文で売却

```bash
npm run closeBfPosition
```

## closeQuPosition - Quoineの全レバレッジポジションを成行注文でクローズ

```bash
npm run closeQuPosition
```

## closeBbPosition - Bitbankccの全現物BTCを成行注文で売却

```bash
npm run closeBbPosition
```

## clearPairs - R2が保持しているオープンペア情報をクリアする(取引は送信されません)

```bash
npm run clearPairs
```

## closeAll - 上記4つのcloseを順に実行し、clearPairsでペア情報をクリア後、getBalanceを実行する。

```bash
npm run closeAll
```
