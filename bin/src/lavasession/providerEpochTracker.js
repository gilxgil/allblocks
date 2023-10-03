"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProviderEpochTracker = void 0;
const common_1 = require("../util/common");
class ProviderEpochTracker {
    constructor() {
        this.providersEpochs = new Map();
        this.epoch = 0;
    }
    reset() {
        this.providersEpochs = new Map();
    }
    hasEpochDataForProviderAddress(providersPublicAddress) {
        return this.providersEpochs.has(providersPublicAddress);
    }
    setEpoch(providersPublicAddress, epoch) {
        this.providersEpochs.set(providersPublicAddress, epoch);
        this.epoch = Math.floor((0, common_1.median)(Array.from(this.providersEpochs.values())));
    }
    getEpoch() {
        return this.epoch; // median epoch from all provider probes.
    }
    getProviderListSize() {
        return this.providersEpochs.size;
    }
}
exports.ProviderEpochTracker = ProviderEpochTracker;
