"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportedProviders = void 0;
const relay_pb_1 = require("../grpc_web_services/lavanet/lava/pairing/relay_pb");
class ReportedProviders {
    constructor() {
        this.addedToPurgeAndReport = new Map(); // list of purged providers to report for QoS unavailability. (easier to search maps.)
    }
    reset() {
        this.addedToPurgeAndReport = new Map();
    }
    GetReportedProviders() {
        const reportedProviders = new Array(this.addedToPurgeAndReport.size // allocating space before inserting values has better performance.
        );
        let index = 0;
        for (const [provider, reportedProviderEntry,] of this.addedToPurgeAndReport.entries()) {
            const reportedProvider = new relay_pb_1.ReportedProvider();
            reportedProvider.setAddress(provider);
            reportedProvider.setDisconnections(reportedProviderEntry.disconnections);
            reportedProvider.setErrors(reportedProviderEntry.errors);
            reportedProvider.setTimestampS(reportedProviderEntry.addedTime);
            reportedProviders[index] = reportedProvider;
            index++;
        }
        return reportedProviders;
    }
    isReported(address) {
        const reportedProvider = this.addedToPurgeAndReport.get(address);
        if (reportedProvider == undefined) {
            return false;
        }
        return true;
    }
    reportedProvider(address, errors, disconnections) {
        let reportedProvider;
        const reportedProviderValue = this.addedToPurgeAndReport.get(address);
        if (reportedProviderValue == undefined) {
            reportedProvider = new ReportedProviderEntry();
            reportedProvider.addedTime = performance.now();
        }
        else {
            reportedProvider = reportedProviderValue;
        }
        reportedProvider.disconnections += disconnections;
        reportedProvider.errors += errors;
        this.addedToPurgeAndReport.set(address, reportedProvider);
    }
}
exports.ReportedProviders = ReportedProviders;
class ReportedProviderEntry {
    constructor() {
        this.disconnections = 0;
        this.errors = 0;
        this.addedTime = 0;
    }
}
