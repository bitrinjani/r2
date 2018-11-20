// Ad-hoc script to flat bitbank BTC cash position.
import BitbankccApi, { Asset } from '@bitr/bitbankcc-api';
import { options } from '@bitr/logger';
import { findBrokerConfig, getConfigRoot } from '../src/configUtil';

options.enabled = false;

async function main() {
  const config = getConfigRoot();
  const bbConfig = findBrokerConfig(config, 'Bitbankcc');
  const bbApi = new BitbankccApi(bbConfig.key, bbConfig.secret);
  const bbAssetsResponse = await bbApi.getAssets();
  const bbBtc = bbAssetsResponse.assets.find(b => b.asset === 'btc') as Asset;

  const request = {
    pair: 'btc_jpy',
    type: 'market',
    side: 'sell',
    price: 0,
    amount: bbBtc.free_amount
  };

  if (bbBtc.free_amount > 0){
    try {
      console.log(`Selling ${bbBtc.free_amount}...`);
      const response = await bbApi.sendOrder(request);
      console.log(response);
    } catch (ex) {
      console.log(ex.message);
    }  
  }
  console.log('Done.');
}

main();
