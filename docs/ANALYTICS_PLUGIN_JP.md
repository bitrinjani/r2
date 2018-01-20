# Analytics Plugin System

Analyticsサービスは、過去のスプレッド統計データをリアルタイムで受け取り解析し、その結果にもとづき設定を書き換えます。

- ユーザー作成のJavaScriptプラグインがデータ解析を行う
- 任意のnpmモジュール(統計処理用のsimple-statistics等)がプラグインから利用可能
- Analyticsサービスは裁定プロセスとは別のプロセスで動作するため、プラグインがクラッシュしたとしても本体には影響しない

## Getting Started

サンプルプラグインとして、`plugins/SimpleSpreadStatHandler.js`をリポジトリに含めています。
このプラグインは、過去データから反転スプレッド割合(%)の平均値と標準偏差を求め、平均値 + 標準偏差を`config.json`の`minTargetProfitPercent`に設定します。

このサンプルプラグインを有効化するには、`config.json`に以下の設定を追加します。(例は`config_default.json`を参照)

```
  "analytics": {
    "enabled": true,
    "plugin": "SimpleSpreadStatHandler.js",
    "initialHistory": { "minutes": 30 }
  },
```

R2を起動すると、過去30分のスプレッド統計データを読み込み、その後リアルタイムで追加されるデータを追加しながら、平均値、標準偏差を計算し、`config.json`に反映していきます。

なお、スプレッド統計データは**R2起動中のみ**に収集され、ローカルのデータベースに蓄積されます。もし過去30分にR2を起動していなかった場合、上記設定では過去データは存在しないため読み込まれず、リアルタイムで追加されるデータのみを利用します。

## Configuration

### enabled

有効・無効を設定します。

### plugin

R2インストールディレクトリのpluginディレクトリ下に存在するjsファイル名を指定します。

### initialHistory

initialHistoryは分単位にかぎらず、以下のような設定も可能です。

```javascript
"initialHistory": { days: 4, hours: 2, minutes: 7} // 過去4日2時間7分のデータを読み込む
```

この期間が長いほどデータの読み込み時間が長くなり、Analyticsサービスの起動に時間がかかります。また、メモリ使用量も増加します。

initialHistoryのフォーマットは、[luxonのDuration.fromObject](https://moment.github.io/luxon/docs/class/src/duration.js~Duration.html) に準じます。

## Plugin Specifications

プラグインとなるjsファイルは、以下の条件を満たすクラスを定義し`module.exports`にアサインする必要があります。

- コンストラクタで過去のスプレッド統計データ(SpreadStat[])を受け取りプラグイン自身を初期化する。
- handleメソッドでリアルタイムのスプレッド統計データ(SpreadStat)を受け取る。データ解析後、変更したい部分の設定を返す。設定変更を行わないときは`undefined`を返す。`async`をつけるか、Promiseで戻り値を包む必要がある。
- 純粋なnode.jsモジュールとして記述する。(TypeScriptではなく、ローカルのnode.jsでそのまま動作するJavaScript)

SpreadStat型の定義は以下です。

```typescript
interface SpreadStat {
  timestamp: number; // Unix time in millisecond
  byBroker: { [x: string]: { ask?: Quote; bid?: Quote; spread?: number } }; // 各ブローカー(取引所)ごとのベストアスク、ベストビッド、スプレッド
  bestCase: SpreadAnalysisResult; // すべての取引所を集約したあとのベストアスク、ベストビッド等の情報。
  worstCase: SpreadAnalysisResult; // すべての取引所を集約したあとのワーストアスク、ワーストビッド等の情報。
}

interface SpreadAnalysisResult {
  bid: Quote;
  ask: Quote;
  invertedSpread: number; // 反転スプレッド。bid - ask
  availableVolume: number; 
  targetVolume: number;
  targetProfit: number;
  profitPercentAgainstNotional: number; // 反転スプレッド割合。 `100 * (best bid - best ask) / (best bidとbest ask の平均値)`
}
```

自作プラグインで利用したい外部npmモジュールがあるときは、ローカルのリポジトリで`npm install <npmモジュール>`し、プラグイン内で`require`すれば読み込まれます。

例: SimpleSpreadStatHandler.js

```javascript
// 純粋なnode.jsモジュールとして動作するため、import ではなく require でnpmモジュールをロードする。
const _ = require('lodash');
const ss = require('simple-statistics');

class SimpleSpreadStatHandler {
  // このコンストラクタはプロセス起動時に過去データを受け取る。サンプルサイズ、平均値、分散を初期化する。
  constructor(history) {
    const profitPercentHistory = history.map(x => x.bestCase.profitPercentAgainstNotional);
    this.sampleSize = profitPercentHistory.length;
    this.profitPercentMean = this.sampleSize != 0 ? ss.mean(profitPercentHistory) : 0;
    this.profitPercentVariance = this.sampleSize != 0 ? ss.sampleVariance(profitPercentHistory) : 0;
  }

  // handleメソッドは既定で3秒に一度呼び出される。
  async handle(spreadStat) {
    const newData = spreadStat.bestCase.profitPercentAgainstNotional;
    // オンラインアルゴリズムで新しいサンプルデータを平均値に追加する。
    this.profitPercentMean = ss.addToMean(this.profitPercentMean, this.sampleSize, newData);
    // オンラインアルゴリズムで新しいサンプルデータを分散に追加する。
    this.profitPercentVariance = ss.combineVariances(
      this.profitPercentVariance,
      this.profitPercentMean,
      this.sampleSize,
      0,
      newData,
      1
    );

    // サンプル数をインクリメントする。
    this.sampleSize++;

    const n = this.sampleSize;
    const mean = this.profitPercentMean;
    // 不変標準偏差を標本分散から計算する。
    const standardDeviation = Math.sqrt(this.profitPercentVariance * n/(n-1));
    // minTargetProfitPercentを平均値+標準偏差に変換する。(小数点3桁目で四捨五入)
    const minTargetProfitPercent = _.round(mean + standardDeviation, 3);
    // 計算不可能な場合(サンプル数 < 2 など)、undefinedを返し設定を変更しない
    if (_.isNaN(minTargetProfitPercent)) {
      return undefined;
    }
    // minTargetProfitPercentを部分configオブジェクトとして返す。このオブジェクトがconfigにマージされる。
    const config = { minTargetProfitPercent };
    return config;
  }
}

// module.exportsによるエクスポートが必須
module.exports = SimpleSpreadStatHandler;
```
