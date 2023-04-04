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
const AppRoot_1 = require("./AppRoot");
const child_process_1 = require("child_process");
const container_config_1 = require("./container.config");
process.title = 'r2app';
const app = new AppRoot_1.default(container_config_1.default);
app.start();
function exit(code = 0) {
    (0, child_process_1.exec)(`pkill ${process.title}`);
    process.exit(code);
}
process.on('SIGINT', () => __awaiter(void 0, void 0, void 0, function* () {
    console.log('SIGINT received. Stopping...');
    yield app.stop();
    console.log('Stopped app.');
    exit();
}));
process.on('unhandledRejection', (reason, p) => __awaiter(void 0, void 0, void 0, function* () {
    console.error(reason);
    yield app.stop();
    console.log('Stopped app.');
    exit(1);
}));
