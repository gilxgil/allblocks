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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BadgeManager = exports.TimoutFailureFetchingBadgeError = void 0;
const badges_pb_service_1 = require("../grpc_web_services/lavanet/lava/pairing/badges_pb_service");
const badges_pb_1 = require("../grpc_web_services/lavanet/lava/pairing/badges_pb");
const grpc_web_1 = require("@improbable-eng/grpc-web");
const browser_1 = __importDefault(require("../util/browser"));
const logger_1 = require("../logger/logger");
const BadBadgeUsageWhileNotActiveError = new Error("Bad BadgeManager usage detected, trying to use badge manager while not active");
exports.TimoutFailureFetchingBadgeError = new Error("Failed fetching badge, exceeded timeout duration");
class BadgeManager {
    constructor(options, transport) {
        this.badgeServerAddress = "";
        this.projectId = "";
        this.active = true;
        if (!options) {
            this.active = false;
            return;
        }
        this.badgeServerAddress = options.badgeServerAddress;
        this.projectId = options.projectId;
        this.authentication = new grpc_web_1.grpc.Metadata();
        if (options.authentication) {
            this.authentication.append("Authorization", options.authentication);
        }
        this.transport = transport;
        this.badgeGeneratorClient = new badges_pb_service_1.BadgeGeneratorClient(this.badgeServerAddress, this.getTransportWrapped());
    }
    isActive() {
        return this.active;
    }
    fetchBadge(badgeUser, specId) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.active) {
                throw BadBadgeUsageWhileNotActiveError;
            }
            const request = new badges_pb_1.GenerateBadgeRequest();
            request.setBadgeAddress(badgeUser);
            request.setProjectId(this.projectId);
            request.setSpecId(specId);
            const requestPromise = new Promise((resolve, reject) => {
                if (!this.badgeGeneratorClient || !this.authentication) {
                    // type fix with checks as they cant really be undefined.
                    throw BadBadgeUsageWhileNotActiveError;
                }
                this.badgeGeneratorClient.generateBadge(request, this.authentication, (err, result) => {
                    if (err != null) {
                        logger_1.Logger.error("failed fetching badge", err);
                        reject(err);
                    }
                    if (result != null) {
                        resolve(result);
                    }
                    reject(new Error("Didn't get an error nor result"));
                });
            });
            return this.relayWithTimeout(5000, requestPromise);
        });
    }
    getTransport() {
        if (this.transport) {
            return this.transport;
        }
        return browser_1.default;
    }
    getTransportWrapped() {
        return {
            // if allow insecure we use a transport with rejectUnauthorized disabled
            // otherwise normal transport (default to rejectUnauthorized = true));}
            transport: this.getTransport(),
        };
    }
    timeoutPromise(timeout) {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                reject(new Error("Timeout exceeded"));
            }, timeout);
        });
    }
    relayWithTimeout(timeLimit, task) {
        return __awaiter(this, void 0, void 0, function* () {
            const response = yield Promise.race([
                task,
                this.timeoutPromise(timeLimit),
            ]);
            return response;
        });
    }
}
exports.BadgeManager = BadgeManager;
