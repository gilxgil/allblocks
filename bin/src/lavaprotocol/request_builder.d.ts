import { RelayRequest, RelayPrivateData, RelayReply, ReportedProvider } from "../grpc_web_services/lavanet/lava/pairing/relay_pb";
import { SingleConsumerSession } from "../lavasession/consumerTypes";
export interface SendRelayData {
    connectionType: string;
    data: string;
    url: string;
    apiInterface: string;
    chainId: string;
    requestedBlock: number;
}
export declare function newRelayData(relayData: SendRelayData): RelayPrivateData;
export declare function constructRelayRequest(lavaChainID: string, chainID: string, relayData: RelayPrivateData, providerAddress: string, singleConsumerSession: SingleConsumerSession, epoch: number, reportedProviders: Array<ReportedProvider>): RelayRequest;
export declare function UpdateRequestedBlock(request: RelayPrivateData, response: RelayReply): void;
export declare function ReplaceRequestedBlock(requestedBlock: number, latestBlock: number): number;
export declare function IsFinalizedBlock(requestedBlock: number, latestBlock: number, finalizationCriteria: number): boolean;
export declare function verifyRelayReply(reply: RelayReply, relayRequest: RelayRequest, providerAddress: string): Error | undefined;
interface FinalizationData {
    finalizedBlocks: Map<number, string>;
    finalizationConflict: undefined;
}
export declare function verifyFinalizationData(reply: RelayReply, relayRequest: RelayRequest, providerAddr: string, consumerAddress: string, latestSessionBlock: number, blockDistanceForfinalization: number): FinalizationData | Error;
export {};
