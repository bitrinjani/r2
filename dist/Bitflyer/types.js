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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChildOrder = exports.Balance = exports.Execution = exports.SendChildOrderResponse = exports.BoardResponse = void 0;
// tslint:disable:variable-name
const castable_1 = require("@bitr/castable");
class PriceSizePair extends castable_1.Castable {
}
__decorate([
    castable_1.cast,
    __metadata("design:type", Number)
], PriceSizePair.prototype, "price", void 0);
__decorate([
    castable_1.cast,
    __metadata("design:type", Number)
], PriceSizePair.prototype, "size", void 0);
class BoardResponse extends castable_1.Castable {
}
__decorate([
    castable_1.cast,
    __metadata("design:type", Number)
], BoardResponse.prototype, "mid_price", void 0);
__decorate([
    castable_1.cast,
    (0, castable_1.element)(PriceSizePair),
    __metadata("design:type", Array)
], BoardResponse.prototype, "bids", void 0);
__decorate([
    castable_1.cast,
    (0, castable_1.element)(PriceSizePair),
    __metadata("design:type", Array)
], BoardResponse.prototype, "asks", void 0);
exports.BoardResponse = BoardResponse;
class SendChildOrderResponse extends castable_1.Castable {
}
__decorate([
    castable_1.cast,
    __metadata("design:type", String)
], SendChildOrderResponse.prototype, "child_order_acceptance_id", void 0);
exports.SendChildOrderResponse = SendChildOrderResponse;
class Execution extends castable_1.Castable {
}
__decorate([
    castable_1.cast,
    __metadata("design:type", Number)
], Execution.prototype, "id", void 0);
__decorate([
    castable_1.cast,
    __metadata("design:type", String)
], Execution.prototype, "child_order_id", void 0);
__decorate([
    castable_1.cast,
    __metadata("design:type", String)
], Execution.prototype, "side", void 0);
__decorate([
    castable_1.cast,
    __metadata("design:type", Number)
], Execution.prototype, "price", void 0);
__decorate([
    castable_1.cast,
    __metadata("design:type", Number)
], Execution.prototype, "size", void 0);
__decorate([
    castable_1.cast,
    __metadata("design:type", Number)
], Execution.prototype, "commission", void 0);
__decorate([
    (0, castable_1.cast)(Date),
    __metadata("design:type", Date)
], Execution.prototype, "exec_date", void 0);
__decorate([
    castable_1.cast,
    __metadata("design:type", String)
], Execution.prototype, "child_order_acceptance_id", void 0);
exports.Execution = Execution;
class Balance extends castable_1.Castable {
}
__decorate([
    castable_1.cast,
    __metadata("design:type", String)
], Balance.prototype, "currency_code", void 0);
__decorate([
    castable_1.cast,
    __metadata("design:type", Number)
], Balance.prototype, "amount", void 0);
__decorate([
    castable_1.cast,
    __metadata("design:type", Number)
], Balance.prototype, "available", void 0);
exports.Balance = Balance;
class ChildOrder extends castable_1.Castable {
}
__decorate([
    castable_1.cast,
    __metadata("design:type", Number)
], ChildOrder.prototype, "id", void 0);
__decorate([
    castable_1.cast,
    __metadata("design:type", String)
], ChildOrder.prototype, "child_order_id", void 0);
__decorate([
    castable_1.cast,
    __metadata("design:type", String)
], ChildOrder.prototype, "product_code", void 0);
__decorate([
    castable_1.cast,
    __metadata("design:type", String)
], ChildOrder.prototype, "side", void 0);
__decorate([
    castable_1.cast,
    __metadata("design:type", String)
], ChildOrder.prototype, "child_order_type", void 0);
__decorate([
    castable_1.cast,
    __metadata("design:type", Number)
], ChildOrder.prototype, "price", void 0);
__decorate([
    castable_1.cast,
    __metadata("design:type", Number)
], ChildOrder.prototype, "average_price", void 0);
__decorate([
    castable_1.cast,
    __metadata("design:type", Number)
], ChildOrder.prototype, "size", void 0);
__decorate([
    castable_1.cast,
    __metadata("design:type", String)
], ChildOrder.prototype, "child_order_state", void 0);
__decorate([
    (0, castable_1.cast)(Date),
    __metadata("design:type", Date)
], ChildOrder.prototype, "expire_date", void 0);
__decorate([
    (0, castable_1.cast)(Date),
    __metadata("design:type", Date)
], ChildOrder.prototype, "child_order_date", void 0);
__decorate([
    castable_1.cast,
    __metadata("design:type", String)
], ChildOrder.prototype, "child_order_acceptance_id", void 0);
__decorate([
    castable_1.cast,
    __metadata("design:type", Number)
], ChildOrder.prototype, "outstanding_size", void 0);
__decorate([
    castable_1.cast,
    __metadata("design:type", Number)
], ChildOrder.prototype, "cancel_size", void 0);
__decorate([
    castable_1.cast,
    __metadata("design:type", Number)
], ChildOrder.prototype, "executed_size", void 0);
__decorate([
    castable_1.cast,
    __metadata("design:type", Number)
], ChildOrder.prototype, "total_commission", void 0);
exports.ChildOrder = ChildOrder;
