"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProvidersErrors = exports.StateTrackerErrors = void 0;
class StateTrackerErrors {
}
exports.StateTrackerErrors = StateTrackerErrors;
StateTrackerErrors.errTimeTillNextEpochMissing = new Error("Time till next epoch is missing");
class ProvidersErrors {
}
exports.ProvidersErrors = ProvidersErrors;
ProvidersErrors.errLavaProvidersNotInitialized = new Error("Lava providers not initialized");
ProvidersErrors.errProvidersNotFound = new Error("Providers not found");
ProvidersErrors.errProbeResponseUndefined = new Error("Probe response undefined");
