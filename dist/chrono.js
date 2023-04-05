"use strict";
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
exports.closeChronoDB = exports.getChronoDB = void 0;
const mkdirp_1 = require("mkdirp");
const chronodb_1 = require("./chronodb");
const prodPath = `${process.cwd()}/datastore/main`;
let chronoDB;
function getChronoDB(path = prodPath) {
    if (chronoDB === undefined) {
        mkdirp_1.default.sync(path);
        chronoDB = new chronodb_1.ChronoDB(path);
    }
    return chronoDB;
}
exports.getChronoDB = getChronoDB;
function closeChronoDB() {
    return __awaiter(this, void 0, void 0, function* () {
        if (chronoDB === undefined) {
            return;
        }
        yield chronoDB.close();
    });
}
exports.closeChronoDB = closeChronoDB;
