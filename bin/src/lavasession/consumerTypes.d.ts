import { AlreadyLockedError, MaxComputeUnitsExceededError, NegativeComputeUnitsAmountError, NotLockedError } from "./errors";
import { RelayerClient } from "../grpc_web_services/lavanet/lava/pairing/relay_pb_service";
import { Result } from "./helpers";
import { grpc } from "@improbable-eng/grpc-web";
import { QualityOfServiceReport, ReportedProvider } from "../grpc_web_services/lavanet/lava/pairing/relay_pb";
export interface SessionInfo {
    session: SingleConsumerSession;
    epoch: number;
    reportedProviders: Array<ReportedProvider>;
}
export declare type ConsumerSessionsMap = Map<string, SessionInfo>;
export interface ProviderOptimizer {
    appendProbeRelayData(providerAddress: string, latency: number, success: boolean): void;
    appendRelayFailure(providerAddress: string): void;
    appendRelayData(providerAddress: string, latency: number, isHangingApi: boolean, cu: number, syncBlock: number): void;
    chooseProvider(allAddresses: string[], ignoredProviders: string[], cu: number, requestedBlock: number, perturbationPercentage: number): string[];
    getExcellenceQoSReportForProvider(providerAddress: string): QualityOfServiceReport;
}
export interface QoSReport {
    lastQoSReport?: QualityOfServiceReport;
    lastExcellenceQoSReport?: QualityOfServiceReport;
    latencyScoreList: string[];
    syncScoreSum: number;
    totalSyncScore: number;
    totalRelays: number;
    answeredRelays: number;
}
export declare function calculateAvailabilityScore(qosReport: QoSReport): {
    downtimePercentage: string;
    scaledAvailabilityScore: string;
};
export interface IgnoredProviders {
    providers: Set<string>;
    currentEpoch: number;
}
export declare class SingleConsumerSession {
    cuSum: number;
    latestRelayCu: number;
    qoSInfo: QoSReport;
    sessionId: number;
    client: ConsumerSessionsWithProvider;
    relayNum: number;
    latestBlock: number;
    endpoint: Endpoint;
    blockListed: boolean;
    consecutiveNumberOfFailures: number;
    private locked;
    constructor(sessionId: number, client: ConsumerSessionsWithProvider, endpoint: Endpoint);
    tryLock(): AlreadyLockedError | undefined;
    isLocked(): boolean;
    tryUnlock(): NotLockedError | undefined;
    calculateExpectedLatency(timeoutGivenToRelay: number): number;
    calculateQoS(latency: number, expectedLatency: number, blockHeightDiff: number, numOfProviders: number, servicersToCount: number): void;
    private calculateLatencyScore;
}
export interface Endpoint {
    networkAddress: string;
    enabled: boolean;
    client?: RelayerClient;
    connectionRefusals: number;
    addons: Set<string>;
    extensions: Set<string>;
}
export declare class RPCEndpoint {
    networkAddress: string;
    chainId: string;
    apiInterface: string;
    geolocation: string;
    constructor(address: string, chainId: string, apiInterface: string, geolocation: string);
    key(): string;
    string(): string;
}
export declare class ConsumerSessionsWithProvider {
    publicLavaAddress: string;
    endpoints: Endpoint[];
    sessions: Record<number, SingleConsumerSession>;
    maxComputeUnits: number;
    usedComputeUnits: number;
    private latestBlock;
    private pairingEpoch;
    private conflictFoundAndReported;
    constructor(publicLavaAddress: string, endpoints: Endpoint[], sessions: Record<number, SingleConsumerSession>, maxComputeUnits: number, pairingEpoch: number);
    getLatestBlock(): number;
    setLatestBlock(block: number): void;
    getPublicLavaAddressAndPairingEpoch(): {
        publicProviderAddress: string;
        pairingEpoch: number;
    };
    conflictAlreadyReported(): boolean;
    storeConflictReported(): void;
    isSupportingAddon(addon: string): boolean;
    isSupportingExtensions(extensions: string[]): boolean;
    getPairingEpoch(): number;
    setPairingEpoch(epoch: number): void;
    getConsumerSessionInstanceFromEndpoint(endpoint: Endpoint, numberOfResets: number): Result<{
        singleConsumerSession: SingleConsumerSession;
        pairingEpoch: number;
    }>;
    fetchEndpointConnectionFromConsumerSessionWithProvider(transport: grpc.TransportFactory): Result<{
        connected: boolean;
        endpoint: Endpoint;
        providerAddress: string;
    }>;
    calculatedExpectedLatency(timeoutGivenToRelay: number): number;
    validateComputeUnits(cuNeededForSession: number): MaxComputeUnitsExceededError | undefined;
    addUsedComputeUnits(cu: number): MaxComputeUnitsExceededError | undefined;
    decreaseUsedComputeUnits(cu: number): NegativeComputeUnitsAmountError | undefined;
}
export interface SessionsWithProvider {
    sessionsWithProvider: ConsumerSessionsWithProvider;
    currentEpoch: number;
}
export declare type SessionsWithProviderMap = Map<string, SessionsWithProvider>;
