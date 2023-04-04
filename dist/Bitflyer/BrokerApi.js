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
class BrokerApi {
    constructor(key, secret) {
        this.key = key;
        this.secret = secret;
        this.baseUrl = 'https://api.bitflyer.jp';
        this.webClient = new WebClient_1.default(this.baseUrl);
    }
    sendChildOrder(request) {
        return __awaiter(this, void 0, void 0, function* () {
            const path = '/v1/me/sendchildorder';
            return new types_1.SendChildOrderResponse(yield this.post(path, request));
        });
    }
    cancelChildOrder(request) {
        return __awaiter(this, void 0, void 0, function* () {
            const path = '/v1/me/cancelchildorder';
            return yield this.post(path, request);
        });
    }
    getChildOrders(param) {
        return __awaiter(this, void 0, void 0, function* () {
            const path = '/v1/me/getchildorders';
            const response = yield this.get(path, param);
            return response.map(x => new types_1.ChildOrder(x));
        });
    }
    getExecutions(param) {
        return __awaiter(this, void 0, void 0, function* () {
            const path = '/v1/me/getexecutions';
            const response = yield this.get(path, param);
            return response.map(x => new types_1.Execution(x));
        });
    }
    getBalance() {
        return __awaiter(this, void 0, void 0, function* () {
            const path = '/v1/me/getbalance';
            const response = yield this.get(path);
            return response.map(x => new types_1.Balance(x));
        });
    }
    getBoard() {
        return __awaiter(this, void 0, void 0, function* () {
            const path = '/v1/board';
            return new types_1.BoardResponse(yield this.webClient.fetch(path, undefined, false));
        });
    }
    call(path, method, body = '') {
        return __awaiter(this, void 0, void 0, function* () {
            const n = (0, util_1.nonce)();
            const message = n + method + path + body;
            const sign = (0, util_1.hmac)(this.secret, message);
            const headers = {
                'Content-Type': 'application/json',
                'ACCESS-KEY': this.key,
                'ACCESS-TIMESTAMP': n,
                'ACCESS-SIGN': sign
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
}
exports.default = BrokerApi;
