
## 設定
設定は`config.json`ファイルで行います。全体に影響する設定と、各取引所(ブローカー)に対する設定があります。
設定項目は、裁定取引システムの先駆者である[Blackbird](https://github.com/butor/blackbird)を参考にしています。

### 全体設定
|Name|Values|Description|
|----|------|-----------|
|demoMode|true or false|デモモード。trueのとき、裁定機会の解析は行うが実際の注文は送らない。|
|priceMergeSize|number|板情報の細かい価格を集約する。100に設定されているとき、100円刻みにクオートの数量を合計したサマリ板を構築し、その板情報に対し裁定機会の計算を行う。|
|maxSize|number|取引所に送る注文数量の最大値。仮にこの値よりも大きい数量で裁定可能であっても、この設定値の注文を送信する。|
|minSize|number|取引所に送るオーダー数量の最小値。裁定機会がこの値より小さい数量の場合、取引を行わない。|
|minTargetProfitPercent|number|最小目標収益割合。期待収益の裁定取引の円換算(取引価格*数量)に対する割合(%)がこれより小さい場合、取引を行わない。|
|maxTargetProfit|number|[Optional] 最大目標収益。裁定機会の期待収益がこの値より大きい場合、取引を行わない。取引所が不正な価格を提示した場合の安全弁。|
|maxTargetProfitPercent|number|[Optional] 最大目標収益割合。期待収益の裁定取引の円換算(取引価格*数量)に対する割合(%)がこれより大きい場合、取引を行わない。取引所が不正な価格を提示した場合の安全弁。maxTargetProfitとmaxTargetProfitPercentの両方が設定されている場合、両方を下回らない限り取引を行わない。|
|exitNetProfitRatio|number|オープン時の収益に対し、クローズによって何%の利益を確定するか指定する。このパーセンテージ分だけオープン時からスプレッドが縮小した時、そのオープンペアをクローズする。例えば、オープン時の収益が200かつexitNetProfitRatio=20とすると、クローズのコストが160を下回ったときにR2はクローズオーダーを送信し、40の利益を確定しようとする。(オープンによる収益200, クローズによる費用160 -> 利益40)|
|maxTargetVolumePercent|number|[Optional]  数量不足による約定しない状況を回避する為に、裁定可能数量に対する注文量の割合に制限を設ける。この割合を上回らない限り取引を行わない。例えば、maxTargetVolumePercent=50の場合、裁定可能数量が1.00BTCだと注文量は0.5BTC(50%)以下でなければ取引を行わない。|
|iterationInterval|Millisecond|裁定プロセスのインターバル。この値が3000に設定されている場合、3秒に一回板情報を取得し裁定機会を探る。|
|positionRefreshInterval|Millisecond|ポジション更新インターバル。|
|sleepAfterSend|Millisecond|裁定取引完了後、このミリ秒だけ休止する。|
|maxNetExposure|number|最大ネットエクスポージャー*。取引所の合計ネットエクスポージャーの絶対値がこの値を超える場合、取引を行わない。| 
|maxRetryCount|number|裁定取引のオーダーを送信後、注文の約定状態をチェックする最大回数。|
|orderStatusCheckInterval|Millisecond|裁定取引の注文を送信後、注文の約定状態をチェックするインターバル。|
|stabilityTracker|-|下記「stabilityTracker設定詳細」を参照|
|onSingleLeg|-|下記「onSingleLeg設定詳細」参照|
|analytics|-|[ANALYTICS_PLUGIN_JP.md](https://github.com/bitrinjani/r2/blob/master/docs/ANALYTICS_PLUGIN_JP.md)を参照|

*minTargetProfitPercentの例:
minTargetProfitPercent: 0.1%
ベストアスク: 800,000円, 0.3 BTC
ベストビッド: 801,000円, 0.2 BTC
-> MID: 800,500円, 目標数量0.2BTC,期待収益200円となり、収益の割合は 200 / (800500 * 0.2) = 0.0012、つまり0.12%。
この値はminTargetProfitPercentである0.1%を上回っているので、取引を送信します。

*ここでのネットエクスポージャーとは、各取引所のポジションを合計した"BTC数量"です。一般にはエクスポージャーには数量ではなく割合を指しますが、簡略化のため数量としています。例えば、Bitflyerで0.1 BTC, Quoineで0.1 BTC, Coincheckでマイナス0.1 BTC(空売り)のとき、ネットエクスポージャーは 0.1 + 0.1 - 0.1 = 0.1 BTCとなります。仮にMaxNetExposure=0.05と設定されていた場合、0.1 > 0.05のため取引は送信しません。

#### stabilityTracker 設定詳細

R2は自動的に不安定なブローカーでの取引を無効化します。

- 各ブローカーは10段階の安定性指標をもつ
- 初期値は10
- 安定性指標は取引所API呼び出しが一度失敗するごとに1減る。
- 安定性指標は`recoveryInterval`msが経過するごとに1増える
- R2は安定性指標が`threshold`の値を下回るとそのブローカーでの取引を行わないようになる

既定値では、5分間に3回API呼び出しに失敗するとそのブローカーは最大5分間無効化されます。

既定の設定:

```json
...
  "stabilityTracker": {
    "threshold": 8,
    "recoveryInterval": 300000 
  },
...
```

#### onSingleLeg設定詳細
onSingleLeg設定で裁定ペアの片側だけ約定したときの動作を指定できます。反対売買で約定を取り消すか、未約定オーダーを再送信するか指定できます。

設定例:

```json
// config.json
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

- action: オープン時に指定回数の約定チェック後、片側だけ約定しなかった場合の動作。 選択肢は以下。
    - Cancel: 未約定のオーダーをキャンセルするのみ。
    - Reverse: 未約定のオーダーをキャンセル後、約定したオーダーに対し指値注文で反対売買する。指値価格はlimitMovePercentに依存する。
    - Proceed: 未約定のオーダーをキャンセル後、同方向に指値注文を再度送信する。指値価格はlimitMovePercentに依存する。
- actionOnExit: クローズ時に指定回数の約定チェック後、片側だけ約定しなかった場合の動作。選択肢はactionと同様。
- options
    - limitMovePercent: もとのオーダーよりも指定%だけ不利な方向に指値価格を指定する。
    - ttl: Actionにより作られた指値注文がこのミリ秒後に約定していない場合、キャンセルする。Time to Live。

#### webGateway設定詳細

既定値:

```json
// config.json
...
  "webGateway": {
    "enabled": false,
    "host": "127.0.0.1",
    "openBrowser": true
  },
...
```

- enabled: true for Web UI mode, false for console mode.
- host: リッスンするIPアドレス。既定ではlocalhost。
- openBrowser: trueのとき、ブラウザタブを自動的に開く。非GUI環境ではfalseにする必要がある。 

Web UI URLは既定では http://127.0.0.1:8720 で、TCPポート8720と8721が開いている必要がある。

### 取引所設定
|Name|Values|Description|
|----|------|-----------|
|broker|Bitflyer, Quoine or Coincheck|取引所名|
|npmPath|string|npmパッケージ名。(プラグインで取引所を追加するときのみ)|
|enabled|true or false|裁定取引の対象とするかどうかの設定|
|key|string|取引所APIのキーもしくはトークン|
|secret|string|取引所APIのシークレット|
|maxLongPosition|number|最大ロングポジション|
|maxShortPosition|number|最大ショートポジション|
|cashMarginType|Cash, MarginOpen or NetOut|オーダータイプ。現金取引、証拠金取引オープン、ネットアウトのどれか。取引所ごとにサポートしているタイプは異なる。下記テーブルを参照。|
|commissionPercent|number|取引手数料割合。裁定プロセスが予想利益を計算する際、取引手数料(目標価格 * 目標数量 * (commissionPercent / 100))を期待収益から差し引いた上で、取引を送信するか判断する。|
|noTradePeriods|["開始時間", "終了時間"]のリスト|下記noTradePeriods詳細を参照|

*取引所は最低2つ有効になっている必要があります。
### cashMarginType詳細
|取引所|サポートされるcashMarginType|
|--------|----------------|
|Bitflyer|Cash|
|Quoine|Cash, NetOut|
|Coincheck|Cash, MarginOpen, NetOut*|
|Bitbankcc|Cash|
|Btcbox|Cash|

*Coincheckのネットアウトは、取引所APIに存在しない取引タイプのため、アプリケーション内部でどのポジションをクローズするか判断しています。(Quoine APIはネットアウトをネイティブでサポートしています)
CoincheckのcashMarginTypeをNetOutに設定すると、裁定プロセスはオーダーを送信する前に現在のオープンポジションをチェックします。もしほとんど同じサイズのポジションが見つかれば、そのうち最も古いものに対しクローズオーダーを送信します。(FIFO)
ここで「ほとんど同じ」とは、1%以内の差異としています。コインチェックは、0.01 BTCの売注文を出すと、発生するポジションの数量が0.010005 BTCなど微妙に違う値になります。この違いを吸収するために1%の差異を許容しています。

### noTradePeriods詳細
取引を禁止する期間を ["開始時間", "終了時間"] の形式で記述します。その期間、その取引所からの価格配信を除外し価格が配信されていないものとみなします。例えば、bitFlyerの定期メンテナンス時間を除外するために利用できます。

- 例: 一つだけの期間4:00-4:15を禁止したい場合

```json
    {
      "broker": "Bitflyer",
...
      "noTradePeriods": [["04:00", "04:15"]]
    },
```

- 例: 複数の期間を禁止したい場合

```json
    {
      "broker": "Bitflyer",
...
      "noTradePeriods": [["04:00", "04:15"], ["9:00", "9:30"]]
    },
```

### ログ通知設定 (Slack, LINE通知)

出力されるログの内容に応じて、Slack, LINEに通知を送ることができます。`keywords`で指定された複数キーワードのうち一つが含まれると通知します。

```json
// config.json
{
...
  "logging": {
    "slack": {
      "enabled": false,
      "url": "https://hooks.slack.com/services/xxxxxx",
      "channel": "#ch1",
      "username": "abc",
      "keywords": ["error", "profit"]
    },
    "line": {
      "enabled": false,
      "token": "TOKEN",
      "keywords": ["error", "profit"]
    }
  }
}
```
#### Slack通知
|Name|Values|Description|
|----|------|-----------|
|enabled|true or false|通知の有効、無効|
|url|string|Slack Incoming Webフック URL|
|channel|string|Slackチャンネル名|
|username|string|ユーザー名|
|keywords|string[]|キーワードリスト。どれか一つがログメッセージに含まれれば通知される。|

#### LINE通知
|Name|Values|Description|
|----|------|-----------|
|enabled|true or false|通知の有効、無効|
|token|string|LINE Notifyトークン|
|keywords|string[]|キーワードリスト。どれか一つがログメッセージに含まれれば通知される。|

Slack WebフックURL、LINE Notifyトークンの取得方法については、以下の投稿を参考ください。

[SlackのWebhook URL取得手順](https://qiita.com/vmmhypervisor/items/18c99624a84df8b31008)

[[超簡単]LINE notify を使ってみる](https://qiita.com/takeshi_ok_desu/items/576a8226ba6584864d95)
