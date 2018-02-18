# インストール方法
1) [Node.js](https://nodejs.org) 8.5以降をインストール
2) ターミナルからgitリポジトリをクローン

```bash
git clone https://github.com/bitrinjani/r2.git
```

3) フォルダr2に移動し、`npm install`をコンソールで実行

```bash
cd r2
npm install
```

4) インストールフォルダ内の`config_default.json`を`config.json`にリネーム
5) `key`、`secret`フィールドを、各取引所から取得したAPIキー、シークレットに置き換える。使わない取引所は、`enabled`を`false`にする。
6) 日本語UIにする場合、`language`フィールドを"en"から"ja"に変更する
7) コンソールから`npm start`で起動

# 最新版へのアップデート方法

インストールフォルダでコンソールから以下を実行。

```bash
git pull
npm install # or yarn
```



