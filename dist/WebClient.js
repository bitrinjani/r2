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
const node_fetch_1 = require("node-fetch");
const logger_1 = require("@bitr/logger");
class WebClient {
    constructor(baseUrl) {
        this.baseUrl = baseUrl;
        this.log = (0, logger_1.getLogger)('WebClient');
    }
    fetch(path, init = { timeout: WebClient.fetchTimeout }, verbose = true) {
        return __awaiter(this, void 0, void 0, function* () {
            const url = this.baseUrl + path;
            this.log.debug(`Sending HTTP request... URL: ${url} Request: ${JSON.stringify(init)}`);
            const res = yield (0, node_fetch_1.default)(url, init);
            let logText = `Response from ${res.url}. ` + `Status Code: ${res.status} (${res.statusText}) `;
            this.log.debug(logText);
            const content = yield res.text();
            if (!res.ok) {
                logText += `Content: ${content}`;
                throw new Error(`HTTP request failed. ${logText}`);
            }
            if (!content) {
                return {};
            }
            const t = JSON.parse(content);
            if (verbose) {
                this.log.debug(`Response content from ${res.url}: ${JSON.stringify(t)}`);
            }
            return t;
        });
    }
}
WebClient.fetchTimeout = 5000;
exports.default = WebClient;
