// Ad-hoc script to flat bitFlyer BTC cash position.
import * as util from '../src/util';
import BitflyerApi from '../src/Bitflyer/BrokerApi';
import { Broker } from '../src/types';
import { Balance } from '../src/Bitflyer/types';
import * as _ from 'lodash';

async function main() {
  const config = util.getConfigRoot();
  const bfConfig = util.findBrokerConfig(config, Broker.Bitflyer);
  const bfApi = new BitflyerApi(bfConfig.key, bfConfig.secret);

  const bfBalance = await bfApi.getBalance();
  const bfBtc = (bfBalance.find(x => x.currency_code === 'BTC') as Balance).available;
  const request = {
    product_code: 'BTC_JPY',
    child_order_type: 'MARKET',
    side: 'SELL',
    size: _.floor(bfBtc, 4)
  };
  try {
    console.log(`Selling ${bfBtc}...`);
    const response = await bfApi.sendChildOrder(request as any);
    console.log(response);
  } catch (ex) {
    console.log(ex.message);
  }
}

main();