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
exports.LavaSDK = void 0;
const errors_1 = __importDefault(require("./errors"));
const relayer_1 = require("../relayer/relayer");
const badgeManager_1 = require("../badge/badgeManager");
const default_1 = require("../config/default");
const logger_1 = require("../logger/logger");
const wallet_1 = require("../wallet/wallet");
const state_tracker_1 = require("../stateTracker/state_tracker");
const rpcconsumer_server_1 = require("../rpcconsumer/rpcconsumer_server");
const consumerSessionManager_1 = require("../lavasession/consumerSessionManager");
const providerOptimizer_1 = require("../lavasession/providerOptimizer");
const consumerTypes_1 = require("../lavasession/consumerTypes");
const common_1 = require("../chainlib/common");
const base_chain_parser_1 = require("../chainlib/base_chain_parser");
const finalization_consensus_1 = require("../lavaprotocol/finalization_consensus");
const default_lava_spec_1 = require("../chainlib/default_lava_spec");
class LavaSDK {
    /**
     * Create Lava-SDK instance
     *
     * Use Lava-SDK for dAccess with a supported network. You can find a list of supported networks and their chain IDs at (url).
     *
     * @async
     * @param {LavaSDKOptions} options The options to use for initializing the LavaSDK.
     *
     * @returns A promise that resolves when the LavaSDK has been successfully initialized, returns LavaSDK object.
     */
    constructor(options) {
        // Extract attributes from options
        const { privateKey, badge, chainIds: chainIDRpcInterface, pairingListConfig, network, geolocation, lavaChainId, } = options;
        // Validate attributes
        if (!badge && !privateKey) {
            throw errors_1.default.errPrivKeyAndBadgeNotInitialized;
        }
        // Set log level
        logger_1.Logger.SetLogLevel(options.logLevel);
        // Init attributes
        this.secure = options.secure !== undefined ? options.secure : true;
        this.allowInsecureTransport = options.allowInsecureTransport
            ? options.allowInsecureTransport
            : false;
        if (typeof chainIDRpcInterface == "string") {
            this.chainIDRpcInterface = [chainIDRpcInterface];
        }
        else {
            this.chainIDRpcInterface = chainIDRpcInterface;
        }
        this.privKey = privateKey ? privateKey : "";
        this.walletAddress = "";
        this.badgeManager = new badgeManager_1.BadgeManager(badge);
        this.network = network || default_1.DEFAULT_LAVA_PAIRING_NETWORK;
        this.geolocation = geolocation || default_1.DEFAULT_GEOLOCATION;
        this.lavaChainId = lavaChainId || default_1.DEFAULT_LAVA_CHAINID;
        this.pairingListConfig = pairingListConfig || "";
        this.account = errors_1.default.errAccountNotInitialized;
        this.transport = options.transport;
        this.rpcConsumerServerRouter = new Map();
    }
    static create(options) {
        return __awaiter(this, void 0, void 0, function* () {
            const sdkInstance = new LavaSDK(options);
            yield sdkInstance.init();
            return sdkInstance;
        });
    }
    init() {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            // Init wallet
            // Check if badge is not specified or user specified a wallet to use with badge
            if (!this.badgeManager.isActive() || this.privKey != "") {
                const wallet = yield (0, wallet_1.createWallet)(this.privKey);
                this.account = yield wallet.getConsumerAccount();
            }
            else {
                const { wallet, privKey } = yield (0, wallet_1.createDynamicWallet)();
                this.privKey = privKey;
                this.walletAddress = (yield wallet.getConsumerAccount()).address;
                // We are updating this object when we fetch badge in state badge fetcher
                this.account = {
                    algo: "secp256k1",
                    address: "",
                    pubkey: new Uint8Array([]),
                };
            }
            this.relayer = new relayer_1.Relayer({
                privKey: this.privKey,
                lavaChainId: this.lavaChainId,
                secure: this.secure,
                allowInsecureTransport: this.allowInsecureTransport,
                transport: this.transport,
            });
            // Get default lava spec
            const spec = (0, default_lava_spec_1.getDefaultLavaSpec)();
            // create provider optimizer
            const optimizer = new providerOptimizer_1.RandomProviderOptimizer();
            let rpcConsumerServerLoL;
            let lavaTendermintRpcConsumerSessionManager;
            // if badge is not active set rpc consumer server for lava queries
            if (!this.badgeManager.isActive()) {
                const rpcEndpoint = new consumerTypes_1.RPCEndpoint("", // We do no need this in sdk as we are not opening any ports
                "LAV1", "tendermintrpc", this.geolocation // This is also deprecated
                );
                // create consumer session manager for lava tendermint
                lavaTendermintRpcConsumerSessionManager = new consumerSessionManager_1.ConsumerSessionManager(this.relayer, rpcEndpoint, optimizer, {
                    transport: this.transport,
                    allowInsecureTransport: this.allowInsecureTransport,
                });
                // Get chain parser for tendermintrpc
                const chainParse = (0, common_1.getChainParser)("tendermintrpc");
                // Init lava Spec
                chainParse.init(spec);
                const finalizationConsensus = new finalization_consensus_1.FinalizationConsensus();
                rpcConsumerServerLoL = new rpcconsumer_server_1.RPCConsumerServer(this.relayer, lavaTendermintRpcConsumerSessionManager, chainParse, this.geolocation, rpcEndpoint, this.lavaChainId, finalizationConsensus);
            }
            // Init state tracker
            const tracker = new state_tracker_1.StateTracker(this.pairingListConfig, this.relayer, this.chainIDRpcInterface, {
                geolocation: this.geolocation,
                network: this.network,
            }, rpcConsumerServerLoL, spec, this.account, this.walletAddress, this.badgeManager);
            // Register LAVATendermint csm for update
            // If badge does not exists
            if (!this.badgeManager.isActive()) {
                if (!lavaTendermintRpcConsumerSessionManager) {
                    throw logger_1.Logger.fatal("lavaTendermintRpcConsumerSessionManager is undefined in private key flow");
                }
                tracker.RegisterConsumerSessionManagerForPairingUpdates(lavaTendermintRpcConsumerSessionManager);
            }
            // Fetch init state query
            yield tracker.initialize();
            // init rpcconsumer servers
            for (const chainId of this.chainIDRpcInterface) {
                const pairingResponse = tracker.getPairingResponse(chainId);
                if (pairingResponse == undefined) {
                    logger_1.Logger.debug("No pairing list provided for chainID: ", chainId);
                    continue;
                }
                const spec = pairingResponse.spec;
                const apiCollectionList = spec.getApiCollectionsList();
                for (const apiCollection of apiCollectionList) {
                    // Get api interface
                    if (!apiCollection.getEnabled()) {
                        continue;
                    }
                    const apiInterface = (_a = apiCollection
                        .getCollectionData()) === null || _a === void 0 ? void 0 : _a.getApiInterface();
                    // Validate api interface
                    if (apiInterface == undefined) {
                        logger_1.Logger.debug("No api interface in spec: ", chainId);
                        continue;
                    }
                    if (apiInterface == "grpc") {
                        logger_1.Logger.debug("Skipping grpc for: ", chainId);
                        continue;
                    }
                    // in case we have rest - POST + rest - GET collections this will prevent us from adding the same chainId and apiInterface twice
                    if (!(this.getRpcConsumerServerRaw(chainId, apiInterface) instanceof Error)) {
                        continue;
                    }
                    // create chain parser
                    const chainParser = (0, common_1.getChainParser)(apiInterface);
                    chainParser.init(spec); // TODO: instead of init implement spec updater (update only when there was a spec change spec.getBlockLastUpdated())
                    // set the existing rpc consumer server from the initialization instead of creating a new one and continue
                    if (chainId == "LAV1" &&
                        apiInterface == "tendermintrpc" &&
                        rpcConsumerServerLoL) {
                        rpcConsumerServerLoL.setChainParser(chainParser);
                        this.rpcConsumerServerRouter.set(this.getRouterKey(chainId, apiInterface), rpcConsumerServerLoL);
                        continue;
                    }
                    // get rpc Endpoint
                    const rpcEndpoint = new consumerTypes_1.RPCEndpoint("", // We do no need this in sdk as we are not opening any ports
                    chainId, apiInterface, this.geolocation // This is also deprecated
                    );
                    // create consumer session manager
                    const csm = new consumerSessionManager_1.ConsumerSessionManager(this.relayer, rpcEndpoint, optimizer, {
                        transport: this.transport,
                        allowInsecureTransport: this.allowInsecureTransport,
                    });
                    tracker.RegisterConsumerSessionManagerForPairingUpdates(csm);
                    // create finalization consensus
                    const finalizationConsensus = new finalization_consensus_1.FinalizationConsensus();
                    // TODO: when this is supported
                    // tracker.RegisterFinalizationConsensusForUpdates(finalizationConsensus);
                    // create rpc consumer server
                    const rpcConsumerServer = new rpcconsumer_server_1.RPCConsumerServer(this.relayer, csm, chainParser, this.geolocation, rpcEndpoint, this.lavaChainId, finalizationConsensus);
                    // save rpc consumer server in map
                    this.rpcConsumerServerRouter.set(this.getRouterKey(chainId, apiInterface), rpcConsumerServer);
                }
            }
            yield tracker.startTracking();
        });
    }
    getRpcConsumerServer(options) {
        const routerMap = this.rpcConsumerServerRouter;
        const chainID = options.chainId;
        if (routerMap.size == 1 && chainID == undefined) {
            const firstEntry = routerMap.values().next();
            if (firstEntry.done) {
                return new Error("returned empty routerMap");
            }
            return firstEntry.value;
        }
        const isRest = this.isRest(options);
        if (chainID == undefined) {
            let specId = "";
            let apiInterface = "";
            for (const rpcConsumerServer of routerMap.values()) {
                const supported = rpcConsumerServer.supportedChainAndApiInterface();
                if (specId != "" && specId != supported.specId) {
                    return new Error("optional chainID argument must be specified when initializing the lavaSDK with multiple chains");
                }
                specId = supported.specId;
                if (isRest) {
                    apiInterface = base_chain_parser_1.APIInterfaceRest;
                    continue;
                }
                if (options.apiInterface == supported.apiInterface) {
                    apiInterface = supported.apiInterface;
                    break;
                }
                if (apiInterface != "" &&
                    apiInterface != supported.apiInterface &&
                    supported.apiInterface != base_chain_parser_1.APIInterfaceRest &&
                    apiInterface != base_chain_parser_1.APIInterfaceRest) {
                    return new Error("optional apiInterface argument must be specified when initializing the lavaSDK with a chain that has multiple apiInterfaces that support SendRelayOptions (tendermintrpc,jsonrpc)");
                }
                apiInterface = supported.apiInterface;
            }
            return this.getRpcConsumerServerRaw(specId, apiInterface);
        }
        else {
            if (isRest || options.apiInterface != undefined) {
                let apiInterface;
                if (isRest) {
                    apiInterface = base_chain_parser_1.APIInterfaceRest;
                }
                else if (options.apiInterface != undefined) {
                    apiInterface = options.apiInterface;
                }
                else {
                    return new Error("unreachable code");
                }
                return this.getRpcConsumerServerRaw(chainID, apiInterface);
            }
            else {
                // get here only if chainID is specified and apiInterface is not and it's not rest
                const jsonRpcConsumerServer = this.getRpcConsumerServerRaw(chainID, base_chain_parser_1.APIInterfaceJsonRPC);
                const tendermintRpcConsumerServer = this.getRpcConsumerServerRaw(chainID, base_chain_parser_1.APIInterfaceTendermintRPC);
                if (
                // check if it only has tendermintrpc
                jsonRpcConsumerServer instanceof Error &&
                    tendermintRpcConsumerServer instanceof rpcconsumer_server_1.RPCConsumerServer) {
                    return tendermintRpcConsumerServer;
                }
                else if (
                // check if it only has jsonrpc
                tendermintRpcConsumerServer instanceof Error &&
                    jsonRpcConsumerServer instanceof rpcconsumer_server_1.RPCConsumerServer) {
                    return jsonRpcConsumerServer;
                }
                return new Error("optional apiInterface argument must be specified when initializing the lavaSDK with a chain that has multiple apiInterfaces that support SendRelayOptions (tendermintrpc,jsonrpc)");
            }
        }
    }
    // the inner async function throws on relay error
    sendRelay(options) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const rpcConsumerServer = this.getRpcConsumerServer(options);
            if (rpcConsumerServer instanceof Error) {
                throw logger_1.Logger.fatal("Did not find relay receiver", rpcConsumerServer.message, "Check you initialized the chains properly", "Chain Requested", (_a = options === null || options === void 0 ? void 0 : options.chainId) !== null && _a !== void 0 ? _a : JSON.stringify(this.rpcConsumerServerRouter.keys()));
            }
            const relayResult = rpcConsumerServer.sendRelay(options);
            return yield relayResult.then((response) => {
                // // Decode response
                const reply = response.reply;
                if (reply == undefined) {
                    throw new Error("empty reply");
                }
                const dec = new TextDecoder();
                const decodedResponse = dec.decode(reply.getData_asU8());
                // Parse response
                const jsonResponse = JSON.parse(decodedResponse);
                // Return response
                return jsonResponse;
            });
        });
    }
    getRouterKey(chainId, apiInterface) {
        return chainId + "," + apiInterface;
    }
    isRest(options) {
        return "connectionType" in options; // how to check which options were given
    }
    getRpcConsumerServerRaw(chainID, apiInterface) {
        const routerMap = this.rpcConsumerServerRouter;
        const rpcConsumerServer = routerMap.get(this.getRouterKey(chainID, apiInterface));
        if (rpcConsumerServer == undefined) {
            return new Error("did not find rpcConsumerServer for " +
                this.getRouterKey(chainID, apiInterface));
        }
        return rpcConsumerServer;
    }
}
exports.LavaSDK = LavaSDK;
