"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
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
const SpreadAnalyzer_1 = require("./SpreadAnalyzer");
const inversify_1 = require("inversify");
const symbols_1 = require("./symbols");
const QuoteAggregator_1 = require("./QuoteAggregator");
const SpreadStatTimeSeries_1 = require("./SpreadStatTimeSeries");
const fs = require("fs");
const mkdirp = require("mkdirp");
const util_1 = require("util");
const child_process_1 = require("child_process");
const constants_1 = require("./constants");
const logger_1 = require("@bitr/logger");
const util_2 = require("./util");
const luxon_1 = require("luxon");
const messages_1 = require("./messages");
const zmq_1 = require("@bitr/zmq");
const writeFile = (0, util_1.promisify)(fs.writeFile);
let ReportService = class ReportService {
    constructor(quoteAggregator, spreadAnalyzer, spreadStatTimeSeries, configStore) {
        this.quoteAggregator = quoteAggregator;
        this.spreadAnalyzer = spreadAnalyzer;
        this.spreadStatTimeSeries = spreadStatTimeSeries;
        this.configStore = configStore;
        this.log = (0, logger_1.getLogger)(this.constructor.name);
        this.analyticsPath = `${__dirname}/analytics`;
        this.reportDir = `${(0, util_2.cwd)()}/reports`;
        this.spreadStatReport = `${this.reportDir}/spreadStat.csv`;
    }
    start() {
        return __awaiter(this, void 0, void 0, function* () {
            this.log.debug('Starting ReportService...');
            mkdirp.sync(this.reportDir);
            if (!fs.existsSync(this.spreadStatReport)) {
                yield writeFile(this.spreadStatReport, SpreadStatTimeSeries_1.spreadStatCsvHeader, { flag: 'a' });
            }
            this.spreadStatWriteStream = fs.createWriteStream(this.spreadStatReport, { flags: 'a' });
            this.handlerRef = this.quoteUpdated.bind(this);
            this.quoteAggregator.on('quoteUpdated', this.handlerRef);
            const { analytics } = this.configStore.config;
            if (analytics && analytics.enabled) {
                const duration = luxon_1.Duration.fromObject(analytics.initialHistory);
                const dt = luxon_1.DateTime.local();
                const start = dt.minus(duration).toJSDate();
                const end = dt.toJSDate();
                const snapshot = yield this.spreadStatTimeSeries.query({ start, end });
                this.snapshotResponder = new messages_1.SnapshotResponder(constants_1.reportServiceRepUrl, (request, respond) => {
                    if (request && request.type === 'spreadStatSnapshot') {
                        respond({ success: true, data: snapshot.map(s => s.value) });
                    }
                    else {
                        respond({ success: false, reason: 'invalid request' });
                    }
                });
                this.streamPublisher = new zmq_1.ZmqPublisher(constants_1.reportServicePubUrl);
                this.analyticsProcess = (0, child_process_1.fork)(this.analyticsPath, [], { stdio: [0, 1, 2, 'ipc'] });
            }
            this.log.debug('Started.');
        });
    }
    stop() {
        return __awaiter(this, void 0, void 0, function* () {
            this.log.debug('Stopping ReportService...');
            this.quoteAggregator.removeListener('quoteUpdated', this.handlerRef);
            this.spreadStatWriteStream.close();
            if (this.analyticsProcess) {
                yield (0, util_1.promisify)(this.analyticsProcess.send).bind(this.analyticsProcess)('stop');
                this.analyticsProcess.kill();
                this.streamPublisher.dispose();
                this.snapshotResponder.dispose();
            }
            this.log.debug('Stopped.');
        });
    }
    quoteUpdated(quotes) {
        return __awaiter(this, void 0, void 0, function* () {
            const stat = yield this.spreadAnalyzer.getSpreadStat(quotes);
            if (stat) {
                yield this.spreadStatTimeSeries.put(stat);
                yield (0, util_1.promisify)(this.spreadStatWriteStream.write).bind(this.spreadStatWriteStream)((0, SpreadStatTimeSeries_1.spreadStatToCsv)(stat));
                const { analytics } = this.configStore.config;
                if (analytics && analytics.enabled && this.analyticsProcess.connected) {
                    this.streamPublisher.publish('spreadStat', stat);
                }
            }
        });
    }
}; /* istanbul ignore next */
ReportService = __decorate([
    (0, inversify_1.injectable)(),
    __param(2, (0, inversify_1.inject)(symbols_1.default.SpreadStatTimeSeries)),
    __param(3, (0, inversify_1.inject)(symbols_1.default.ConfigStore)),
    __metadata("design:paramtypes", [QuoteAggregator_1.default,
        SpreadAnalyzer_1.default, Object, Object])
], ReportService);
exports.default = ReportService;
