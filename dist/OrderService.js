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
const events_1 = require("events");
const inversify_1 = require("inversify");
const OrderImpl_1 = require("./OrderImpl");
const symbols_1 = require("./symbols");
const _ = require("lodash");
let OrderService = class OrderService extends events_1.EventEmitter {
    constructor(historicalOrderStore) {
        super();
        this.historicalOrderStore = historicalOrderStore;
        this.orders = [];
    }
    createOrder(init) {
        const order = new OrderImpl_1.default(init);
        this.orders.push(order);
        this.emit('orderCreated', order);
        return order;
    }
    emitOrderUpdated(order) {
        this.emit('orderUpdated', order);
    }
    finalizeOrder(order) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.historicalOrderStore.put(order);
            _.pull(this.orders, order);
            this.emit('orderFinalized', order);
        });
    }
}; /* istanbul ignore next */
OrderService = __decorate([
    (0, inversify_1.injectable)(),
    __param(0, (0, inversify_1.inject)(symbols_1.default.HistoricalOrderStore)),
    __metadata("design:paramtypes", [Object])
], OrderService);
exports.default = OrderService;
