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
exports.PairingUpdater = void 0;
const logger_1 = require("../../logger/logger");
const consumerTypes_1 = require("../../lavasession/consumerTypes");
class PairingUpdater {
    // Constructor for Pairing Updater
    constructor(stateQuery, config) {
        logger_1.Logger.debug("Initialization of Pairing Updater started");
        // Save arguments
        this.stateQuery = stateQuery;
        this.consumerSessionManagerMap = new Map();
        this.config = config;
    }
    registerPairing(consumerSessionManager) {
        return __awaiter(this, void 0, void 0, function* () {
            const chainID = consumerSessionManager.getRpcEndpoint().chainId;
            const consumerSessionsManagersList = this.consumerSessionManagerMap.get(chainID);
            if (!consumerSessionsManagersList) {
                this.consumerSessionManagerMap.set(chainID, [consumerSessionManager]);
                return;
            }
            consumerSessionsManagersList.push(consumerSessionManager);
            this.consumerSessionManagerMap.set(chainID, consumerSessionsManagersList);
        });
    }
    // update updates pairing list on every consumer session manager
    update() {
        return __awaiter(this, void 0, void 0, function* () {
            logger_1.Logger.debug("Start updating consumer session managers");
            // Get all chainIDs from the map
            const chainIDs = Array.from(this.consumerSessionManagerMap.keys());
            for (const chainID of chainIDs) {
                const consumerSessionManagerList = this.consumerSessionManagerMap.get(chainID);
                if (consumerSessionManagerList == undefined) {
                    logger_1.Logger.debug("Consumer session manager udnefined: ", chainID);
                    continue;
                }
                logger_1.Logger.debug("Updating pairing list for: ", chainID);
                logger_1.Logger.debug("Number of CSM registered to this chainId: ", consumerSessionManagerList.length);
                // Fetch pairing list
                const pairing = this.stateQuery.getPairing(chainID);
                if (pairing == undefined) {
                    logger_1.Logger.debug("Failed fetching pairing list for: ", chainID);
                }
                else {
                    logger_1.Logger.debug("Pairing list fetched: ", pairing.currentEpoch, pairing.providers);
                }
                const promiseArray = [];
                // Update each consumer session manager with matching pairing list
                for (const consumerSessionManager of consumerSessionManagerList) {
                    promiseArray.push(this.updateConsumerSessionManager(pairing, consumerSessionManager));
                }
                yield Promise.allSettled(promiseArray);
            }
        });
    }
    // updateConsummerSessionManager filters pairing list and update consuemr session manager
    updateConsumerSessionManager(pairing, consumerSessionManager) {
        return __awaiter(this, void 0, void 0, function* () {
            // If pairing undefined return + error
            if (pairing == undefined) {
                logger_1.Logger.error("Pairing response is undefined");
                return;
            }
            // Filter pairing list for specific consumer session manager
            const pairingListForThisCSM = this.filterPairingListByEndpoint(pairing, consumerSessionManager.getRpcEndpoint().apiInterface);
            // Update specific consumer session manager
            yield consumerSessionManager.updateAllProviders(pairing.currentEpoch, pairingListForThisCSM);
            return;
        });
    }
    // filterPairingListByEndpoint filters pairing list and return only the once for rpcInterface
    filterPairingListByEndpoint(pairing, rpcInterface) {
        // Initialize ConsumerSessionWithProvider array
        const pairingForSameGeolocation = [];
        const pairingFromDifferentGeolocation = [];
        // Iterate over providers to populate pairing list
        for (const provider of pairing.providers) {
            logger_1.Logger.debug("parsing provider", provider);
            // Skip providers with no endpoints
            if (provider.getEndpointsList().length == 0) {
                continue;
            }
            // Initialize relevantEndpoints array
            const sameGeoEndpoints = [];
            const differntGeoEndpoints = [];
            // Only take into account endpoints that use the same api interface
            // And geolocation
            for (const endpoint of provider.getEndpointsList()) {
                if (!endpoint.getApiInterfacesList().includes(rpcInterface)) {
                    continue;
                }
                const consumerEndpoint = {
                    addons: new Set(endpoint.getAddonsList()),
                    extensions: new Set(endpoint.getExtensionsList()),
                    networkAddress: endpoint.getIpport(),
                    enabled: true,
                    connectionRefusals: 0,
                };
                if (endpoint.getGeolocation() == Number(this.config.geolocation)) {
                    sameGeoEndpoints.push(consumerEndpoint); // set same geo location provider endpoint
                }
                else {
                    differntGeoEndpoints.push(consumerEndpoint); // set different geo location provider endpoint
                }
            }
            // skip if we have no endpoints at all.
            if (sameGeoEndpoints.length == 0 && differntGeoEndpoints.length == 0) {
                logger_1.Logger.debug("No endpoints found");
                continue;
            }
            let sameGeoOptions = false; // if we have same geolocation options or not
            let endpointListToStore = differntGeoEndpoints;
            if (sameGeoEndpoints.length > 0) {
                sameGeoOptions = true;
                endpointListToStore = sameGeoEndpoints;
            }
            const newPairing = new consumerTypes_1.ConsumerSessionsWithProvider(provider.getAddress(), endpointListToStore, {}, pairing.maxCu, pairing.currentEpoch);
            // Add newly created pairing in the pairing list
            if (sameGeoOptions) {
                pairingForSameGeolocation.push(newPairing);
            }
            else {
                pairingFromDifferentGeolocation.push(newPairing);
            }
        }
        if (pairingForSameGeolocation.length == 0 &&
            pairingFromDifferentGeolocation.length == 0) {
            logger_1.Logger.debug("No relevant providers found");
        }
        logger_1.Logger.debug("providers initialized", "our geo", JSON.stringify(pairingForSameGeolocation), "other geo", JSON.stringify(pairingFromDifferentGeolocation));
        // Return providers list [pairingForSameGeolocation,pairingFromDifferentGeolocation]
        return pairingForSameGeolocation.concat(pairingFromDifferentGeolocation);
    }
}
exports.PairingUpdater = PairingUpdater;
