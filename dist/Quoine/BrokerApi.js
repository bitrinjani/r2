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
const util_1 = require("../util");
const WebClient_1 = require("../WebClient");
const types_1 = require("./types");
const jwt = require("jsonwebtoken");
class BrokerApi {
    constructor(key, secret) {
        this.key = key;
        this.secret = secret;
        this.baseUrl = 'https://api.quoine.com';
        this.webClient = new WebClient_1.default(this.baseUrl);
    }
    sendOrder(request) {
        return __awaiter(this, void 0, void 0, function* () {
            const path = '/orders/';
            return new types_1.SendOrderResponse(yield this.post(path, request));
        });
    }
    cancelOrder(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const path = `/orders/${id}/cancel`;
            return yield this.put(path);
        });
    }
    getOrders(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const path = `/orders/${id}`;
            return new types_1.OrdersResponse(yield this.get(path));
        });
    }
    getTradingAccounts() {
        return __awaiter(this, void 0, void 0, function* () {
            const path = '/trading_accounts';
            const response = yield this.get(path);
            return response.map(x => new types_1.TradingAccount(x));
        });
    }
    getAccountBalance() {
        return __awaiter(this, void 0, void 0, function* () {
            const path = '/accounts/balance';
            const response = yield this.get(path);
            return response.map(x => new types_1.AccountBalance(x));
        });
    }
    getPriceLevels() {
        return __awaiter(this, void 0, void 0, function* () {
            const path = '/products/5/price_levels';
            return new types_1.PriceLevelsResponse(yield this.webClient.fetch(path, undefined, false));
        });
    }
    closeAll() {
        return __awaiter(this, void 0, void 0, function* () {
            const path = '/trades/close_all';
            const response = yield this.put(path);
            return response.map(x => new types_1.ClosingTrade(x));
        });
    }
    call(path, method, body = '') {
        return __awaiter(this, void 0, void 0, function* () {
            const n = (0, util_1.nonce)();
            const payload = {
                path,
                nonce: n,
                token_id: this.key
            };
            const sign = jwt.sign(payload, this.secret);
            const headers = {
                'Content-Type': 'application/json',
                'X-Quoine-API-Version': '2',
                'X-Quoine-Auth': sign
            };
            const init = { method, headers, body };
            return yield this.webClient.fetch(path, init);
        });
    }
    post(path, requestBody) {
        return __awaiter(this, void 0, void 0, function* () {
            const method = 'POST';
            const body = JSON.stringify(requestBody);
            return yield this.call(path, method, body);
        });
    }
    get(path, requestParam) {
        return __awaiter(this, void 0, void 0, function* () {
            const method = 'GET';
            let pathWithParam = path;
            if (requestParam) {
                const param = (0, util_1.safeQueryStringStringify)(requestParam);
                pathWithParam += `?${param}`;
            }
            return yield this.call(pathWithParam, method);
        });
    }
    put(path) {
        return __awaiter(this, void 0, void 0, function* () {
            const method = 'PUT';
            return yield this.call(path, method);
        });
    }
}
exports.default = BrokerApi;
