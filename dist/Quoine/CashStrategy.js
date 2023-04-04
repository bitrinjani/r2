"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
class CashStrategy {
    constructor(brokerApi) {
        this.brokerApi = brokerApi;
    }
    getBtcPosition() {
        return __awaiter(this, void 0, void 0, function* () {
            const accounts = yield this.brokerApi.getAccountBalance();
            const account = accounts.find(b => b.currency === 'BTC');
            if (account === undefined) {
                throw new Error('Unable to find the account.');
            }
            return account.balance;
        });
    }
}
exports.default = CashStrategy;
