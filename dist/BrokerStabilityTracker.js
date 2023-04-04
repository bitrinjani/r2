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
const _ = require("lodash");
const MAX = 10;
const MIN = 1;
let BrokerStabilityTracker = class BrokerStabilityTracker {
    constructor(configStore) {
        this.configStore = configStore;
        const brokers = this.configStore.config.brokers.map(b => b.broker);
        this.stabilityMap = new Map(brokers.map(b => [b, MAX]));
    }
    start() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.configStore.config.stabilityTracker) {
                const interval = this.configStore.config.stabilityTracker.recoveryInterval || 60 * 1000;
                this.timer = setInterval(() => this.recover(), interval);
            }
        });
    }
    stop() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.timer) {
                clearInterval(this.timer);
            }
        });
    }
    decrement(broker) {
        if (this.stabilityMap.has(broker)) {
            const counter = this.stability(broker);
            const newValue = counter - 1;
            this.stabilityMap.set(broker, _.clamp(newValue, MIN, MAX));
        }
    }
    isStable(broker) {
        if (!this.stabilityMap.has(broker)) {
            return false;
        }
        const counter = this.stability(broker);
        let threshold = 0;
        if (this.configStore.config.stabilityTracker) {
            threshold = this.configStore.config.stabilityTracker.threshold || 0;
        }
        return counter >= threshold;
    }
    stability(broker) {
        return this.stabilityMap.get(broker);
    }
    increment(broker) {
        const counter = this.stability(broker);
        const newValue = counter + 1;
        this.stabilityMap.set(broker, _.clamp(newValue, MIN, MAX));
    }
    recover() {
        const brokers = this.configStore.config.brokers.map(b => b.broker);
        for (const broker of brokers) {
            this.increment(broker);
        }
    }
}; /* istanbul ignore next */
BrokerStabilityTracker = __decorate([
    (0, inversify_1.injectable)(),
    __param(0, (0, inversify_1.inject)(symbols_1.default.ConfigStore)),
    __metadata("design:paramtypes", [Object])
], BrokerStabilityTracker);
exports.default = BrokerStabilityTracker;
