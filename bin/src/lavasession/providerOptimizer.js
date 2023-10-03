"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RandomProviderOptimizer = void 0;
const arrays_1 = require("../util/arrays");
const logger_1 = require("../logger/logger");
class RandomProviderOptimizer {
    chooseProvider(allAddresses, ignoredProviders, cu, requestedBlock, perturbationPercentage) {
        const returnProviders = allAddresses
            .map((address) => {
            if (ignoredProviders.includes(address)) {
                return;
            }
            return address;
        })
            .filter(Boolean);
        const provider = (0, arrays_1.shuffleArray)(returnProviders)[0];
        return provider ? [provider] : [];
    }
    appendProbeRelayData(providerAddress, latency, success) {
        logger_1.Logger.warn("RandomProviderOptimizer.appendProbeRelayData() not implemented");
    }
    appendRelayData(providerAddress, latency, isHangingApi, cu, syncBlock) {
        return;
    }
    appendRelayFailure(providerAddress) {
        // Logger.warn("RandomProviderOptimizer.appendRelayFailure() not implemented");
        return;
    }
    calculateProbabilityOfTimeout(availabilityScoreStore) {
        logger_1.Logger.warn("RandomProviderOptimizer.calculateProbabilityOfTimeout() not implemented");
        return 0;
    }
    calculateProbabilityOfBlockError(requestedBlock, providerData) {
        logger_1.Logger.warn("RandomProviderOptimizer.calculateProbabilityOfBlockError() not implemented");
        return 0;
    }
    getExcellenceQoSReportForProvider(providerAddress) {
        logger_1.Logger.warn("RandomProviderOptimizer.getExcellenceQoSReportForProvider() not implemented");
        return;
    }
}
exports.RandomProviderOptimizer = RandomProviderOptimizer;
