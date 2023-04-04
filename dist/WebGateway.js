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
const inversify_1 = require("inversify");
const symbols_1 = require("./symbols");
const QuoteAggregator_1 = require("./QuoteAggregator");
const logger_1 = require("@bitr/logger");
const WebSocket = require("ws");
const constants_1 = require("./constants");
const _ = require("lodash");
const PositionService_1 = require("./PositionService");
const OpportunitySearcher_1 = require("./OpportunitySearcher");
const OrderService_1 = require("./OrderService");
const express = require("express");
const core_decorators_1 = require("core-decorators");
const opn = require('opn');
let WebGateway = class WebGateway {
    constructor(quoteAggregator, configStore, positionService, opportunitySearcher, orderService) {
        this.quoteAggregator = quoteAggregator;
        this.configStore = configStore;
        this.positionService = positionService;
        this.opportunitySearcher = opportunitySearcher;
        this.orderService = orderService;
        this.log = (0, logger_1.getLogger)(this.constructor.name);
        this.clients = [];
        this.staticPath = `${process.cwd()}/webui/dist`;
        this.eventMapper = [
            [this.quoteAggregator, 'quoteUpdated', this.quoteUpdated],
            [this.positionService, 'positionUpdated', this.positionUpdated],
            [this.opportunitySearcher, 'spreadAnalysisDone', this.spreadAnalysisDone],
            [this.opportunitySearcher, 'limitCheckDone', this.limitCheckDone],
            [this.opportunitySearcher, 'activePairRefresh', this.activePairRefresh],
            [this.orderService, 'orderCreated', this.orderCreated],
            [this.orderService, 'orderUpdated', this.orderUpdated],
            [this.orderService, 'orderFinalized', this.orderFinalized],
            [this.configStore, 'configUpdated', this.configUpdated]
        ];
    }
    start() {
        return __awaiter(this, void 0, void 0, function* () {
            const { webGateway } = this.configStore.config;
            if (!webGateway || !webGateway.enabled) {
                return;
            }
            const host = _.defaultTo(webGateway.host, 'localhost');
            this.log.debug(`Starting ${this.constructor.name}...`);
            for (const e of this.eventMapper) {
                e[0].on(e[1], e[2]);
            }
            this.app = express();
            this.app.use(express.static(this.staticPath));
            this.app.get('*', (req, res) => {
                res.sendFile(`${this.staticPath}/index.html`);
            });
            this.server = this.app.listen(constants_1.wssPort, host, () => {
                this.log.debug(`Express started listening on ${constants_1.wssPort}.`);
            });
            this.wss = new WebSocket.Server({ server: this.server });
            this.wss.on('connection', ws => {
                ws.on('error', err => {
                    this.log.debug(err.message);
                });
                this.clients.push(ws);
            });
            if (webGateway.openBrowser) {
                opn(`http://${host}:${constants_1.wssPort}`);
            }
            this.log.debug(`Started ${this.constructor.name}.`);
        });
    }
    stop() {
        return __awaiter(this, void 0, void 0, function* () {
            const { webGateway } = this.configStore.config;
            if (!webGateway || !webGateway.enabled) {
                return;
            }
            this.log.debug(`Stopping ${this.constructor.name}...`);
            this.wss.close();
            this.server.close();
            for (const e of this.eventMapper) {
                e[0].removeListener(e[1], e[2]);
            }
            this.log.debug(`Stopped ${this.constructor.name}.`);
        });
    }
    quoteUpdated(quotes) {
        return __awaiter(this, void 0, void 0, function* () {
            this.broadcast('quoteUpdated', quotes);
        });
    }
    positionUpdated(positions) {
        this.broadcast('positionUpdated', positions);
    }
    spreadAnalysisDone(result) {
        this.broadcast('spreadAnalysisDone', result);
    }
    limitCheckDone(limitCheckResult) {
        this.broadcast('limitCheckDone', limitCheckResult);
    }
    activePairRefresh(pairsWithAnalysis) {
        return __awaiter(this, void 0, void 0, function* () {
            this.broadcast('activePairRefresh', pairsWithAnalysis);
        });
    }
    orderCreated(order) {
        this.broadcast('orderCreated', order);
    }
    orderUpdated(order) {
        this.broadcast('orderUpdated', order);
    }
    orderFinalized(order) {
        this.broadcast('orderFinalized', order);
    }
    configUpdated(config) {
        this.broadcast('configUpdated', this.sanitize(config));
    }
    sanitize(config) {
        const copy = _.cloneDeep(config);
        for (const brokerConfig of copy.brokers) {
            delete brokerConfig.key;
            delete brokerConfig.secret;
        }
        delete copy.logging;
        return copy;
    }
    broadcast(type, body) {
        for (const client of this.clients) {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({ type, body }), err => {
                    if (err) {
                        this.log.debug(err.message);
                        _.pull(this.clients, client);
                    }
                });
            }
        }
    }
}; /* istanbul ignore next */
WebGateway = __decorate([
    (0, inversify_1.injectable)(),
    core_decorators_1.autobind,
    __param(1, (0, inversify_1.inject)(symbols_1.default.ConfigStore)),
    __metadata("design:paramtypes", [QuoteAggregator_1.default, Object, PositionService_1.default,
        OpportunitySearcher_1.default,
        OrderService_1.default])
], WebGateway);
exports.default = WebGateway;
