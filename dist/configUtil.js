"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.findBrokerConfig = exports.getConfigPath = exports.getConfigRoot = void 0;
const path = require("path");
const fs = require("fs");
const types_1 = require("./types");
const util_1 = require("./util");
const _ = require("lodash");
const defaultValues = {
    symbol: 'BTC/JPY'
};
function getConfigRoot() {
    let configPath = getConfigPath();
    if (!fs.existsSync(configPath)) {
        configPath = path.join(process.cwd(), path.basename(configPath));
    }
    const config = new types_1.ConfigRoot((0, util_1.readJsonFileSync)(configPath));
    return _.defaultsDeep({}, config, defaultValues);
}
exports.getConfigRoot = getConfigRoot;
function getConfigPath() {
    return process.env.NODE_ENV !== 'test' ? `${process.cwd()}/config.json` : `${__dirname}/__tests__/config_test.json`;
}
exports.getConfigPath = getConfigPath;
function findBrokerConfig(configRoot, broker) {
    const found = configRoot.brokers.find(brokerConfig => brokerConfig.broker === broker);
    if (found === undefined) {
        throw new Error(`Unable to find ${broker} in config.`);
    }
    return found;
}
exports.findBrokerConfig = findBrokerConfig;
