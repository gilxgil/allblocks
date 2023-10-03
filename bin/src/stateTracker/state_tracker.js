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
Object.defineProperty(exports, "__esModule", { value: true });
exports.StateTracker = void 0;
const state_chain_query_1 = require("./stateQuery/state_chain_query");
const state_badge_query_1 = require("./stateQuery/state_badge_query");
const logger_1 = require("../logger/logger");
const pairing_updater_1 = require("./updaters/pairing_updater");
const DEFAULT_RETRY_INTERVAL = 10000;
// we are adding 10% to the epoch passing time so we dont race providers updates.
// we have overlap protecting us.
const DEFAULT_TIME_BACKOFF = 1000 * 1.1; // MS * 10%
class StateTracker {
    // Constructor for State Tracker
    constructor(pairingListConfig, relayer, chainIDs, config, rpcConsumer, spec, account, walletAddress, badgeManager) {
        this.timeTillNextEpoch = 0;
        logger_1.Logger.debug("Initialization of State Tracker started");
        this.updaters = new Map();
        if (badgeManager && badgeManager.isActive()) {
            this.stateQuery = new state_badge_query_1.StateBadgeQuery(badgeManager, walletAddress, account, chainIDs, relayer);
        }
        else {
            // Initialize State Query
            if (!rpcConsumer) {
                throw logger_1.Logger.fatal("No rpc consumer server provided in private key flow.");
            }
            this.stateQuery = new state_chain_query_1.StateChainQuery(pairingListConfig, chainIDs, rpcConsumer, config, account, spec);
        }
        // Create Pairing Updater
        const pairingUpdater = new pairing_updater_1.PairingUpdater(this.stateQuery, config);
        // Register all updaters
        this.registerForUpdates(pairingUpdater, "pairingUpdater");
        logger_1.Logger.debug("Pairing updater added");
    }
    getPairingResponse(chainId) {
        return this.stateQuery.getPairing(chainId);
    }
    initialize() {
        return __awaiter(this, void 0, void 0, function* () {
            logger_1.Logger.debug("Initialization of State Tracker started");
            // Init state query
            yield this.stateQuery.init();
            // Run all updaters
            // Only for chain query
            if (this.stateQuery instanceof state_chain_query_1.StateChainQuery) {
                yield this.update();
            }
            // Fetch Pairing
            this.timeTillNextEpoch = yield this.stateQuery.fetchPairing();
        });
    }
    startTracking() {
        return __awaiter(this, void 0, void 0, function* () {
            logger_1.Logger.debug("State Tracker started");
            // update all consumer session managers with the provider lists after initialization.
            yield this.update();
            // Set up a timer to call this method again when the next epoch begins
            setTimeout(() => this.executeUpdateOnNewEpoch(), this.timeTillNextEpoch * DEFAULT_TIME_BACKOFF);
        });
    }
    // executeUpdateOnNewEpoch executes all updates on every new epoch
    executeUpdateOnNewEpoch() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                logger_1.Logger.debug("New epoch started, fetching pairing list");
                // Fetching all the info including the time_till_next_epoch
                const timeTillNextEpoch = yield this.stateQuery.fetchPairing();
                logger_1.Logger.debug("Pairing list fetched, started new epoch in: " + timeTillNextEpoch);
                yield this.update();
                // Set up a timer to call this method again when the next epoch begins
                setTimeout(() => this.executeUpdateOnNewEpoch(), timeTillNextEpoch * DEFAULT_TIME_BACKOFF // we are adding 10% to the timeout to make sure we don't race providers
                );
            }
            catch (error) {
                logger_1.Logger.error("An error occurred during pairing processing:", error);
                logger_1.Logger.debug("Retry fetching pairing list in: " + DEFAULT_RETRY_INTERVAL);
                // Retry fetching pairing list after DEFAULT_RETRY_INTERVAL
                setTimeout(() => this.executeUpdateOnNewEpoch(), DEFAULT_RETRY_INTERVAL);
            }
        });
    }
    RegisterConsumerSessionManagerForPairingUpdates(consumerSessionManager) {
        const pairingUpdater = this.updaters.get("pairingUpdater");
        if (!pairingUpdater) {
            throw new Error("Missing pairing updater");
        }
        if (!(pairingUpdater instanceof pairing_updater_1.PairingUpdater)) {
            throw new Error("Invalid updater type");
        }
        pairingUpdater.registerPairing(consumerSessionManager);
    }
    update() {
        return __awaiter(this, void 0, void 0, function* () {
            // Call update method on all registered updaters
            const promiseArray = [];
            for (const updater of this.updaters.values()) {
                promiseArray.push(updater.update());
            }
            yield Promise.allSettled(promiseArray);
        });
    }
    // registerForUpdates adds new updater
    registerForUpdates(updater, name) {
        this.updaters.set(name, updater);
    }
}
exports.StateTracker = StateTracker;
