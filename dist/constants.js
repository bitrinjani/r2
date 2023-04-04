"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.wssLogPort = exports.wssPort = exports.reportServiceRepUrl = exports.reportServicePubUrl = exports.configStoreSocketUrl = exports.fatalErrors = exports.LOT_MIN_DECIMAL_PLACE = void 0;
exports.LOT_MIN_DECIMAL_PLACE = 3;
exports.fatalErrors = [
    'insufficient balance',
    'Insufficient funds',
    'Too Many Requests',
    'Service Unavailable',
    '所持金額が足りません',
    'not_enough_free_balance',
    'Conditions and Trading Rules before continuing',
    'product_disabled'
];
exports.configStoreSocketUrl = 'tcp://127.0.0.1:8709';
exports.reportServicePubUrl = 'tcp://127.0.0.1:8710';
exports.reportServiceRepUrl = 'tcp://127.0.0.1:8711';
exports.wssPort = 8720;
exports.wssLogPort = 8721;
