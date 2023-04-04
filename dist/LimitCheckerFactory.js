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
Object.defineProperty(exports, "__esModule", { value: true });
const inversify_1 = require("inversify");
const symbols_1 = require("./symbols");
const PositionService_1 = require("./PositionService");
const MainLimitChecker_1 = require("./MainLimitChecker");
let LimitCheckerFactory = class LimitCheckerFactory {
    constructor(configStore, positionService) {
        this.configStore = configStore;
        this.positionService = positionService;
    }
    create(spreadAnalysisResult, orderPair) {
        return new MainLimitChecker_1.default(this.configStore, this.positionService, spreadAnalysisResult, orderPair);
    }
}; /* istanbul ignore next */
LimitCheckerFactory = __decorate([
    (0, inversify_1.injectable)(),
    __param(0, (0, inversify_1.inject)(symbols_1.default.ConfigStore)),
    __metadata("design:paramtypes", [Object, PositionService_1.default])
], LimitCheckerFactory);
exports.default = LimitCheckerFactory;
