
# Main Components

## Arbitrager
裁定処理の中心となるコンポーネント。Quote Aggregatorから板情報更新イベントを受信したとき、裁定処理を開始する。Position Service からポジションを取得し、Spread Analyzer, Limit Checkerを通して裁定オープン/クローズを判断する。

📄src/Arbitrager.ts

## Broker Adapter
取引所APIの[アダプター](https://ja.wikipedia.org/wiki/Adapter_%E3%83%91%E3%82%BF%E3%83%BC%E3%83%B3) 。
BrokerAdapter インターフェイスを実装し、取引所間のAPIの差異を吸収する。他のコンポーネントがどの取引所とやり取りしているか知らなくてすむようにインターフェイスを統一する。
新しい取引所をR2に追加したい場合、このコンポーネントを追加しDIコンテナに登録するだけでよい。

📄src/*/BrokerAdapter.ts

## Broker Adapter Router
複数のBroker Adapterの[ファサード](https://ja.wikipedia.org/wiki/Facade_%E3%83%91%E3%82%BF%E3%83%BC%E3%83%B3) として動作する。
他コンポーネントからの取引所へのリクエスト(オーダー送信、価格取得、ポジション取得等)を各Broker Adapterにルーティングする。他コンポーネントが全取引所のBroker Adapterの参照を持たずに済むようにするため。

📄src/BrokerAdapterRouter.ts

## Position Service
定期的にポジション情報を取引所から取得する。取引所APIを直接呼び出すことはなく、Broker Adapter Router経由でリクエストを出す。BTCポジション数だけでなく、各取引所に対し売り買い試行可能か設定値から計算し、その情報を保持する。

📄src/PositionService.ts

## Quote Aggregator
定期的に全取引所から板情報を取得し、設定された呼び値幅に集約したサマリ板を生成する。取引所APIを直接呼び出すことはなく、Broker Adapter Router経由でリクエストを出す。板情報更新イベントをArbitragerに通知する。

📄src/QuoteAggregator.ts

## Spread Analyzer
Arbitrager からサマリ板情報とポジション情報を受け取り、そのポジション下で最適なビッド/アスクとその期待収益等を計算する。

📄src/SpreadAnalyzer.ts

## Limit Checker
裁定可否の意思決定を行う。各種設定値（ネットエクスポージャ、最小目標収益、デモモード等）を参照の上、オーダーを送信すべきかどうかの解析結果をArbitragerに返す。
各種チェッカーはLimit Checkerインターフェイスを実装し、[Compositeパターン](https://ja.wikipedia.org/wiki/Composite_%E3%83%91%E3%82%BF%E3%83%BC%E3%83%B3) で集約されたチェッカーを形成している。

📄src/LimitChecker.ts

## Config Store
設定情報の状態管理（現状読み込みのみ）を担当する。ConfigStoreインターフェイスを実装し、ConfigRoot型の設定オブジェクトを保持する。現在の実装はjsonフォーマットのファイルを読み込む。

📄src/JsonConfigStore.ts

# Other Components/Modules
## DI Container
[InversifyJS](http://inversify.io/) を利用。各コンポーネントは、コンストラクタでDIコンテナから依存するインターフェイスのインスタンスを受け取る。

📄container.ts
📄symbols.ts

## Config Validator
起動時に設定に不正な値（マイナスのミリ秒など）が設定されていないかチェックし、不正な場合は起動させないようにする。

📄ConfigValidator.ts

## Logger
ログ出力には[pinojs](https://github.com/pinojs/pino) を利用。
pinojsはJSON文字列をインプロセスで出力するだけの小さなライブラリで、ファイル出力やフォーマットはパイプした別のプロセスで自力で行う必要がある。
R2では、package.jsonのstartスクリプトでメインプロセスをtransportモジュールにパイプしている。

```json
...
"scripts": {
 "start": "node ./dist | node ./dist/transport",
...
```

### logger module
単純にpinojsのインスタンスをラップしたものを返す。インプロセスで利用される。このモジュールには、ファイル出力やログ通知機能を含めない。

📄src/logger/

### transport module

パイプ経由で受け取ったjson文字列をフォーマットし、info.log, debug.logファイルやSlack, LINEに分岐する。
他のログ通知を実装したい場合、このモジュールを変更する。

📄src/transport/

## intl
メッセージの多言語化対応を担当。
[i18next](https://github.com/i18next/i18next) を[タグ付けされたTemplate literal](https://developer.mozilla.org/ja/docs/Web/JavaScript/Reference/template_strings) として利用できるようにしたモジュール。

📄src/intl.ts

## [Castable](https://github.com/bitrinjani/castable)
型が不正なJSON文字列をサニタイズするためのモジュール。

# Etc.

## Unit Tests
[ts-jest](https://github.com/kulshekhar/ts-jest) を利用。外部Webサービスのモック化には[nock](https://github.com/node-nock/nock) を利用。

## Tools
toolsフォルダには、各種簡易スクリプトを配置している。R2のコードを部分的にimportすることが可能。本体のコンパイルには含まれない。
実行はpackage.json内で以下のようにts-node経由で行う。

```
  "scripts": {
  ...
    "getBalance": "ts-node ./tools/getBalance.ts",
 ```
