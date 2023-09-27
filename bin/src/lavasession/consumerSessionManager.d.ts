import { ConsumerSessionsMap, ConsumerSessionsWithProvider, ProviderOptimizer, RPCEndpoint, SingleConsumerSession } from "./consumerTypes";
import { Relayer } from "../relayer/relayer";
import { grpc } from "@improbable-eng/grpc-web";
export declare const ALLOWED_PROBE_RETRIES = 3;
export declare const TIMEOUT_BETWEEN_PROBES: number;
import { ReportedProvider } from "../grpc_web_services/lavanet/lava/pairing/relay_pb";
export declare class ConsumerSessionManager {
    private rpcEndpoint;
    private pairing;
    private currentEpoch;
    private numberOfResets;
    private allowedUpdateForCurrentEpoch;
    private pairingAddresses;
    validAddresses: string[];
    private addonAddresses;
    private reportedProviders;
    private pairingPurge;
    private providerOptimizer;
    private relayer;
    private transport;
    private allowInsecureTransport;
    private epochTracker;
    constructor(relayer: Relayer, rpcEndpoint: RPCEndpoint, providerOptimizer: ProviderOptimizer, opts?: {
        transport?: grpc.TransportFactory;
        allowInsecureTransport?: boolean;
    });
    getEpochFromEpochTracker(): number;
    getRpcEndpoint(): RPCEndpoint;
    getCurrentEpoch(): number;
    getNumberOfResets(): number;
    getPairingAddressesLength(): number;
    updateAllProviders(epoch: number, pairingList: ConsumerSessionsWithProvider[]): Promise<Error | undefined>;
    removeAddonAddress(addon?: string, extensions?: string[]): void;
    calculateAddonValidAddresses(addon: string, extensions: string[]): string[];
    getSessions(cuNeededForSession: number, initUnwantedProviders: Set<string>, requestedBlock: number, addon: string, extensions: string[]): ConsumerSessionsMap | Error;
    onSessionUnused(consumerSession: SingleConsumerSession): Error | undefined;
    onSessionFailure(consumerSession: SingleConsumerSession, errorReceived?: Error | null): Error | undefined;
    onSessionDone(consumerSession: SingleConsumerSession, latestServicedBlock: number, specComputeUnits: number, currentLatency: number, expectedLatency: number, expectedBH: number, numOfProviders: number, providersCount: number, isHangingApi: boolean): Error | undefined;
    getReportedProviders(epoch: number): Array<ReportedProvider>;
    private blockProvider;
    private removeAddressFromValidAddresses;
    private getValidConsumerSessionsWithProvider;
    private setValidAddressesToDefaultValue;
    getValidAddresses(addon: string, extensions: string[]): string[];
    private getValidProviderAddress;
    private resetValidAddress;
    private cacheAddonAddresses;
    private validatePairingListNotEmpty;
    probeProviders(pairingList: ConsumerSessionsWithProvider[], epoch: number, retry?: number): Promise<any>;
    private getTransport;
    private timeoutBetweenProbes;
}
export declare type ConsumerSessionManagersMap = Map<string, ConsumerSessionManager[]>;
