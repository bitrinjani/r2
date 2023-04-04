"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reviveOrder = void 0;
const _ = require("lodash");
const uuid_1 = require("uuid");
const types_1 = require("./types");
const util_1 = require("./util");
class OrderImpl {
    constructor(init) {
        this.id = (0, uuid_1.v4)();
        this.timeInForce = types_1.TimeInForce.None;
        this.status = types_1.OrderStatus.PendingNew;
        this.filledSize = 0;
        this.creationTime = new Date();
        this.executions = [];
        Object.assign(this, init);
    }
    get pendingSize() {
        return (0, util_1.eRound)(this.size - this.filledSize);
    }
    get averageFilledPrice() {
        return _.isEmpty(this.executions)
            ? 0
            : (0, util_1.eRound)(_.sumBy(this.executions, x => x.size * x.price) / _.sumBy(this.executions, x => x.size));
    }
    get filled() {
        return this.status === types_1.OrderStatus.Filled;
    }
    get filledNotional() {
        return this.averageFilledPrice * this.filledSize;
    }
}
exports.default = OrderImpl;
function reviveOrder(o) {
    const r = (0, util_1.revive)(OrderImpl, o);
    r.creationTime = new Date(r.creationTime);
    r.sentTime = new Date(r.sentTime);
    return r;
}
exports.reviveOrder = reviveOrder;
