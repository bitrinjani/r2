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
const AnalyticsService_1 = require("./AnalyticsService");
const logger_1 = require("@bitr/logger");
const log = (0, logger_1.getLogger)('analytics');
let analyticsService;
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            analyticsService = new AnalyticsService_1.default();
            yield analyticsService.start();
        }
        catch (ex) {
            log.error(`Analytics Service failed. ${ex.message}`);
            log.debug(ex.stack);
            analyticsService.stop();
        }
    });
}
main();
