// Ad-hoc script to close all trades in quoine.
import QuoineApi from '../src/Quoine/BrokerApi';
import { options } from '@bitr/logger';
import { findBrokerConfig, getConfigRoot } from '../src/configUtil';

options.enabled = false;

async function main() {
  const config = getConfigRoot();
  const quConfig = findBrokerConfig(config, 'Quoine');
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
