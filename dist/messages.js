"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SnapshotResponder = exports.SnapshotRequester = exports.ConfigResponder = exports.ConfigRequester = void 0;
const zmq_1 = require("@bitr/zmq");
class ConfigRequester extends zmq_1.ZmqRequester {
}
exports.ConfigRequester = ConfigRequester;
class ConfigResponder extends zmq_1.ZmqResponder {
}
exports.ConfigResponder = ConfigResponder;
class SnapshotRequester extends zmq_1.ZmqRequester {
}
exports.SnapshotRequester = SnapshotRequester;
class SnapshotResponder extends zmq_1.ZmqResponder {
}
exports.SnapshotResponder = SnapshotResponder;
