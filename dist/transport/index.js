"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const transform_1 = require("./transform");
const fs = require("fs");
const SlackIntegration_1 = require("./SlackIntegration");
const LineIntegration_1 = require("./LineIntegration");
const configUtil_1 = require("../configUtil");
const mkdirp_1 = require("mkdirp");
const _ = require("lodash");
const WebSocket = require("ws");
const constants_1 = require("../constants");
const express = require("express");
let wss;
let app;
let server;
process.on('SIGINT', () => {
    if (wss) {
        wss.close();
    }
    if (server) {
        server.close();
    }
});
const logdir = './logs';
mkdirp_1.default.sync(logdir);
let configRoot;
try {
    configRoot = (0, configUtil_1.getConfigRoot)();
}
catch (ex) {
    console.log(ex.message);
}
// console output
process.stdin.pipe((0, transform_1.pretty)({ withLabel: false, debug: false, hidden: false })).pipe(process.stdout);
// debug.log
const debugFile = fs.createWriteStream('logs/debug.log', { flags: 'a' });
process.stdin.pipe((0, transform_1.pretty)({ withLabel: true, debug: true, hidden: false })).pipe(debugFile);
// info.log
const infoTransform = process.stdin.pipe((0, transform_1.pretty)({ withLabel: true, debug: false, hidden: false }));
const infoFile = fs.createWriteStream('logs/info.log', { flags: 'a' });
infoTransform.pipe(infoFile);
// notification integrations
if (configRoot) {
    const slackConfig = _.get(configRoot, 'logging.slack');
    const lineConfig = _.get(configRoot, 'logging.line');
    addIntegration(SlackIntegration_1.default, slackConfig);
    addIntegration(LineIntegration_1.default, lineConfig);
}
// websocket integration
const webGatewayConfig = _.get(configRoot, 'webGateway');
if (webGatewayConfig && webGatewayConfig.enabled) {
    const clients = [];
    const wsTransform = process.stdin.pipe((0, transform_1.splitToJson)());
    app = express();
    server = app.listen(constants_1.wssLogPort, webGatewayConfig.host, () => {
        _.noop();
    });
    wss = new WebSocket.Server({ server });
    wss.on('connection', ws => {
        ws.on('error', err => {
            _.noop();
        });
        clients.push(ws);
    });
    wsTransform.on('data', line => {
        if (!line) {
            return;
        }
        try {
            broadcast(clients, 'log', line);
        }
        catch (err) {
            _.noop();
        }
    });
}
function broadcast(clients, type, body) {
    for (const client of clients) {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({ type, body }), err => {
                if (err) {
                    _.pull(clients, client);
                }
            });
        }
    }
}
function addIntegration(Integration, config) {
    if (config && config.enabled) {
        const integration = new Integration(config);
        infoTransform.on('data', line => integration.handler(line));
    }
}
