// Ad-hoc script to close all trades in quoine.
import * as util from '../src/util';
import QuoineApi from '../src/Quoine/BrokerApi';
import { Broker } from '../src/types';
import { options } from '../src/logger';

options.enabled = false;

async function main() {
  const config = util.getConfigRoot();  
  const quConfig = util.findBrokerConfig(config, Broker.Quoine);
  const quApi = new QuoineApi(quConfig.key, quConfig.secret);

  // quoine margin balance
  try {
    console.log('Closing all in Quoine...');
    await quApi.closeAll();
    console.log('Done.');
  } catch (ex) {
    console.log(ex);
  }
}

main();