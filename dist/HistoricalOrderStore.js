"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getHistoricalOrderStore = void 0;
const OrderImpl_1 = require("./OrderImpl");
const events_1 = require("events");
class EmittableHistoricalOrderStore extends events_1.EventEmitter {
    constructor(chronoDB) {
        super();
        this.timeSeries = chronoDB.getTimeSeries('HistoricalOrder', order => (0, OrderImpl_1.reviveOrder)(order));
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
const getHistoricalOrderStore = (chronoDB) => new EmittableHistoricalOrderStore(chronoDB);
exports.getHistoricalOrderStore = getHistoricalOrderStore;
