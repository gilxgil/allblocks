"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const bignumber_js_1 = __importDefault(require("bignumber.js"));
const consumerTypes_1 = require("./consumerTypes");
const common_1 = require("./common");
const errors_1 = require("./errors");
describe("consumerTypes", () => {
    describe("SingleConsumerSession", () => {
        it("tests locking", () => {
            const session = new consumerTypes_1.SingleConsumerSession(42, new consumerTypes_1.ConsumerSessionsWithProvider("", [], {}, 0, 0), {
                networkAddress: "",
                enabled: true,
                extensions: new Set(),
                addons: new Set(),
                connectionRefusals: 0,
            });
            let lockError = session.tryLock();
            expect(lockError).toBeUndefined();
            lockError = session.tryLock();
            expect(lockError).toBeInstanceOf(errors_1.AlreadyLockedError);
        });
        it("tests unlocking", () => {
            const session = new consumerTypes_1.SingleConsumerSession(42, new consumerTypes_1.ConsumerSessionsWithProvider("", [], {}, 0, 0), {
                networkAddress: "",
                enabled: true,
                extensions: new Set(),
                addons: new Set(),
                connectionRefusals: 0,
            });
            session.tryLock();
            let unlockError = session.tryUnlock();
            expect(unlockError).toBeUndefined();
            unlockError = session.tryUnlock();
            expect(unlockError).toBeInstanceOf(errors_1.NotLockedError);
        });
    });
    it("should test calculate availability score", () => {
        const precision = 10000;
        let qosReport = {
            latencyScoreList: [],
            totalRelays: precision,
            answeredRelays: precision - common_1.AVAILABILITY_PERCENTAGE * precision,
            syncScoreSum: 0,
            totalSyncScore: 0,
        };
        let result = (0, consumerTypes_1.calculateAvailabilityScore)(qosReport);
        expect((0, bignumber_js_1.default)(result.downtimePercentage).toNumber()).toEqual(common_1.AVAILABILITY_PERCENTAGE);
        expect((0, bignumber_js_1.default)(result.scaledAvailabilityScore).toNumber()).toEqual(0);
        qosReport = {
            latencyScoreList: [],
            totalRelays: 2 * precision,
            answeredRelays: 2 * precision - common_1.AVAILABILITY_PERCENTAGE * precision,
            syncScoreSum: 0,
            totalSyncScore: 0,
        };
        const halfDec = (0, bignumber_js_1.default)("0.5");
        result = (0, consumerTypes_1.calculateAvailabilityScore)(qosReport);
        expect((0, bignumber_js_1.default)(result.downtimePercentage).toNumber() * 2).toEqual(common_1.AVAILABILITY_PERCENTAGE);
        expect(result.scaledAvailabilityScore).toEqual(halfDec.toPrecision(common_1.DEFAULT_DECIMAL_PRECISION));
    });
});
