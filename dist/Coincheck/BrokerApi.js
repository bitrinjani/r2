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
const _ = require("lodash");
const util_1 = require("../util");
const WebClient_1 = require("../WebClient");
const types_1 = require("./types");
const timers_1 = require("timers");
class BrokerApi {
    constructor(key, secret) {
        this.key = key;
        this.secret = secret;
        this.baseUrl = 'https://coincheck.com';
        this.webClient = new WebClient_1.default(this.baseUrl);
    }
    getAccountsBalance() {
        return __awaiter(this, void 0, void 0, function* () {
            const path = '/api/accounts/balance';
            return new types_1.AccountsBalanceResponse(yield this.get(path));
        });
    }
    getLeverageBalance() {
        return __awaiter(this, void 0, void 0, function* () {
            const path = '/api/accounts/leverage_balance';
            return new types_1.LeverageBalanceResponse(yield this.get(path));
        });
    }
    getOpenOrders() {
        return __awaiter(this, void 0, void 0, function* () {
            const path = '/api/exchange/orders/opens';
            return new types_1.OpenOrdersResponse(yield this.get(path));
        });
    }
    getLeveragePositions(request) {
        return __awaiter(this, void 0, void 0, function* () {
            const path = '/api/exchange/leverage/positions';
            return new types_1.LeveragePositionsResponse(yield this.get(path, request));
        });
    }
    getAllOpenLeveragePositions(limit = 20) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.leveragePositionsCache) {
                return _.cloneDeep(this.leveragePositionsCache);
            }
            let result = [];
            const request = { limit, status: 'open', order: 'desc' };
            let reply = yield this.getLeveragePositions(request);
            while (reply.data !== undefined && reply.data.length > 0) {
                result = _.concat(result, reply.data);
                if (reply.data.length < limit) {
                    break;
                }
                const last = _.last(reply.data);
                reply = yield this.getLeveragePositions(Object.assign(Object.assign({}, request), { starting_after: last.id }));
            }
            this.leveragePositionsCache = result;
            (0, timers_1.setTimeout)(() => (this.leveragePositionsCache = undefined), BrokerApi.CACHE_MS);
            return result;
        });
    }
    getOrderBooks() {
        return __awaiter(this, void 0, void 0, function* () {
            const path = '/api/order_books';
            return new types_1.OrderBooksResponse(yield this.webClient.fetch(path, undefined, false));
        });
    }
    newOrder(request) {
        return __awaiter(this, void 0, void 0, function* () {
            const path = '/api/exchange/orders';
            return new types_1.NewOrderResponse(yield this.post(path, request));
        });
    }
    cancelOrder(orderId) {
        return __awaiter(this, void 0, void 0, function* () {
            const path = `/api/exchange/orders/${orderId}`;
            return new types_1.CancelOrderResponse(yield this.delete(path));
        });
    }
    getTransactions(pagination) {
        return __awaiter(this, void 0, void 0, function* () {
            const path = '/api/exchange/orders/transactions_pagination';
            return new types_1.TransactionsResponse(yield this.get(path, pagination));
        });
    }
    getTransactionsWithStartDate(from) {
        return __awaiter(this, void 0, void 0, function* () {
            let transactions = [];
            const pagination = { order: 'desc', limit: 20 };
            let res = yield this.getTransactions(pagination);
            while (res.data.length > 0) {
                const last = _.last(res.data);
                transactions = _.concat(transactions, res.data.filter(x => from < x.created_at));
                if (from > last.created_at || res.pagination.limit > res.data.length) {
                    break;
                }
                const lastId = last.id;
                res = yield this.getTransactions(Object.assign(Object.assign({}, pagination), { starting_after: lastId }));
            }
            return transactions;
        });
    }
    call(path, method, body = '') {
        const n = (0, util_1.nonce)();
        const url = this.baseUrl + path;
        const message = n + url + body;
        const sign = (0, util_1.hmac)(this.secret, message);
        const headers = {
            'ACCESS-KEY': this.key,
            'ACCESS-NONCE': n,
            'ACCESS-SIGNATURE': sign
        };
        if (method === 'POST') {
            headers['Content-Type'] = 'application/x-www-form-urlencoded';
        }
        const init = { method, headers, body };
        return this.webClient.fetch(path, init);
    }
    post(path, requestBody) {
        const method = 'POST';
        const body = (0, util_1.safeQueryStringStringify)(requestBody);
        return this.call(path, method, body);
    }
    get(path, requestParam) {
        const method = 'GET';
        let pathWithParam = path;
        if (requestParam) {
            const param = (0, util_1.safeQueryStringStringify)(requestParam);
            pathWithParam += `?${param}`;
        }
        return this.call(pathWithParam, method);
    }
    delete(path) {
        const method = 'DELETE';
        return this.call(path, method);
    }
}
BrokerApi.CACHE_MS = 1000;
exports.default = BrokerApi;
