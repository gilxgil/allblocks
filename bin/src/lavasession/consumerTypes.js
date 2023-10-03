"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConsumerSessionsWithProvider = exports.RPCEndpoint = exports.SingleConsumerSession = exports.calculateAvailabilityScore = void 0;
const bignumber_js_1 = __importDefault(require("bignumber.js"));
const common_1 = require("./common");
const common_2 = require("../util/common");
const errors_1 = require("./errors");
const relay_pb_service_1 = require("../grpc_web_services/lavanet/lava/pairing/relay_pb_service");
const logger_1 = require("../logger/logger");
const relay_pb_1 = require("../grpc_web_services/lavanet/lava/pairing/relay_pb");
function calculateAvailabilityScore(qosReport) {
    const downtimePercentage = (0, bignumber_js_1.default)((qosReport.totalRelays - qosReport.answeredRelays) / qosReport.totalRelays);
    const scaledAvailabilityScore = (0, bignumber_js_1.default)(common_1.AVAILABILITY_PERCENTAGE)
        .minus(downtimePercentage)
        .div(common_1.AVAILABILITY_PERCENTAGE)
        .toPrecision();
    return {
        downtimePercentage: downtimePercentage.toPrecision(common_1.DEFAULT_DECIMAL_PRECISION),
        scaledAvailabilityScore: bignumber_js_1.default.max((0, bignumber_js_1.default)(0), scaledAvailabilityScore).toPrecision(common_1.DEFAULT_DECIMAL_PRECISION),
    };
}
exports.calculateAvailabilityScore = calculateAvailabilityScore;
class SingleConsumerSession {
    constructor(sessionId, client, endpoint) {
        this.cuSum = 0;
        this.latestRelayCu = 0;
        this.qoSInfo = {
            latencyScoreList: [],
            totalRelays: 0,
            answeredRelays: 0,
            syncScoreSum: 0,
            totalSyncScore: 0,
        };
        this.sessionId = 0;
        this.relayNum = 0;
        this.latestBlock = 0;
        this.endpoint = {
            networkAddress: "",
            enabled: false,
            connectionRefusals: 0,
            addons: new Set(),
            extensions: new Set(),
        };
        this.blockListed = false;
        this.consecutiveNumberOfFailures = 0;
        this.locked = false;
        this.sessionId = sessionId;
        this.client = client;
        this.endpoint = endpoint;
    }
    tryLock() {
        if (!this.locked) {
            this.locked = true;
            return;
        }
        return new errors_1.AlreadyLockedError();
    }
    isLocked() {
        return this.locked;
    }
    tryUnlock() {
        if (!this.locked) {
            return new errors_1.NotLockedError();
        }
        this.locked = false;
    }
    calculateExpectedLatency(timeoutGivenToRelay) {
        return timeoutGivenToRelay / 2;
    }
    calculateQoS(latency, expectedLatency, blockHeightDiff, numOfProviders, servicersToCount) {
        var _a;
        this.qoSInfo.totalRelays++;
        this.qoSInfo.answeredRelays++;
        if (!this.qoSInfo.lastQoSReport) {
            this.qoSInfo.lastQoSReport = new relay_pb_1.QualityOfServiceReport();
        }
        const { downtimePercentage, scaledAvailabilityScore } = calculateAvailabilityScore(this.qoSInfo);
        (_a = this.qoSInfo.lastQoSReport) === null || _a === void 0 ? void 0 : _a.setAvailability(scaledAvailabilityScore);
        if ((0, bignumber_js_1.default)(1).gt(this.qoSInfo.lastQoSReport.getAvailability())) {
            logger_1.Logger.info(`QoS availability report ${JSON.stringify({
                availability: this.qoSInfo.lastQoSReport.getAvailability(),
                downPercent: downtimePercentage,
            })}`);
        }
        const latencyScore = this.calculateLatencyScore(expectedLatency, latency);
        this.qoSInfo.latencyScoreList.push(latencyScore);
        this.qoSInfo.latencyScoreList = this.qoSInfo.latencyScoreList.sort();
        this.qoSInfo.lastQoSReport.setLatency(this.qoSInfo.latencyScoreList[
        // golang int casting just cuts the decimal part
        Math.floor(this.qoSInfo.latencyScoreList.length * common_1.PERCENTILE_TO_CALCULATE_LATENCY)]);
        const shouldCalculateSync = numOfProviders > Math.ceil(servicersToCount * common_1.MIN_PROVIDERS_FOR_SYNC);
        if (shouldCalculateSync) {
            if (blockHeightDiff <= 0) {
                this.qoSInfo.syncScoreSum++;
            }
            this.qoSInfo.totalSyncScore++;
            const sync = (0, bignumber_js_1.default)(this.qoSInfo.syncScoreSum).div(this.qoSInfo.totalSyncScore);
            this.qoSInfo.lastQoSReport.setSync(sync.toPrecision(common_1.DEFAULT_DECIMAL_PRECISION));
            if ((0, bignumber_js_1.default)(1).gt(sync)) {
                logger_1.Logger.debug(`QoS sync report ${JSON.stringify({
                    sync: this.qoSInfo.lastQoSReport.getSync(),
                    blockDiff: blockHeightDiff,
                    syncScore: `${this.qoSInfo.syncScoreSum}/${this.qoSInfo.totalSyncScore}`,
                    sessionId: this.sessionId,
                })}`);
            }
        }
        else {
            const sync = (0, bignumber_js_1.default)(1);
            this.qoSInfo.lastQoSReport.setSync(sync.toPrecision(common_1.DEFAULT_DECIMAL_PRECISION));
        }
        return;
    }
    calculateLatencyScore(expectedLatency, latency) {
        const oneDec = (0, bignumber_js_1.default)("1");
        const bigExpectedLatency = (0, bignumber_js_1.default)(expectedLatency);
        const bigLatency = (0, bignumber_js_1.default)(latency);
        return bignumber_js_1.default.min(oneDec, bigExpectedLatency)
            .div(bigLatency)
            .toPrecision(common_1.DEFAULT_DECIMAL_PRECISION);
    }
}
exports.SingleConsumerSession = SingleConsumerSession;
class RPCEndpoint {
    constructor(address, chainId, apiInterface, geolocation) {
        this.networkAddress = "";
        this.chainId = "";
        this.apiInterface = "";
        this.geolocation = "1";
        this.networkAddress = address;
        this.chainId = chainId;
        this.apiInterface = apiInterface;
        this.geolocation = geolocation;
    }
    key() {
        return this.chainId + this.apiInterface;
    }
    string() {
        return `${this.chainId}:${this.apiInterface} Network Address: ${this.networkAddress} Geolocation: ${this.geolocation}`;
    }
}
exports.RPCEndpoint = RPCEndpoint;
class ConsumerSessionsWithProvider {
    constructor(publicLavaAddress, endpoints, sessions, maxComputeUnits, pairingEpoch) {
        this.usedComputeUnits = 0;
        this.latestBlock = 0;
        this.conflictFoundAndReported = false; // 0 == not reported, 1 == reported
        this.publicLavaAddress = publicLavaAddress;
        this.endpoints = endpoints;
        this.sessions = sessions;
        this.maxComputeUnits = maxComputeUnits;
        this.pairingEpoch = pairingEpoch;
    }
    getLatestBlock() {
        return this.latestBlock;
    }
    setLatestBlock(block) {
        this.latestBlock = block;
    }
    getPublicLavaAddressAndPairingEpoch() {
        return {
            publicProviderAddress: this.publicLavaAddress,
            pairingEpoch: this.pairingEpoch,
        };
    }
    conflictAlreadyReported() {
        return this.conflictFoundAndReported;
    }
    storeConflictReported() {
        this.conflictFoundAndReported = true;
    }
    isSupportingAddon(addon) {
        if (addon === "") {
            return true;
        }
        for (const endpoint of this.endpoints) {
            if (endpoint.addons.has(addon)) {
                return true;
            }
        }
        return false;
    }
    isSupportingExtensions(extensions) {
        let includesAll = true;
        for (const endpoint of this.endpoints) {
            for (const extension of extensions) {
                includesAll = includesAll && endpoint.extensions.has(extension);
            }
        }
        return includesAll;
    }
    getPairingEpoch() {
        return this.pairingEpoch;
    }
    setPairingEpoch(epoch) {
        this.pairingEpoch = epoch;
    }
    getConsumerSessionInstanceFromEndpoint(endpoint, numberOfResets) {
        const maximumBlockSessionsAllowed = common_1.MAX_ALLOWED_BLOCK_LISTED_SESSION_PER_PROVIDER * (numberOfResets + 1);
        let numberOfBlockedSessions = 0;
        for (const session of Object.values(this.sessions)) {
            if (session.endpoint != endpoint) {
                continue;
            }
            if (numberOfBlockedSessions >= maximumBlockSessionsAllowed) {
                return {
                    pairingEpoch: 0,
                    error: new errors_1.MaximumNumberOfBlockListedSessionsError(),
                };
            }
            const lockError = session.tryLock();
            if (!lockError) {
                if (session.blockListed) {
                    numberOfBlockedSessions++;
                    const unlockError = session.tryUnlock();
                    if (unlockError) {
                        logger_1.Logger.error("failed to unlock session", unlockError);
                        return {
                            error: unlockError,
                        };
                    }
                    continue;
                }
                return {
                    singleConsumerSession: session,
                    pairingEpoch: this.pairingEpoch,
                };
            }
        }
        if (Object.keys(this.sessions).length > common_1.MAX_SESSIONS_ALLOWED_PER_PROVIDER) {
            throw new errors_1.MaximumNumberOfSessionsExceededError();
        }
        // TODO: change Math.random to something else
        const randomSessionId = (0, common_2.generateRandomInt)();
        const session = new SingleConsumerSession(randomSessionId, this, endpoint);
        const lockError = session.tryLock();
        if (lockError) {
            logger_1.Logger.error("failed to lock session", lockError);
            return {
                error: lockError,
            };
        }
        this.sessions[session.sessionId] = session;
        return {
            singleConsumerSession: session,
            pairingEpoch: this.pairingEpoch,
        };
    }
    fetchEndpointConnectionFromConsumerSessionWithProvider(transport) {
        for (const endpoint of this.endpoints) {
            if (endpoint.enabled) {
                endpoint.client = new relay_pb_service_1.RelayerClient("https://" + endpoint.networkAddress, {
                    transport,
                });
                this.endpoints.push(endpoint);
                return {
                    connected: true,
                    endpoint: endpoint,
                    providerAddress: this.publicLavaAddress,
                };
            }
        }
        logger_1.Logger.error(`purging provider after all endpoints are disabled ${JSON.stringify({
            providerEndpoints: this.endpoints,
            providerAddress: this.publicLavaAddress,
        })}`);
        return {
            connected: false,
            providerAddress: this.publicLavaAddress,
            error: new errors_1.AllProviderEndpointsDisabledError(),
        };
    }
    calculatedExpectedLatency(timeoutGivenToRelay) {
        return timeoutGivenToRelay / 2;
    }
    validateComputeUnits(cuNeededForSession) {
        if (this.usedComputeUnits + cuNeededForSession > this.maxComputeUnits) {
            logger_1.Logger.warn(`MaxComputeUnitsExceededError: ${this.publicLavaAddress} cu: ${this.usedComputeUnits} max: ${this.maxComputeUnits}`);
            return new errors_1.MaxComputeUnitsExceededError();
        }
    }
    addUsedComputeUnits(cu) {
        if (this.usedComputeUnits + cu > this.maxComputeUnits) {
            return new errors_1.MaxComputeUnitsExceededError();
        }
        this.usedComputeUnits += cu;
    }
    decreaseUsedComputeUnits(cu) {
        if (this.usedComputeUnits - cu < 0) {
            return new errors_1.NegativeComputeUnitsAmountError();
        }
        this.usedComputeUnits -= cu;
    }
}
exports.ConsumerSessionsWithProvider = ConsumerSessionsWithProvider;
