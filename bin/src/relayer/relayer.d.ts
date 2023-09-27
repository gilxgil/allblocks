import { grpc } from "@improbable-eng/grpc-web";
import { RelayRequest, RelayReply, RelaySession, RelayPrivateData, Badge, ProbeReply } from "../grpc_web_services/lavanet/lava/pairing/relay_pb";
import { RelayerClient } from "../grpc_web_services/lavanet/lava/pairing/relay_pb_service";
import { SingleConsumerSession } from "../lavasession/consumerTypes";
export interface RelayerOptions {
    privKey: string;
    secure: boolean;
    allowInsecureTransport: boolean;
    lavaChainId: string;
    transport?: grpc.TransportFactory;
}
export declare class Relayer {
    private privKey;
    private lavaChainId;
    private prefix;
    private allowInsecureTransport;
    private badge?;
    private transport;
    constructor(relayerOptions: RelayerOptions);
    setBadge(badge: Badge | undefined): void;
    probeProvider(providerAddress: string, apiInterface: string, guid: number, specId: string): Promise<ProbeReply>;
    sendRelay(client: RelayerClient, relayRequest: RelayRequest, timeout: number): Promise<RelayReply | Error>;
    constructAndSendRelay(options: SendRelayOptions, singleConsumerSession: SingleConsumerSession): Promise<RelayReply>;
    getTransport(): grpc.TransportFactory;
    getTransportWrapped(): {
        transport: grpc.TransportFactory;
    };
    extractErrorMessage(error: string): string;
    relayWithTimeout(timeLimit: number, task: any): Promise<any>;
    byteArrayToString: (byteArray: Uint8Array) => string;
    signRelay(request: RelaySession, privKey: string): Promise<Uint8Array>;
    calculateContentHashForRelayData(relayRequestData: RelayPrivateData): Uint8Array;
    convertRequestedBlockToUint8Array(requestBlock: number): Uint8Array;
    encodeUtf8(str: string): Uint8Array;
    concatUint8Arrays(arrays: Uint8Array[]): Uint8Array;
    prepareRequest(request: RelaySession): Uint8Array;
    SendRelayToAllProvidersAndRace(batch: BatchRelays[]): Promise<any>;
    getNewSalt(): Uint8Array;
    private generateRandomUint;
}
export interface BatchRelays {
    options: SendRelayOptions;
    singleConsumerSession: SingleConsumerSession;
}
/**
 * Options for send relay method.
 */
export interface SendRelayOptions {
    data: string;
    url: string;
    connectionType: string;
    apiInterface: string;
    chainId: string;
    publicProviderLavaAddress: string;
    epoch: number;
}
