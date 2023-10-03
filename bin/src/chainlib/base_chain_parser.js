"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChainMessage = exports.BaseChainParser = exports.CollectionKeyToString = exports.ApiKeyToString = exports.HeadersPassSend = exports.APIInterfaceGrpc = exports.APIInterfaceRest = exports.APIInterfaceTendermintRPC = exports.APIInterfaceJsonRPC = void 0;
const api_collection_pb_1 = require("../grpc_web_services/lavanet/lava/spec/api_collection_pb");
const logger_1 = require("../logger/logger");
const long_1 = __importDefault(require("long"));
exports.APIInterfaceJsonRPC = "jsonrpc";
exports.APIInterfaceTendermintRPC = "tendermintrpc";
exports.APIInterfaceRest = "rest";
exports.APIInterfaceGrpc = "grpc";
exports.HeadersPassSend = api_collection_pb_1.Header.HeaderType.PASS_SEND;
function ApiKeyToString(key) {
    return JSON.stringify(key);
}
exports.ApiKeyToString = ApiKeyToString;
function CollectionKeyToString(key) {
    return `'{"addon":"${key.addon}","internalPath":"${key.internalPath}","connectionType":"${key.connectionType}"}'`;
}
exports.CollectionKeyToString = CollectionKeyToString;
function VerificationKeyToString(key) {
    return JSON.stringify(key);
}
class BaseChainParser {
    constructor() {
        // private extensionParser: ExtensionParser;
        this.apiInterface = "";
        this.taggedApis = new Map();
        this.serverApis = new Map();
        this.apiCollections = new Map();
        this.headers = new Map();
        this.allowedAddons = new Set();
        this.verifications = new Map();
    }
    getSupportedApi(name, connectionType) {
        const apiKey = {
            name,
            connectionType,
        };
        const apiCont = this.serverApis.get(ApiKeyToString(apiKey));
        if (!apiCont) {
            throw logger_1.Logger.fatal("api not supported", name, connectionType);
        }
        if (!apiCont.api.getEnabled()) {
            throw logger_1.Logger.fatal("api is disabled in spec", name, connectionType);
        }
        return apiCont;
    }
    getApiCollection(collectionKey) {
        const key = CollectionKeyToString(collectionKey);
        const collection = this.apiCollections.get(key);
        if (!collection) {
            throw logger_1.Logger.fatal("Api not supported", collectionKey);
        }
        if (!collection.getEnabled()) {
            throw logger_1.Logger.fatal("Api disabled in spec", collectionKey);
        }
        return collection;
    }
    dataReliabilityParams() {
        // TODO: implement this
        const spec = this.spec;
        if (spec == undefined) {
            throw new Error("spec undefined can't get stats");
        }
        return {
            enabled: spec.getDataReliabilityEnabled(),
            dataReliabilityThreshold: spec.getReliabilityThreshold(),
        };
    }
    // initialize the base chain parser with the spec information
    init(spec) {
        var _a, _b, _c, _d, _e, _f;
        if (this.apiInterface == "") {
            throw logger_1.Logger.fatal("Chain parser apiInterface is not set");
        }
        this.spec = spec;
        if (spec.getEnabled()) {
            for (const apiCollection of spec.getApiCollectionsList()) {
                if (!apiCollection.getEnabled()) {
                    continue;
                }
                if (((_a = apiCollection.getCollectionData()) === null || _a === void 0 ? void 0 : _a.getApiInterface()) !=
                    this.apiInterface) {
                    continue;
                }
                const connectionType = (_b = apiCollection.getCollectionData()) === null || _b === void 0 ? void 0 : _b.getType();
                if (connectionType == undefined) {
                    //TODO change message
                    throw logger_1.Logger.fatal("Missing verification parseDirective data in BaseChainParser constructor");
                }
                const internalPath = (_c = apiCollection
                    .getCollectionData()) === null || _c === void 0 ? void 0 : _c.getInternalPath();
                if (internalPath == undefined) {
                    //TODO change message
                    throw logger_1.Logger.fatal("Missing verification parseDirective data in BaseChainParser constructor");
                }
                const addon = (_d = apiCollection.getCollectionData()) === null || _d === void 0 ? void 0 : _d.getAddOn();
                if (addon == undefined) {
                    //TODO change message
                    throw logger_1.Logger.fatal("Missing verification parseDirective data in BaseChainParser constructor");
                }
                const collectionKey = {
                    addon: addon,
                    internalPath: internalPath,
                    connectionType: connectionType,
                };
                // parse directives
                for (const parsing of apiCollection.getParseDirectivesList()) {
                    this.taggedApis.set(parsing.getFunctionTag(), {
                        parsing: parsing,
                        apiCollection: apiCollection,
                    });
                }
                // parse api collection
                for (const api of apiCollection.getApisList()) {
                    if (!api.getEnabled()) {
                        continue;
                    }
                    let apiName = api.getName();
                    if (this.apiInterface == exports.APIInterfaceRest) {
                        const re = /{[^}]+}/;
                        apiName = api.getName().replace(re, "replace-me-with-regex");
                        apiName = apiName.replace(/replace-me-with-regex/g, "[^\\/\\s]+");
                        apiName = this.escapeRegExp(apiName); // Assuming you have a RegExp.escape function
                    }
                    const apiKey = {
                        name: apiName,
                        connectionType: collectionKey.connectionType,
                    };
                    this.serverApis.set(ApiKeyToString(apiKey), {
                        apiKey: apiKey,
                        api: api,
                        collectionKey: collectionKey,
                    });
                }
                // Parse headers
                for (const header of apiCollection.getHeadersList()) {
                    const apiKeyHeader = {
                        name: header.getName(),
                        connectionType: collectionKey.connectionType,
                    };
                    this.headers.set(ApiKeyToString(apiKeyHeader), {
                        header: header,
                        apiKey: apiKeyHeader,
                    });
                }
                for (const verification of apiCollection.getVerificationsList()) {
                    for (const parseValue of verification.getValuesList()) {
                        const addons = (_e = apiCollection.getCollectionData()) === null || _e === void 0 ? void 0 : _e.getAddOn();
                        if (addons == undefined) {
                            //TODO change message
                            throw logger_1.Logger.fatal("Missing verification parseDirective data in BaseChainParser constructor");
                        }
                        const value = parseValue.toObject();
                        const verificationKey = {
                            extension: value.extension,
                            addon: addons,
                        };
                        if (!verification.getParseDirective()) {
                            throw logger_1.Logger.fatal("Missing verification parseDirective data in BaseChainParser constructor", verification);
                        }
                        const connectionType = (_f = apiCollection.getCollectionData()) === null || _f === void 0 ? void 0 : _f.getType();
                        if (connectionType == undefined) {
                            throw logger_1.Logger.fatal("Missing verification parseDirective data in BaseChainParser constructor");
                        }
                        const parseDirective = verification.getParseDirective();
                        if (parseDirective == undefined) {
                            throw logger_1.Logger.fatal("Missing verification parseDirective data in BaseChainParser constructor");
                        }
                        const verificationContainer = {
                            connectionType: connectionType,
                            name: verification.getName(),
                            parseDirective: parseDirective,
                            value: parseValue.getExpectedValue(),
                            latestDistance: long_1.default.fromNumber(parseValue.getLatestDistance()),
                            verificationKey: verificationKey,
                        };
                        const vfkey = VerificationKeyToString(verificationKey);
                        const existingVerifications = this.verifications.get(vfkey);
                        if (!existingVerifications) {
                            this.verifications.set(vfkey, [verificationContainer]);
                        }
                        else {
                            existingVerifications.push(verificationContainer);
                        }
                    }
                }
                this.apiCollections.set(CollectionKeyToString(collectionKey), apiCollection);
            }
        }
    }
    isRest(options) {
        return "connectionType" in options; // how to check which options were given
    }
    handleHeaders(metadata, apiCollection, headersDirection) {
        var _a;
        if (!metadata || metadata.length == 0) {
            return {
                filteredHeaders: [],
                overwriteRequestedBlock: "",
                ignoredMetadata: [],
            };
        }
        const retMetaData = [];
        const ignoredMetadata = [];
        let overwriteRequestedBlock = "";
        for (const header of metadata) {
            const headerName = header.getName().toLowerCase();
            if (!apiCollection.getCollectionData()) {
                throw logger_1.Logger.fatal("Missing api collection data in handleHeaders", apiCollection);
            }
            const connectionType = (_a = apiCollection.getCollectionData()) === null || _a === void 0 ? void 0 : _a.getType();
            if (connectionType == undefined) {
                // TODO fix
                throw logger_1.Logger.fatal("Missing api collection data in handleHeaders", apiCollection);
            }
            const apiKey = {
                name: headerName,
                connectionType: connectionType,
            };
            const headerDirective = this.headers.get(ApiKeyToString(apiKey));
            if (!headerDirective) {
                continue; // this header is not handled
            }
            if (headerDirective.header.getKind() ==
                headersDirection ||
                headerDirective.header.getKind() == api_collection_pb_1.Header.HeaderType.PASS_BOTH) {
                retMetaData.push(header);
                if (headerDirective.header.getFunctionTag() ==
                    api_collection_pb_1.FUNCTION_TAG.SET_LATEST_IN_METADATA) {
                    overwriteRequestedBlock = header.getValue();
                }
            }
            else if (headerDirective.header.getKind() == api_collection_pb_1.Header.HeaderType.PASS_IGNORE) {
                ignoredMetadata.push(header);
            }
        }
        return {
            filteredHeaders: retMetaData,
            ignoredMetadata: ignoredMetadata,
            overwriteRequestedBlock: overwriteRequestedBlock,
        };
    }
    isAddon(addon) {
        return this.allowedAddons.has(addon);
    }
    escapeRegExp(s) {
        return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    }
    matchSpecApiByName(name, connectionType) {
        let foundNameOnDifferentConnectionType = undefined;
        for (const [, api] of this.serverApis.entries()) {
            const re = new RegExp(`^${api.apiKey.name}$`);
            if (re.test(name)) {
                if (api.apiKey.connectionType === connectionType) {
                    return [api, true];
                }
                else {
                    foundNameOnDifferentConnectionType = api.apiKey.connectionType;
                }
            }
        }
        if (foundNameOnDifferentConnectionType) {
            logger_1.Logger.warn(`Found the api on a different connection type, found: ${foundNameOnDifferentConnectionType}, requested: ${connectionType}`);
        }
        return [undefined, false];
    }
    chainBlockStats() {
        var _a, _b, _c, _d;
        const averageBlockTime = (_a = this.spec) === null || _a === void 0 ? void 0 : _a.getAverageBlockTime();
        if (!averageBlockTime) {
            throw logger_1.Logger.fatal("no average block time in spec", this.spec);
        }
        const allowedLag = (_b = this.spec) === null || _b === void 0 ? void 0 : _b.getAllowedBlockLagForQosSync();
        if (!allowedLag) {
            throw logger_1.Logger.fatal("no allowed lag in spec", this.spec);
        }
        const blockDistanceForFinalizedData = (_c = this.spec) === null || _c === void 0 ? void 0 : _c.getBlockDistanceForFinalizedData();
        if (blockDistanceForFinalizedData == undefined) {
            throw logger_1.Logger.fatal("no block distance for finalized data in spec", this.spec);
        }
        const blocksInFinalizationProof = (_d = this.spec) === null || _d === void 0 ? void 0 : _d.getBlocksInFinalizationProof();
        if (blocksInFinalizationProof == undefined) {
            throw logger_1.Logger.fatal("no block in finalization proof in spec", this.spec);
        }
        return {
            allowedBlockLagForQosSync: allowedLag,
            averageBlockTime: averageBlockTime,
            blockDistanceForFinalizedData: blockDistanceForFinalizedData,
            blocksInFinalizationProof: blocksInFinalizationProof,
        };
    }
}
exports.BaseChainParser = BaseChainParser;
class ChainMessage {
    constructor(requestedBlock, api, apiCollection, data, messageUrl) {
        this.headers = [];
        this.requestedBlock = requestedBlock;
        this.apiCollection = apiCollection;
        this.api = api;
        this.messageData = data;
        this.messageUrl = messageUrl;
    }
    getRawRequestData() {
        return { url: this.messageUrl, data: this.messageData };
    }
    getMessageUrl() {
        return this.messageUrl;
    }
    getRequestedBlock() {
        return this.requestedBlock;
    }
    updateLatestBlockInMessage(latestBlock, modififyContent) {
        return false; // TODO: implement
    }
    appendHeader(metaData) {
        this.headers = [...this.headers, ...metaData];
    }
    getApi() {
        return this.api;
    }
    getApiCollection() {
        return this.apiCollection;
    }
}
exports.ChainMessage = ChainMessage;
