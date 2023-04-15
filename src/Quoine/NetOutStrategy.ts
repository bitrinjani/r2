import type BrokerApi from "./BrokerApi";
import type { CashMarginTypeStrategy } from "./types";

import _ from "lodash";

export default class NetOutStrategy implements CashMarginTypeStrategy {
  constructor(private readonly brokerApi: BrokerApi) {}

  async getBtcPosition(): Promise<number> {
    const accounts = await this.brokerApi.getTradingAccounts();
    const account = _.find(accounts, b => b.currency_pair_code === "BTCJPY");
    if(!account){
      throw new Error("Unable to find the account.");
    }
    return account.position;
  }
}
