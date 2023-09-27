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
exports.StateBadgeQuery = void 0;
const errors_1 = require("../errors");
const logger_1 = require("../../logger/logger");
const badgeManager_1 = require("../../badge/badgeManager");
class StateBadgeQuery {
    constructor(badgeManager, walletAddress, account, chainIDs, relayer) {
        logger_1.Logger.debug("Initialization of State Badge Query started");
        // Save arguments
        this.badgeManager = badgeManager;
        this.walletAddress = walletAddress;
        this.chainIDs = chainIDs;
        this.relayer = relayer;
        this.account = account;
        // Initialize pairing to an empty map
        this.pairing = new Map();
        logger_1.Logger.debug("Initialization of State Badge Query ended");
    }
    // fetchPairing fetches pairing for all chainIDs we support
    fetchPairing() {
        return __awaiter(this, void 0, void 0, function* () {
            logger_1.Logger.debug("Fetching pairing started");
            let timeLeftToNextPairing;
            for (const chainID of this.chainIDs) {
                const badgeResponse = yield this.fetchNewBadge(chainID);
                if (badgeResponse == undefined) {
                    this.pairing.set(chainID, undefined);
                    continue;
                }
                const badge = badgeResponse.getBadge();
                if (badge == undefined) {
                    this.pairing.set(chainID, undefined);
                    continue;
                }
                this.relayer.setBadge(badge);
                this.account.address = badgeResponse.getBadgeSignerAddress();
                const pairingResponse = badgeResponse.getGetPairingResponse();
                const specResponse = badgeResponse.getSpec();
                if (pairingResponse == undefined || specResponse == undefined) {
                    this.pairing.set(chainID, undefined);
                    continue;
                }
                // Parse time till next epoch
                timeLeftToNextPairing = pairingResponse.getTimeLeftToNextPairing();
                // Generate StakeEntry
                const stakeEntry = pairingResponse.getProvidersList();
                // Save pairing response for chainID
                this.pairing.set(chainID, {
                    providers: stakeEntry,
                    maxCu: badge.getCuAllocation(),
                    currentEpoch: pairingResponse.getCurrentEpoch(),
                    spec: specResponse,
                });
            }
            // If timeLeftToNextPairing undefined return an error
            if (timeLeftToNextPairing == undefined) {
                throw errors_1.StateTrackerErrors.errTimeTillNextEpochMissing;
            }
            logger_1.Logger.debug("Fetching pairing ended");
            return timeLeftToNextPairing;
        });
    }
    init() {
        return __awaiter(this, void 0, void 0, function* () {
            return;
        });
    }
    // getPairing return pairing list for specific chainID
    getPairing(chainID) {
        // Return pairing for the specific chainId from the map
        return this.pairing.get(chainID);
    }
    fetchNewBadge(chainID) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (this.badgeManager == undefined) {
                    throw Error("Badge undefined");
                }
                const badgeResponse = yield this.badgeManager.fetchBadge(this.walletAddress, chainID);
                if (badgeResponse instanceof Error) {
                    throw badgeManager_1.TimoutFailureFetchingBadgeError;
                }
                return badgeResponse;
            }
            catch (err) {
                throw logger_1.Logger.fatal("Failed fetching badge", err);
            }
        });
    }
}
exports.StateBadgeQuery = StateBadgeQuery;
