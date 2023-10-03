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
exports.StateChainQuery = void 0;
const default_1 = require("../../config/default");
const lavaPairing_1 = require("../../util/lavaPairing");
const errors_1 = require("../errors");
const common_1 = require("../../util/common");
const query_pb_1 = require("../../grpc_web_services/lavanet/lava/pairing/query_pb");
const errors_2 = require("../errors");
const consumerTypes_1 = require("../../lavasession/consumerTypes");
const logger_1 = require("../../logger/logger");
const stake_entry_pb_1 = require("../../grpc_web_services/lavanet/lava/epochstorage/stake_entry_pb");
const endpoint_pb_1 = require("../../grpc_web_services/lavanet/lava/epochstorage/endpoint_pb");
class StateChainQuery {
    constructor(pairingListConfig, chainIDs, rpcConsumer, config, account, lavaSpec) {
        this.latestBlockNumber = 0;
        this.csp = [];
        logger_1.Logger.debug("Initialization of State Chain Query started");
        // Save arguments
        this.pairingListConfig = pairingListConfig;
        this.chainIDs = chainIDs;
        this.rpcConsumer = rpcConsumer;
        this.config = config;
        this.account = account;
        this.lavaSpec = lavaSpec;
        // Initialize pairing to an empty map
        this.pairing = new Map();
        logger_1.Logger.debug("Initialization of State Chain Query ended");
    }
    init() {
        return __awaiter(this, void 0, void 0, function* () {
            const pairing = yield this.fetchLavaProviders(this.pairingListConfig);
            this.csp = pairing.consumerSessionsWithProvider;
            // Save pairing response for chainID
            this.pairing.set("LAV1", {
                providers: pairing.stakeEntry,
                maxCu: 10000,
                currentEpoch: 0,
                spec: this.lavaSpec,
            });
        });
    }
    // fetchPairing fetches pairing for all chainIDs we support
    fetchPairing() {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            try {
                logger_1.Logger.debug("Fetching pairing started");
                // Save time till next epoch
                let timeLeftToNextPairing;
                const lavaPairing = this.getPairing("LAV1");
                // Reset pairing
                this.pairing = new Map();
                // Save lava pairing
                // as if we do not have lava in chainID it can fail updating list
                this.pairing.set("LAV1", lavaPairing);
                // Iterate over chain and construct pairing
                for (const chainID of this.chainIDs) {
                    const request = new query_pb_1.QueryGetPairingRequest();
                    request.setChainid(chainID);
                    request.setClient(this.account.address);
                    // Fetch pairing for specified chainID
                    const pairingResponse = yield this.getPairingFromChain(request);
                    // If pairing is undefined set to empty object
                    if (!pairingResponse) {
                        this.pairing.set(chainID, undefined);
                        continue;
                    }
                    const pairing = pairingResponse.getPairing();
                    if (!pairing) {
                        this.pairing.set(chainID, undefined);
                        continue;
                    }
                    const spec = pairingResponse.getSpec();
                    if (!spec) {
                        this.pairing.set(chainID, undefined);
                        continue;
                    }
                    const providers = pairing.getProvidersList();
                    timeLeftToNextPairing = pairing.getTimeLeftToNextPairing();
                    const currentEpoch = (_a = pairingResponse.getPairing()) === null || _a === void 0 ? void 0 : _a.getCurrentEpoch();
                    if (!currentEpoch) {
                        throw logger_1.Logger.fatal("Failed fetching current epoch from pairing request.");
                    }
                    // Save pairing response for chainID
                    this.pairing.set(chainID, {
                        providers: providers,
                        maxCu: pairingResponse.getMaxCu(),
                        currentEpoch: currentEpoch,
                        spec: spec,
                    });
                }
                // If timeLeftToNextPairing undefined return an error
                if (timeLeftToNextPairing == undefined) {
                    throw errors_1.StateTrackerErrors.errTimeTillNextEpochMissing;
                }
                logger_1.Logger.debug("Fetching pairing ended");
                // Return timeLeftToNextPairing
                return timeLeftToNextPairing;
            }
            catch (err) {
                throw err;
            }
        });
    }
    // getPairing return pairing list for specific chainID
    getPairing(chainID) {
        // Return pairing for the specific chainId from the map
        return this.pairing.get(chainID);
    }
    //fetchLavaProviders fetches lava providers from different sources
    fetchLavaProviders(pairingListConfig) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                logger_1.Logger.debug("Fetching lava providers started");
                // Else if pairingListConfig exists use it to fetch lava providers from local file
                if (pairingListConfig != "") {
                    const pairingList = yield this.fetchLocalLavaPairingList(pairingListConfig);
                    const providers = this.constructLavaPairing(pairingList);
                    // Construct lava providers from pairing list and return it
                    return providers;
                }
                // Fetch pairing from default lava pairing list
                const pairingList = yield this.fetchDefaultLavaPairingList();
                const providers = this.constructLavaPairing(pairingList);
                // Construct lava providers from pairing list and return it
                return providers;
            }
            catch (err) {
                throw err;
            }
        });
    }
    // getPairingFromChain fetch pairing response from lava providers
    getPairingFromChain(request) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                logger_1.Logger.debug("Get pairing for:" + request.getChainid() + " started");
                // Serialize request to binary format
                const requestData = request.serializeBinary();
                // Create hex from data
                const hexData = Buffer.from(requestData).toString("hex");
                // Init send relay options
                const sendRelayOptions = {
                    method: "abci_query",
                    params: ["/lavanet.lava.pairing.Query/SdkPairing", hexData, "0", false],
                };
                const response = yield this.rpcConsumer.sendRelay(sendRelayOptions);
                const reply = response.reply;
                if (reply == undefined) {
                    throw new Error("Reply undefined");
                }
                // Decode response
                const dec = new TextDecoder();
                const decodedResponse = dec.decode(reply.getData_asU8());
                // Parse response
                const jsonResponse = JSON.parse(decodedResponse);
                // If log is not empty
                // return an error
                if (jsonResponse.result.response.log != "") {
                    logger_1.Logger.error("Failed fetching pairing list for: ", request.getChainid());
                    throw new Error(jsonResponse.result.response.log);
                }
                const byteArrayResponse = (0, common_1.base64ToUint8Array)(jsonResponse.result.response.value);
                // Deserialize the Uint8Array to obtain the protobuf message
                const decodedResponse2 = query_pb_1.QuerySdkPairingResponse.deserializeBinary(byteArrayResponse);
                // If response undefined throw an error
                if (decodedResponse2.getPairing() == undefined) {
                    throw errors_2.ProvidersErrors.errProvidersNotFound;
                }
                logger_1.Logger.debug("Get pairing for:" + request.getChainid() + " ended");
                // Return decoded response
                return decodedResponse2;
            }
            catch (err) {
                // Console log the error
                logger_1.Logger.error(err);
                // Return empty object
                // We do not want to return error because it will stop the state tracker for other chains
                return undefined;
            }
        });
    }
    // fetchLocalLavaPairingList uses local pairingList.json file to load lava providers
    fetchLocalLavaPairingList(path) {
        return __awaiter(this, void 0, void 0, function* () {
            logger_1.Logger.debug("Fetch pairing list from local config");
            try {
                const data = yield (0, lavaPairing_1.fetchLavaPairing)(path);
                return this.validatePairingData(data);
            }
            catch (err) {
                logger_1.Logger.debug("Error happened in fetchLocalLavaPairingList", err);
                throw err;
            }
        });
    }
    // fetchLocalLavaPairingList fetch lava pairing from seed providers list
    fetchDefaultLavaPairingList() {
        return __awaiter(this, void 0, void 0, function* () {
            logger_1.Logger.debug("Fetch pairing list from seed providers in github");
            // Fetch lava providers from seed list
            const response = yield fetch(default_1.DEFAULT_LAVA_PAIRING_LIST);
            // Validate response
            if (!response.ok) {
                throw logger_1.Logger.fatal(`Unable to fetch pairing list: ${response.statusText}`);
            }
            try {
                // Parse response
                const data = yield response.json();
                return this.validatePairingData(data);
            }
            catch (error) {
                throw logger_1.Logger.fatal("Error happened in fetchDefaultLavaPairingList", error);
            }
        });
    }
    // constructLavaPairing constructs consumer session with provider list from pairing list
    constructLavaPairing(pairingList) {
        try {
            // Initialize ConsumerSessionWithProvider array
            const pairing = [];
            const pairingEndpoints = [];
            // Initialize ConsumerSessionWithProvider array
            const csmArr = [];
            for (const provider of pairingList) {
                const pairingEndpoint = new endpoint_pb_1.Endpoint();
                pairingEndpoint.setIpport(provider.rpcAddress);
                pairingEndpoint.setApiInterfacesList(["tendermintrpc"]);
                pairingEndpoint.setGeolocation(Number(this.config.geolocation));
                // Add newly created endpoint in the pairing endpoint list
                pairingEndpoints.push(pairingEndpoint);
                const endpoint = {
                    networkAddress: provider.rpcAddress,
                    enabled: true,
                    connectionRefusals: 0,
                    addons: new Set(),
                    extensions: new Set(),
                };
                // Create a new pairing object
                const newPairing = new consumerTypes_1.ConsumerSessionsWithProvider(provider.publicAddress, [endpoint], {}, 1000, 0);
                const stakeEntry = new stake_entry_pb_1.StakeEntry();
                stakeEntry.setEndpointsList([pairingEndpoint]);
                stakeEntry.setAddress(provider.publicAddress);
                pairing.push(stakeEntry);
                const randomSessionId = (0, common_1.generateRandomInt)();
                const singleConsumerSession = new consumerTypes_1.SingleConsumerSession(randomSessionId, newPairing, endpoint);
                newPairing.sessions[0] = singleConsumerSession;
                // Add newly created pairing in the pairing list
                csmArr.push(newPairing);
            }
            return {
                stakeEntry: pairing,
                consumerSessionsWithProvider: csmArr,
            };
        }
        catch (err) {
            throw err;
        }
    }
    // validatePairingData validates pairing data
    validatePairingData(data) {
        if (data[this.config.network] == undefined) {
            throw logger_1.Logger.fatal(`Unsupported network (${this.config.network}), supported networks: ${Object.keys(data)}`);
        }
        if (data[this.config.network][this.config.geolocation] == undefined) {
            throw logger_1.Logger.fatal(`Unsupported geolocation (${this.config.geolocation}) for network (${this.config.network}). Supported geolocations: ${Object.keys(data[this.config.network])}`);
        }
        return data[this.config.network][this.config.geolocation];
    }
}
exports.StateChainQuery = StateChainQuery;
