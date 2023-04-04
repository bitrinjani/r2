"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getActivePairStore = void 0;
const OrderImpl_1 = require("./OrderImpl");
const events_1 = require("events");
class EmittableActivePairStore extends events_1.EventEmitter {
    constructor(chronoDB) {
        super();
        this.timeSeries = chronoDB.getTimeSeries('ActivePair', orderPair => orderPair.map(o => (0, OrderImpl_1.reviveOrder)(o)));
    }
    get(key) {
        return this.timeSeries.get(key);
    }
    getAll() {
        return this.timeSeries.getAll();
    }
    put(value) {
        this.emit('change');
        return this.timeSeries.put(value);
    }
    del(key) {
        this.emit('change');
        return this.timeSeries.del(key);
    }
    delAll() {
        this.emit('change');
        return this.timeSeries.delAll();
    }
}
const getActivePairStore = (chronoDB) => new EmittableActivePairStore(chronoDB);
exports.getActivePairStore = getActivePairStore;
