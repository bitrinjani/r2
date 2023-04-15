// Ad-hoc script to flat bitFlyer BTC cash position.
import type { Balance } from "../src/Bitflyer/types";

import { options } from "@bitr/logger";
import * as _ from "lodash";

import BitflyerApi from "../src/Bitflyer/BrokerApi";
import { getConfigRoot, findBrokerConfig } from "../src/config";

options.enabled = false;

async function main() {
  const config = getConfigRoot();
  const bfConfig = findBrokerConfig(config, "Bitflyer");
  const bfApi = new BitflyerApi(bfConfig.key, bfConfig.secret);
  const bfBalance = await bfApi.getBalance();
  const bfBtc = (bfBalance.find(x => x.currency_code === "BTC") as Balance).available;
  const request = {
    product_code: "BTC_JPY",
    child_order_type: "MARKET",
    side: "SELL",
    size: _.floor(bfBtc, 4),
  };
  try{
    console.log(`Selling ${bfBtc}...`);
    const response = await bfApi.sendChildOrder(request);
    console.log(response);
  } catch(ex){
    console.log(ex.message);
  }
}

main();
