"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.create = void 0;
const BrokerAdapterImpl_1 = require("./BrokerAdapterImpl");
function create(config) {
    return new BrokerAdapterImpl_1.default(config);
}
exports.create = create;
