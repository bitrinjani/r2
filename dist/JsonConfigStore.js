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
const inversify_1 = require("inversify");
const configUtil_1 = require("./configUtil");
const ConfigValidator_1 = require("./ConfigValidator");
const timers_1 = require("timers");
const constants_1 = require("./constants");
const _ = require("lodash");
const fs = require("fs");
const util_1 = require("util");
const logger_1 = require("@bitr/logger");
const messages_1 = require("./messages");
const events_1 = require("events");
const writeFile = (0, util_1.promisify)(fs.writeFile);
let JsonConfigStore = class JsonConfigStore extends events_1.EventEmitter {
    constructor(configValidator) {
        super();
        this.configValidator = configValidator;
        this.log = (0, logger_1.getLogger)(this.constructor.name);
        this.TTL = 5 * 1000;
        this.responder = new messages_1.ConfigResponder(constants_1.configStoreSocketUrl, (request, respond) => this.requestHandler(request, respond));
    }
    get config() {
        if (this.cache) {
            return this.cache;
        }
        const config = (0, configUtil_1.getConfigRoot)();
        this.configValidator.validate(config);
        this.updateCache(config);
        return config;
    }
    set(config) {
        return __awaiter(this, void 0, void 0, function* () {
            this.configValidator.validate(config);
            yield writeFile((0, configUtil_1.getConfigPath)(), JSON.stringify(config, undefined, 2));
            this.updateCache(config);
        });
    }
    close() {
        this.responder.dispose();
    }
    requestHandler(request, respond) {
        return __awaiter(this, void 0, void 0, function* () {
            if (request === undefined) {
                this.log.debug(`Invalid message received.`);
                respond({ success: false, reason: 'invalid message' });
                return;
            }
            switch (request.type) {
                case 'set':
                    try {
                        const newConfig = request.data;
                        yield this.set(_.merge({}, (0, configUtil_1.getConfigRoot)(), newConfig));
                        respond({ success: true });
                        this.log.debug(`Config updated with ${JSON.stringify(newConfig)}`);
                    }
                    catch (ex) {
                        respond({ success: false, reason: 'invalid config' });
                        this.log.warn(`Failed to update config. Error: ${ex.message}`);
                        this.log.debug(ex.stack);
                    }
                    break;
                case 'get':
                    respond({ success: true, data: (0, configUtil_1.getConfigRoot)() });
                    break;
                default:
                    this.log.warn(`ConfigStore received an invalid message. Message: ${request}`);
                    respond({ success: false, reason: 'invalid message type' });
                    break;
            }
        });
    }
    updateCache(config) {
        this.cache = config;
        clearTimeout(this.timer);
        this.timer = (0, timers_1.setTimeout)(() => (this.cache = undefined), this.TTL);
        this.emit('configUpdated', config);
    }
}; /* istanbul ignore next */
JsonConfigStore = __decorate([
    (0, inversify_1.injectable)(),
    __metadata("design:paramtypes", [ConfigValidator_1.default])
], JsonConfigStore);
exports.default = JsonConfigStore;
