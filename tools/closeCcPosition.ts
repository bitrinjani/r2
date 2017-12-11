// Ad-hoc script to close all leverage positions in Coincheck.

import * as util from '../src/util';
import CoincheckApi from '../src/Coincheck/BrokerApi';
import { Broker } from '../src/types';

async function main() {
  const config = util.getConfigRoot();
  const ccConfig = util.findBrokerConfig(config, Broker.Coincheck);
  const ccApi = new CoincheckApi(ccConfig.key, ccConfig.secret);
  const positions = await ccApi.getAllOpenLeveragePositions();
  for (const position of positions) {
    const request = {
      pair: 'btc_jpy',
      order_type: position.side === 'buy' ? 'close_long' : 'close_short',
      amount: position.amount,
      position_id: position.id
    };
    console.log(`Closing position id ${position.id}...`);
    const reply = await ccApi.newOrder(request as any);
    if (!reply.success) {
      console.log(reply);
    } else {
      console.log(`Close order was sent.`);
    }
  }
}

main();