"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const node_fetch_1 = require("node-fetch");
class SlackIntegration {
    constructor(config) {
        this.config = config;
        this.config = config;
    }
    handler(message) {
        const keywords = this.config.keywords;
        if (!(keywords instanceof Array)) {
            return;
        }
        if (!keywords.some(x => message.includes(x))) {
            return;
        }
        const payload = {
            text: message,
            channel: this.config.channel,
            username: this.config.username
        };
        const init = {
            method: 'POST',
            body: JSON.stringify(payload),
            headers: { 'Content-Type': 'application/json' },
            timeout: SlackIntegration.fetchTimeout
        };
        (0, node_fetch_1.default)(this.config.url, init).catch(ex => console.log(ex));
    }
}
SlackIntegration.fetchTimeout = 5000;
exports.default = SlackIntegration;
