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
exports.ConsumerSessionManager = exports.TIMEOUT_BETWEEN_PROBES = exports.ALLOWED_PROBE_RETRIES = void 0;
const routerKey_1 = require("./routerKey");
const errors_1 = require("./errors");
const common_1 = require("./common");
const logger_1 = require("../logger/logger");
const browserAllowInsecure_1 = __importDefault(require("../util/browserAllowInsecure"));
const browser_1 = __importDefault(require("../util/browser"));
const time_1 = require("../util/time");
const common_2 = require("../util/common");
const providerEpochTracker_1 = require("./providerEpochTracker");
const base_chain_parser_1 = require("../chainlib/base_chain_parser");
exports.ALLOWED_PROBE_RETRIES = 3;
exports.TIMEOUT_BETWEEN_PROBES = (0, time_1.secondsToMillis)(1);
const reported_providers_1 = require("./reported_providers");
class ConsumerSessionManager {
    constructor(relayer, rpcEndpoint, providerOptimizer, opts) {
        var _a, _b;
        this.pairing = new Map();
        this.currentEpoch = 0;
        this.numberOfResets = 0;
        this.allowedUpdateForCurrentEpoch = true;
        this.pairingAddresses = new Map();
        this.validAddresses = [];
        this.addonAddresses = new Map();
        this.reportedProviders = new reported_providers_1.ReportedProviders();
        this.pairingPurge = new Map();
        this.allowInsecureTransport = false;
        this.epochTracker = new providerEpochTracker_1.ProviderEpochTracker();
        this.relayer = relayer;
        this.rpcEndpoint = rpcEndpoint;
        this.providerOptimizer = providerOptimizer;
        this.allowInsecureTransport = (_a = opts === null || opts === void 0 ? void 0 : opts.allowInsecureTransport) !== null && _a !== void 0 ? _a : false;
        this.transport = (_b = opts === null || opts === void 0 ? void 0 : opts.transport) !== null && _b !== void 0 ? _b : this.getTransport();
    }
    getEpochFromEpochTracker() {
        return this.epochTracker.getEpoch();
    }
    getRpcEndpoint() {
        return this.rpcEndpoint;
    }
    getCurrentEpoch() {
        return this.currentEpoch;
    }
    getNumberOfResets() {
        return this.numberOfResets;
    }
    getPairingAddressesLength() {
        return this.pairingAddresses.size;
    }
    updateAllProviders(epoch, pairingList) {
        return __awaiter(this, void 0, void 0, function* () {
            logger_1.Logger.info("updateAllProviders called. epoch:", epoch, "this.currentEpoch", this.currentEpoch, "Provider list length", pairingList.length, "Api Inteface", this.rpcEndpoint.apiInterface, this.rpcEndpoint.chainId);
            if (epoch <= this.currentEpoch) {
                const rpcEndpoint = this.getRpcEndpoint();
                // For LAVA's initialization, we need to allow the pairing to be updated twice
                // This condition permits the pairing to be overwritten just once for the same epoch
                // After this one-time allowance, any attempt to overwrite will result in an error
                if (epoch != 0) {
                    if (this.allowedUpdateForCurrentEpoch &&
                        epoch === this.currentEpoch &&
                        rpcEndpoint.chainId === "LAV1" &&
                        rpcEndpoint.apiInterface === base_chain_parser_1.APIInterfaceTendermintRPC) {
                        this.allowedUpdateForCurrentEpoch = false;
                    }
                    else {
                        logger_1.Logger.error(`trying to update provider list for older epoch ${JSON.stringify({
                            epoch,
                            currentEpoch: this.currentEpoch,
                        })}`);
                        return new Error("Trying to update provider list for older epoch");
                    }
                }
            }
            this.epochTracker.reset();
            this.currentEpoch = epoch;
            // reset states
            this.pairingAddresses.clear();
            this.reportedProviders.reset();
            this.numberOfResets = 0;
            this.removeAddonAddress();
            this.pairingPurge = this.pairing;
            this.pairing = new Map();
            pairingList.forEach((provider, idx) => {
                this.pairingAddresses.set(idx, provider.publicLavaAddress);
                this.pairing.set(provider.publicLavaAddress, provider);
            });
            this.setValidAddressesToDefaultValue();
            logger_1.Logger.debug(`updated providers ${JSON.stringify({
                epoch: this.currentEpoch,
                spec: this.rpcEndpoint.key(),
            })}`);
            try {
                yield this.probeProviders(pairingList, epoch);
            }
            catch (err) {
                // TODO see what we should to
                logger_1.Logger.error(err);
            }
        });
    }
    removeAddonAddress(addon = "", extensions = []) {
        if (addon === "" && (extensions === null || extensions === void 0 ? void 0 : extensions.length) === 0) {
            this.addonAddresses.clear();
            return;
        }
        const routerKey = (0, routerKey_1.newRouterKey)([...extensions, addon]);
        this.addonAddresses.set(routerKey, []);
    }
    calculateAddonValidAddresses(addon, extensions) {
        const supportingProviderAddresses = [];
        for (const address of this.validAddresses) {
            const provider = this.pairing.get(address);
            if ((provider === null || provider === void 0 ? void 0 : provider.isSupportingAddon(addon)) &&
                (provider === null || provider === void 0 ? void 0 : provider.isSupportingExtensions(extensions))) {
                supportingProviderAddresses.push(address);
            }
        }
        return supportingProviderAddresses;
    }
    getSessions(cuNeededForSession, initUnwantedProviders, requestedBlock, addon, extensions) {
        const numberOfResets = this.validatePairingListNotEmpty(addon, extensions);
        const tempIgnoredProviders = {
            providers: new Set(initUnwantedProviders),
            currentEpoch: this.currentEpoch,
        };
        let sessionWithProvidersMap = this.getValidConsumerSessionsWithProvider(tempIgnoredProviders, cuNeededForSession, requestedBlock, addon, extensions);
        if (sessionWithProvidersMap instanceof Error) {
            return sessionWithProvidersMap;
        }
        const wantedSessions = sessionWithProvidersMap.size;
        const sessions = new Map();
        while (true) {
            for (const sessionWithProviders of sessionWithProvidersMap) {
                const [providerAddress, sessionsWithProvider] = sessionWithProviders;
                const consumerSessionsWithProvider = sessionsWithProvider.sessionsWithProvider;
                let sessionEpoch = sessionsWithProvider.currentEpoch;
                const endpointConn = consumerSessionsWithProvider.fetchEndpointConnectionFromConsumerSessionWithProvider(this.transport);
                if (endpointConn.error) {
                    // if all provider endpoints are disabled, block and report provider
                    if (endpointConn.error instanceof errors_1.AllProviderEndpointsDisabledError) {
                        this.blockProvider(providerAddress, true, sessionEpoch, 0, 1); // endpoints are disabled
                    }
                    else {
                        // if any other error just throw it
                        throw endpointConn.error;
                    }
                    continue;
                }
                if (!endpointConn.connected) {
                    tempIgnoredProviders.providers.add(providerAddress);
                    continue;
                }
                const consumerSessionInstance = consumerSessionsWithProvider.getConsumerSessionInstanceFromEndpoint(endpointConn.endpoint, numberOfResets);
                if (consumerSessionInstance.error) {
                    const { error } = consumerSessionInstance;
                    if (error instanceof errors_1.MaximumNumberOfSessionsExceededError) {
                        tempIgnoredProviders.providers.add(providerAddress);
                    }
                    else if (error instanceof errors_1.MaximumNumberOfBlockListedSessionsError) {
                        this.blockProvider(providerAddress, false, sessionEpoch, 0, 0);
                    }
                    else {
                        throw error;
                    }
                    continue;
                }
                const { singleConsumerSession, pairingEpoch } = consumerSessionInstance;
                if (pairingEpoch !== sessionEpoch && pairingEpoch != 0) {
                    // if pairingEpoch == 0 its currently uninitialized so we keep the this.currentEpoch value
                    logger_1.Logger.error(`sessionEpoch and pairingEpoch mismatch sessionEpoch: ${sessionEpoch} pairingEpoch: ${pairingEpoch}`);
                    sessionEpoch = pairingEpoch;
                }
                const err = consumerSessionsWithProvider.addUsedComputeUnits(cuNeededForSession);
                if (err) {
                    logger_1.Logger.debug(`consumerSessionWithProvider.addUsedComputeUnits error: ${err.message}`);
                    tempIgnoredProviders.providers.add(providerAddress);
                    const unlockError = singleConsumerSession.tryUnlock();
                    if (unlockError) {
                        logger_1.Logger.error("unlock error", unlockError);
                        return unlockError;
                    }
                    continue;
                }
                singleConsumerSession.latestRelayCu = cuNeededForSession;
                singleConsumerSession.relayNum += common_1.RELAY_NUMBER_INCREMENT;
                logger_1.Logger.debug(`Consumer got session with provider: ${JSON.stringify({
                    providerAddress,
                    sessionEpoch,
                    cuSum: singleConsumerSession.cuSum,
                    relayNum: singleConsumerSession.relayNum,
                    sessionId: singleConsumerSession.sessionId,
                })}`);
                sessions.set(providerAddress, {
                    session: singleConsumerSession,
                    epoch: sessionEpoch,
                    reportedProviders: this.reportedProviders.GetReportedProviders(),
                });
                if (singleConsumerSession.relayNum > 1) {
                    singleConsumerSession.qoSInfo.lastExcellenceQoSReport =
                        this.providerOptimizer.getExcellenceQoSReportForProvider(providerAddress);
                }
                tempIgnoredProviders.providers.add(providerAddress);
                if (sessions.size === wantedSessions) {
                    logger_1.Logger.debug(`returning sessions: ${JSON.stringify(sessions.values())}`, sessions.size);
                    return sessions;
                }
            }
            sessionWithProvidersMap = this.getValidConsumerSessionsWithProvider(tempIgnoredProviders, cuNeededForSession, requestedBlock, addon, extensions);
            if (sessionWithProvidersMap instanceof Error && sessions.size !== 0) {
                return sessions;
            }
            if (sessionWithProvidersMap instanceof Error) {
                return sessionWithProvidersMap;
            }
        }
    }
    onSessionUnused(consumerSession) {
        const lockError = consumerSession.tryLock();
        if (!lockError) {
            return new Error("consumer session must be locked before accessing this method");
        }
        const cuToDecrease = consumerSession.latestRelayCu;
        consumerSession.latestRelayCu = 0;
        const parentConsumerSessionsWithProvider = consumerSession.client;
        const unlockError = consumerSession.tryUnlock();
        if (unlockError) {
            logger_1.Logger.error("unlock error", unlockError);
            return unlockError;
        }
        return parentConsumerSessionsWithProvider.decreaseUsedComputeUnits(cuToDecrease);
    }
    onSessionFailure(consumerSession, 
    // TODO: extract code from error
    errorReceived) {
        if (!consumerSession.isLocked()) {
            return new Error("Session is not locked");
        }
        if (consumerSession.blockListed) {
            return new errors_1.SessionIsAlreadyBlockListedError();
        }
        consumerSession.qoSInfo.totalRelays++;
        consumerSession.consecutiveNumberOfFailures++;
        let consumerSessionBlockListed = false;
        // TODO: verify if code == SessionOutOfSyncError.ABCICode() (from go)
        if (consumerSession.consecutiveNumberOfFailures >
            common_1.MAXIMUM_NUMBER_OF_FAILURES_ALLOWED_PER_CONSUMER_SESSION) {
            logger_1.Logger.debug(`Blocking consumer session id: ${consumerSession.sessionId}`);
            consumerSession.blockListed = true;
            consumerSessionBlockListed = true;
        }
        const cuToDecrease = consumerSession.latestRelayCu;
        this.providerOptimizer.appendRelayFailure(consumerSession.client.publicLavaAddress);
        consumerSession.latestRelayCu = 0;
        const parentConsumerSessionsWithProvider = consumerSession.client;
        const unlockError = consumerSession.tryUnlock();
        if (unlockError) {
            logger_1.Logger.error("unlock error", unlockError);
            return unlockError;
        }
        const error = parentConsumerSessionsWithProvider.decreaseUsedComputeUnits(cuToDecrease);
        if (error) {
            return error;
        }
        let blockProvider = false;
        let reportProvider = false;
        if (errorReceived instanceof errors_1.ReportAndBlockProviderError) {
            blockProvider = true;
            reportProvider = true;
        }
        else if (errorReceived instanceof errors_1.BlockProviderError) {
            blockProvider = true;
        }
        if (consumerSessionBlockListed &&
            parentConsumerSessionsWithProvider.usedComputeUnits === 0) {
            blockProvider = true;
            reportProvider = true;
        }
        if (blockProvider) {
            const { publicProviderAddress, pairingEpoch } = parentConsumerSessionsWithProvider.getPublicLavaAddressAndPairingEpoch();
            this.blockProvider(publicProviderAddress, reportProvider, pairingEpoch, 1, 0);
        }
    }
    onSessionDone(consumerSession, latestServicedBlock, specComputeUnits, currentLatency, expectedLatency, expectedBH, numOfProviders, providersCount, isHangingApi) {
        if (!consumerSession.isLocked()) {
            return new Error("Session is not locked");
        }
        consumerSession.cuSum += consumerSession.latestRelayCu;
        consumerSession.latestRelayCu = 0;
        consumerSession.consecutiveNumberOfFailures = 0;
        consumerSession.latestBlock = latestServicedBlock;
        consumerSession.calculateQoS(currentLatency, expectedLatency, expectedBH - latestServicedBlock, numOfProviders, providersCount);
        this.providerOptimizer.appendRelayData(consumerSession.client.publicLavaAddress, currentLatency, isHangingApi, specComputeUnits, latestServicedBlock);
        const unlockError = consumerSession.tryUnlock();
        if (unlockError) {
            logger_1.Logger.error("unlock error", unlockError);
            return unlockError;
        }
    }
    getReportedProviders(epoch) {
        if (epoch != this.currentEpoch) {
            return new Array();
        }
        // If the addedToPurgeAndReport is empty return empty string
        // because "[]" can not be parsed
        return this.reportedProviders.GetReportedProviders();
    }
    blockProvider(address, reportProvider, sessionEpoch, errors, disconnections) {
        if (sessionEpoch != this.currentEpoch) {
            return new errors_1.EpochMismatchError();
        }
        const error = this.removeAddressFromValidAddresses(address);
        if (error) {
            logger_1.Logger.error(`address ${address} was not found in valid addresses`);
        }
        if (reportProvider) {
            logger_1.Logger.info(`Reporting provider for unresponsiveness: ${address}`);
            this.reportedProviders.reportedProvider(address, errors, disconnections);
        }
    }
    removeAddressFromValidAddresses(address) {
        const idx = this.validAddresses.indexOf(address);
        if (idx === -1) {
            return new errors_1.AddressIndexWasNotFoundError();
        }
        this.validAddresses.splice(idx, 1);
        this.removeAddonAddress();
    }
    getValidConsumerSessionsWithProvider(ignoredProviders, cuNeededForSession, requestedBlock, addon, extensions) {
        logger_1.Logger.debug(`called getValidConsumerSessionsWithProvider ${JSON.stringify({
            ignoredProviders,
        })}`);
        if (ignoredProviders.currentEpoch < this.currentEpoch) {
            logger_1.Logger.debug(`ignoredP epoch is not current epoch, resetting ignoredProviders ${JSON.stringify({
                ignoredProvidersEpoch: ignoredProviders.currentEpoch,
                currentEpoch: this.currentEpoch,
            })}`);
            ignoredProviders.providers = new Set();
            ignoredProviders.currentEpoch = this.currentEpoch;
        }
        let providerAddresses = this.getValidProviderAddress(Array.from(ignoredProviders.providers), cuNeededForSession, requestedBlock, addon, extensions);
        if (providerAddresses instanceof Error) {
            logger_1.Logger.error(`could not get a provider addresses error: ${providerAddresses.message}`);
            return providerAddresses;
        }
        const wantedProviders = providerAddresses.length;
        const sessionsWithProvider = new Map();
        while (true) {
            for (const providerAddress of providerAddresses) {
                const consumerSessionsWithProvider = this.pairing.get(providerAddress);
                if (consumerSessionsWithProvider === undefined) {
                    logger_1.Logger.error(`invalid provider address returned from csm.getValidProviderAddresses ${JSON.stringify({
                        providerAddress,
                        allProviderAddresses: providerAddresses,
                        pairing: this.pairing,
                        currentEpoch: this.currentEpoch,
                        validAddresses: this.getValidAddresses(addon, extensions),
                        wantedProviderNumber: wantedProviders,
                    })}`);
                    throw new Error("Invalid provider address returned from csm.getValidProviderAddresses");
                }
                const err = consumerSessionsWithProvider.validateComputeUnits(cuNeededForSession);
                if (err) {
                    ignoredProviders.providers.add(providerAddress);
                    continue;
                }
                sessionsWithProvider.set(providerAddress, {
                    sessionsWithProvider: consumerSessionsWithProvider,
                    currentEpoch: this.currentEpoch,
                });
                ignoredProviders.providers.add(providerAddress);
                if (sessionsWithProvider.size === wantedProviders) {
                    return sessionsWithProvider;
                }
            }
            providerAddresses = this.getValidProviderAddress(Array.from(ignoredProviders.providers), cuNeededForSession, requestedBlock, addon, extensions);
            if (providerAddresses instanceof Error &&
                sessionsWithProvider.size !== 0) {
                return sessionsWithProvider;
            }
            if (providerAddresses instanceof Error) {
                logger_1.Logger.debug(`could not get a provider address ${providerAddresses.message}`);
                return providerAddresses;
            }
        }
    }
    setValidAddressesToDefaultValue(addon = "", extensions = []) {
        if (addon === "" && extensions.length === 0) {
            this.validAddresses = [];
            this.pairingAddresses.forEach((address) => {
                this.validAddresses.push(address);
            });
            return;
        }
        this.pairingAddresses.forEach((address) => {
            if (this.validAddresses.includes(address)) {
                return;
            }
            this.validAddresses.push(address);
        });
        this.removeAddonAddress(addon, extensions);
        const routerKey = (0, routerKey_1.newRouterKey)([...extensions, addon]);
        const addonAddresses = this.calculateAddonValidAddresses(addon, extensions);
        this.addonAddresses.set(routerKey, addonAddresses);
    }
    getValidAddresses(addon, extensions) {
        const routerKey = (0, routerKey_1.newRouterKey)([...extensions, addon]);
        const validAddresses = this.addonAddresses.get(routerKey);
        if (validAddresses === undefined || validAddresses.length === 0) {
            return this.calculateAddonValidAddresses(addon, extensions);
        }
        return validAddresses;
    }
    getValidProviderAddress(ignoredProviderList, cu, requestedBlock, addon, extensions) {
        const ignoredProvidersLength = Object.keys(ignoredProviderList).length;
        const validAddresses = this.getValidAddresses(addon, extensions);
        const validAddressesLength = validAddresses.length;
        const totalValidLength = validAddressesLength - ignoredProvidersLength;
        if (totalValidLength <= 0) {
            logger_1.Logger.debug(`pairing list empty ${JSON.stringify({
                providerList: validAddresses,
                ignoredProviderList,
            })}`);
            return new errors_1.PairingListEmptyError();
        }
        const providers = this.providerOptimizer.chooseProvider(validAddresses, ignoredProviderList, cu, requestedBlock, 0);
        logger_1.Logger.debug(`choosing provider ${JSON.stringify({
            validAddresses,
            ignoredProviderList,
            providers,
        })}`);
        if (providers.length === 0) {
            logger_1.Logger.debug(`No providers returned by the optimizer ${JSON.stringify({
                providerList: validAddresses,
                ignoredProviderList,
            })}`);
            return new errors_1.PairingListEmptyError();
        }
        return providers;
    }
    resetValidAddress(addon = "", extensions = []) {
        const validAddresses = this.getValidAddresses(addon, extensions);
        if (validAddresses.length === 0) {
            logger_1.Logger.warn("provider pairing list is empty, resetting state");
            this.setValidAddressesToDefaultValue(addon, extensions);
            this.numberOfResets++;
        }
        return this.numberOfResets;
    }
    cacheAddonAddresses(addon, extensions) {
        const routerKey = (0, routerKey_1.newRouterKey)([...extensions, addon]);
        let addonAddresses = this.addonAddresses.get(routerKey);
        if (!addonAddresses) {
            this.removeAddonAddress(addon, extensions);
            addonAddresses = this.calculateAddonValidAddresses(addon, extensions);
            this.addonAddresses.set(routerKey, addonAddresses);
        }
        return addonAddresses;
    }
    validatePairingListNotEmpty(addon, extensions) {
        const validAddresses = this.cacheAddonAddresses(addon, extensions);
        if (validAddresses.length === 0) {
            return this.resetValidAddress(addon, extensions);
        }
        return this.numberOfResets;
    }
    probeProviders(pairingList, epoch, retry = 0) {
        return __awaiter(this, void 0, void 0, function* () {
            if (retry != 0) {
                yield (0, common_2.sleep)(this.timeoutBetweenProbes());
                if (this.currentEpoch != epoch) {
                    // incase epoch has passed we no longer need to probe old providers
                    logger_1.Logger.info("during old probe providers epoch passed no need to query old providers.");
                    return;
                }
            }
            logger_1.Logger.debug(`providers probe initiated`);
            const promiseProbeArray = [];
            const retryProbing = [];
            for (const consumerSessionWithProvider of pairingList) {
                const startTime = performance.now();
                const guid = Math.floor(Math.random() * Number.MAX_SAFE_INTEGER);
                promiseProbeArray.push(this.relayer
                    .probeProvider(consumerSessionWithProvider.endpoints[0].networkAddress, this.getRpcEndpoint().apiInterface, guid, this.getRpcEndpoint().chainId)
                    .then((probeReply) => {
                    const endTime = performance.now();
                    const latency = endTime - startTime;
                    logger_1.Logger.debug("Provider: " +
                        consumerSessionWithProvider.publicLavaAddress +
                        " chainID: " +
                        this.getRpcEndpoint().chainId +
                        " latency: ", latency + " ms");
                    if (guid != probeReply.getGuid()) {
                        logger_1.Logger.error("Guid mismatch for probe request and response. requested: ", guid, "response:", probeReply.getGuid());
                    }
                    const lavaEpoch = probeReply.getLavaEpoch();
                    logger_1.Logger.debug(`Probing Result for provider ${consumerSessionWithProvider.publicLavaAddress}, Epoch: ${lavaEpoch}, Lava Block: ${probeReply.getLavaLatestBlock()}`);
                    this.epochTracker.setEpoch(consumerSessionWithProvider.publicLavaAddress, lavaEpoch);
                    // when epoch == 0 this is the initialization of the sdk. meaning we don't have information, we will take the median
                    // reported epoch from the providers probing and change the current epoch value as we probe more providers.
                    if (epoch == 0) {
                        this.currentEpoch = this.getEpochFromEpochTracker(); // setting the epoch for initialization.
                    }
                    consumerSessionWithProvider.setPairingEpoch(this.currentEpoch); // set the pairing epoch on the specific provider.
                })
                    .catch((e) => {
                    logger_1.Logger.warn("Failed fetching probe from provider", consumerSessionWithProvider.getPublicLavaAddressAndPairingEpoch(), "Error:", e);
                    retryProbing.push(consumerSessionWithProvider);
                }));
            }
            if (!retry) {
                for (let index = 0; index < pairingList.length; index++) {
                    yield Promise.race(promiseProbeArray);
                    const epochFromProviders = this.epochTracker.getEpoch();
                    if (epochFromProviders != -1) {
                        logger_1.Logger.debug(`providers probe done ${JSON.stringify({
                            endpoint: this.rpcEndpoint,
                            Epoch: epochFromProviders,
                            NumberOfProvidersProbedUntilFinishedInit: this.epochTracker.getProviderListSize(),
                        })}`);
                        break;
                    }
                }
            }
            else {
                yield Promise.allSettled(promiseProbeArray);
            }
            // stop if we have no more providers to probe or we hit limit
            if (retryProbing.length == 0 || retry >= exports.ALLOWED_PROBE_RETRIES) {
                return;
            }
            // launch retry probing on failed providers; this needs to run asynchronously without waiting!
            // Must NOT "await" this method.
            this.probeProviders(retryProbing, epoch, retry + 1);
        });
    }
    getTransport() {
        return this.allowInsecureTransport ? browserAllowInsecure_1.default : browser_1.default;
    }
    timeoutBetweenProbes() {
        return exports.TIMEOUT_BETWEEN_PROBES;
    }
}
exports.ConsumerSessionManager = ConsumerSessionManager;
