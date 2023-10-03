import { ParseDirective, ApiCollection, Api, Header } from "../grpc_web_services/lavanet/lava/spec/api_collection_pb";
import { Metadata } from "../grpc_web_services/lavanet/lava/pairing/relay_pb";
import { Spec } from "../grpc_web_services/lavanet/lava/spec/spec_pb";
import Long from "long";
export declare const APIInterfaceJsonRPC = "jsonrpc";
export declare const APIInterfaceTendermintRPC = "tendermintrpc";
export declare const APIInterfaceRest = "rest";
export declare const APIInterfaceGrpc = "grpc";
export declare const HeadersPassSend: 0;
/**
 * Options for sending RPC relay.
 */
export interface SendRelayOptions {
    method: string;
    params: Array<any>;
    chainId?: string;
    metadata?: Metadata[];
    apiInterface?: string;
}
/**
 * Options for sending Rest relay.
 */
export interface SendRestRelayOptions {
    connectionType: string;
    url: string;
    data?: Record<string, any>;
    chainId?: string;
    metadata?: Metadata[];
}
export interface ApiKey {
    name: string;
    connectionType: string;
}
export declare type ApiKeyString = string;
export declare function ApiKeyToString(key: ApiKey): ApiKeyString;
interface TaggedContainer {
    parsing: ParseDirective;
    apiCollection: ApiCollection;
}
export interface CollectionKey {
    connectionType: string;
    internalPath: string;
    addon: string;
}
export declare type CollectionKeyString = string;
export declare function CollectionKeyToString(key: CollectionKey): CollectionKeyString;
interface ApiContainer {
    api: Api;
    collectionKey: CollectionKey;
    apiKey: ApiKey;
}
interface HeaderContainer {
    header: Header;
    apiKey: ApiKey;
}
interface VerificationKey {
    extension: string;
    addon: string;
}
interface VerificationContainer {
    connectionType: string;
    name: string;
    parseDirective: ParseDirective;
    value: string;
    latestDistance: Long;
    verificationKey: VerificationKey;
}
declare type VerificationKeyString = string;
interface HeadersHandler {
    filteredHeaders: Metadata[];
    overwriteRequestedBlock: string;
    ignoredMetadata: Metadata[];
}
export interface ChainBlockStats {
    allowedBlockLagForQosSync: number;
    averageBlockTime: number;
    blockDistanceForFinalizedData: number;
    blocksInFinalizationProof: number;
}
interface DataReliabilityParams {
    enabled: boolean;
    dataReliabilityThreshold: number;
}
export declare abstract class BaseChainParser {
    protected taggedApis: Map<number, TaggedContainer>;
    protected spec: Spec | undefined;
    protected serverApis: Map<ApiKeyString, ApiContainer>;
    protected headers: Map<ApiKeyString, HeaderContainer>;
    protected apiCollections: Map<CollectionKeyString, ApiCollection>;
    protected allowedAddons: Set<string>;
    apiInterface: string;
    protected verifications: Map<VerificationKeyString, VerificationContainer[]>;
    constructor();
    protected getSupportedApi(name: string, connectionType: string): ApiContainer;
    protected getApiCollection(collectionKey: CollectionKey): ApiCollection;
    dataReliabilityParams(): DataReliabilityParams;
    init(spec: Spec): void;
    protected isRest(options: SendRelayOptions | SendRestRelayOptions): options is SendRestRelayOptions;
    protected handleHeaders(metadata: Metadata[] | undefined, apiCollection: ApiCollection, headersDirection: number): HeadersHandler;
    protected isAddon(addon: string): boolean;
    protected escapeRegExp(s: string): string;
    protected matchSpecApiByName(name: string, connectionType: string): [ApiContainer | undefined, boolean];
    abstract parseMsg(options: SendRelayOptions | SendRestRelayOptions): ChainMessage;
    chainBlockStats(): ChainBlockStats;
}
export interface RawRequestData {
    url: string;
    data: string;
}
export declare class ChainMessage {
    private requestedBlock;
    private api;
    private apiCollection;
    private messageData;
    private messageUrl;
    headers: Metadata[];
    constructor(requestedBlock: number, api: Api, apiCollection: ApiCollection, data: string, messageUrl: string);
    getRawRequestData(): RawRequestData;
    getMessageUrl(): string;
    getRequestedBlock(): number;
    updateLatestBlockInMessage(latestBlock: number, modififyContent: boolean): boolean;
    appendHeader(metaData: Metadata[]): void;
    getApi(): Api;
    getApiCollection(): ApiCollection;
}
export {};
