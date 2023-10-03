"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTimePerCu = exports.AverageWorldLatency = exports.MinimumTimePerRelayDelay = exports.TimePerCU = void 0;
exports.TimePerCU = 100; // ms
exports.MinimumTimePerRelayDelay = 1000; // ms
exports.AverageWorldLatency = 300; // ms
function getTimePerCu(computeUnits) {
    return localNodeTimePerCu(computeUnits) + exports.MinimumTimePerRelayDelay;
}
exports.getTimePerCu = getTimePerCu;
function localNodeTimePerCu(computeUnits) {
    return baseTimePerCU(computeUnits) + exports.AverageWorldLatency;
}
function baseTimePerCU(computeUnits) {
    return computeUnits * exports.TimePerCU;
}
