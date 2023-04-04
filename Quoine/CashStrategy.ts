import { CashMarginTypeStrategy } from './types';
import BrokerApi from './BrokerApi';

export default class CashStrategy implements CashMarginTypeStrategy {
  constructor(private readonly brokerApi: BrokerApi) {}

  async getBtcPosition(): Promise<number> {
    const accounts = await this.brokerApi.getAccountBalance();
    const account = accounts.find(b => b.currency === 'BTC');
    if (account === undefined) {
      throw new Error ('Unable to find the account.');
    }
    return account.balance;
  }
}
