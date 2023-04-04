"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const node_fetch_1 = require("node-fetch");
const querystring = require("querystring");
class LineIntegration {
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
            message
        };
        const body = querystring.stringify(payload);
        const init = {
            body,
            method: 'POST',
            headers: {
                Authorization: `Bearer ${this.config.token}`,
                'Content-Type': 'application/x-www-form-urlencoded',
                'Content-Length': body.length.toString()
            },
            timeout: LineIntegration.fetchTimeout
        };
        (0, node_fetch_1.default)(LineIntegration.apiUrl, init)
            .then(res => {
            if (!res.ok) {
                res.text().then(s => console.log(`LINE notify failed. ${res.statusText}: ${s}`));
            }
        })
            .catch(ex => console.log(`LINE notify failed. ${ex}`));
    }
}
LineIntegration.fetchTimeout = 5000;
LineIntegration.apiUrl = 'https://notify-api.line.me/api/notify';
exports.default = LineIntegration;
