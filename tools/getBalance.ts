// Ad-hoc script to get balances from exchanges and output the result in CSV format.

import * as _ from 'lodash';
import * as util from '../src/util';
import BitflyerApi from '../src/Bitflyer/BrokerApi';
import CoincheckApi from '../src/Coincheck/BrokerApi';
import QuoineApi from '../src/Quoine/BrokerApi';
import { Broker } from '../src/types';
import { Balance } from '../src/Bitflyer/types';
import { TradingAccount } from '../src/Quoine/types';
import { options } from '../src/logger';

options.enabled = false;

async function main() {
  const config = util.getConfigRoot();
  const bfConfig = util.findBrokerConfig(config, Broker.Bitflyer);
  const ccConfig = util.findBrokerConfig(config, Broker.Coincheck);
  const quConfig = util.findBrokerConfig(config, Broker.Quoine);

  const bfApi = new BitflyerApi(bfConfig.key, bfConfig.secret);
  const ccApi = new CoincheckApi(ccConfig.key, ccConfig.secret);
  const quApi = new QuoineApi(quConfig.key, quConfig.secret);

  // csv header
  process.stdout.write('Exchange, Currency, Type, Amount\n');

  // bitflyer cash balance
  if (bfConfig.enabled) {
    const bfBalance = await bfApi.getBalance();
    const bfJpy = (bfBalance.find(x => x.currency_code === 'JPY') as Balance).available;
    const bfBtc = (bfBalance.find(x => x.currency_code === 'BTC') as Balance).available;
    process.stdout.write(`bitFlyer, JPY, Cash, ${_.round(bfJpy)}\n`);
    process.stdout.write(`bitFlyer, BTC, Cash, ${bfBtc}\n`);
  }

  // coincheck cash balance
  if (ccConfig.enabled) {
    const ccBalance = await ccApi.getAccountsBalance();
    process.stdout.write(`Coincheck, JPY, Cash, ${_.round(ccBalance.jpy)}\n`);
    process.stdout.write(`Coincheck, BTC, Cash, ${ccBalance.btc}\n`);

    // coincheck margin balance
    const ccLeverageBalance = await ccApi.getLeverageBalance();
    process.stdout.write(`Coincheck, JPY, Margin, ${_.round(ccLeverageBalance.margin.jpy)}\n`);
    process.stdout.write(`Coincheck, JPY, Free Margin, ${_.round(ccLeverageBalance.margin_available.jpy)}\n`);
    const positions = await ccApi.getAllOpenLeveragePositions();
    const longPosition = _.sumBy(positions.filter(p => p.side === 'buy'), p => p.amount);
    const shortPosition = _.sumBy(positions.filter(p => p.side === 'sell'), p => p.amount);
    process.stdout.write(`Coincheck, BTC, Leverage Position, ${longPosition - shortPosition}\n`);
  }

  // quoine margin balance
  if (quConfig.enabled) {
    const quBalance = await quApi.getTradingAccounts();
    const quBtcJpyBalance = quBalance.find(x => x.currency_pair_code === 'BTCJPY') as TradingAccount;
    process.stdout.write(`Quoine, JPY, Margin, ${_.round(quBtcJpyBalance.balance)}\n`);
    process.stdout.write(`Quoine, JPY, Free Margin, ${_.round(quBtcJpyBalance.free_margin)}\n`);
    process.stdout.write(`Quoine, BTC, Leverage Position, ${quBtcJpyBalance.position}\n`);
  }
}

main();
