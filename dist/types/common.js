"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrderStatus = exports.OrderType = exports.QuoteSide = exports.CashMarginType = exports.TimeInForce = exports.OrderSide = void 0;
var OrderSide;
(function (OrderSide) {
    OrderSide["Buy"] = "Buy";
    OrderSide["Sell"] = "Sell";
})(OrderSide = exports.OrderSide || (exports.OrderSide = {}));
var TimeInForce;
(function (TimeInForce) {
    TimeInForce["None"] = "None";
    TimeInForce["Day"] = "Day";
    TimeInForce["Gtc"] = "Gtc";
    TimeInForce["Ioc"] = "Ioc";
    TimeInForce["Fok"] = "Fok";
    TimeInForce["Gtd"] = "Gtd";
})(TimeInForce = exports.TimeInForce || (exports.TimeInForce = {}));
var CashMarginType;
(function (CashMarginType) {
    CashMarginType["Cash"] = "Cash";
    CashMarginType["MarginOpen"] = "MarginOpen";
    CashMarginType["NetOut"] = "NetOut";
})(CashMarginType = exports.CashMarginType || (exports.CashMarginType = {}));
var QuoteSide;
(function (QuoteSide) {
    QuoteSide["Ask"] = "Ask";
    QuoteSide["Bid"] = "Bid";
})(QuoteSide = exports.QuoteSide || (exports.QuoteSide = {}));
var OrderType;
(function (OrderType) {
    OrderType["Market"] = "Market";
    OrderType["Limit"] = "Limit";
    OrderType["Stop"] = "Stop";
    OrderType["StopLimit"] = "StopLimit";
})(OrderType = exports.OrderType || (exports.OrderType = {}));
var OrderStatus;
(function (OrderStatus) {
    OrderStatus["New"] = "New";
    OrderStatus["PartiallyFilled"] = "PartiallyFilled";
    OrderStatus["Filled"] = "Filled";
    OrderStatus["Canceled"] = "Canceled";
    OrderStatus["PendingCancel"] = "PendingCancel";
    OrderStatus["PendingAmend"] = "PendingAmend";
    OrderStatus["PendingNew"] = "PendingNew";
    OrderStatus["Rejected"] = "Rejected";
    OrderStatus["Expired"] = "Expired";
})(OrderStatus = exports.OrderStatus || (exports.OrderStatus = {}));
