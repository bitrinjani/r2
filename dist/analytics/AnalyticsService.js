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
const logger_1 = require("@bitr/logger");
const constants_1 = require("../constants");
const messages_1 = require("../messages");
const ZmqSubscriber_1 = require("../zmq/ZmqSubscriber");
class AnalyticsService {
    constructor() {
        this.log = (0, logger_1.getLogger)(this.constructor.name);
        this.pluginDir = `${process.cwd()}/plugins`;
        this.configRequester = new messages_1.ConfigRequester(constants_1.configStoreSocketUrl);
        this.snapshotRequester = new messages_1.SnapshotRequester(constants_1.reportServiceRepUrl);
        this.streamSubscriber = new ZmqSubscriber_1.default(constants_1.reportServicePubUrl);
    }
    start() {
        return __awaiter(this, void 0, void 0, function* () {
            this.log.debug('Starting AnalyticsService');
            this.config = yield this.getConfig();
            const snapshotMessage = yield this.snapshotRequester.request({ type: 'spreadStatSnapshot' });
            if (!snapshotMessage.success || snapshotMessage.data === undefined) {
                throw new Error('Failed to initial snapshot message.');
            }
            this.spreadStatHandler = yield this.getSpreadStatHandler(snapshotMessage.data);
            this.streamSubscriber.subscribe('spreadStat', message => this.handleStream(message));
            process.on('message', message => {
                if (message === 'stop') {
                    this.log.info('Analysis process received stop message.');
                    this.stop();
                }
            });
            this.log.debug('Started.');
        });
    }
    stop() {
        return __awaiter(this, void 0, void 0, function* () {
            this.log.debug('Stopping AnalyticsService...');
            try {
                this.streamSubscriber.unsubscribe('spreadStat');
                this.streamSubscriber.dispose();
                this.snapshotRequester.dispose();
                this.configRequester.dispose();
            }
            catch (ex) {
                this.log.warn(ex.message);
                this.log.debug(ex.stack);
            }
            this.log.debug('Stopped.');
        });
    }
    getConfig() {
        return __awaiter(this, void 0, void 0, function* () {
            const reply = yield this.configRequester.request({ type: 'get' });
            if (!reply.success || reply.data === undefined) {
                throw new Error('Analytics failed to get the config.');
            }
            return reply.data.analytics;
        });
    }
    getSpreadStatHandler(snapshot) {
        return __awaiter(this, void 0, void 0, function* () {
            const SpreadStatHandler = yield Promise.resolve(`${`${this.pluginDir}/${this.config.plugin}`}`).then(s => require(s));
            return new SpreadStatHandler(snapshot);
        });
    }
    handleStream(spreadStat) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.isHandling) {
                return;
            }
            try {
                this.isHandling = true;
                this.log.debug('Received spread-stat message.');
                if (spreadStat) {
                    const config = yield this.spreadStatHandler.handle(spreadStat);
                    if (config) {
                        this.log.debug(`Sending to config store... ${JSON.stringify(config)}`);
                        const reply = yield this.configRequester.request({ type: 'set', data: config });
                        this.log.debug(`Reply from config store: ${JSON.stringify(reply)}`);
                    }
                }
            }
            catch (ex) {
                this.log.warn(`${ex.message}`);
                this.log.debug(ex.stack);
            }
            finally {
                this.isHandling = false;
            }
        });
    }
}
exports.default = AnalyticsService;
