import { BaseChainParser } from "../chainlib/base_chain_parser";
import { RelayReply, RelaySession } from "../grpc_web_services/lavanet/lava/pairing/relay_pb";
import { FinalizationConflict } from "../grpc_web_services/lavanet/lava/conflict/conflict_data_pb";
export declare function GetLatestFinalizedBlock(latestBlock: number, blockDistanceForFinalizedData: number): number;
export declare class FinalizationConsensus {
    private currentProviderHashesConsensus;
    private prevEpochProviderHashesConsensus;
    private currentEpoch;
    private latestBlock;
    constructor();
    private newProviderHashesConsensus;
    private insertProviderToConsensus;
    updateFinalizedHashes(blockDistanceForFinalizedData: number, providerAddress: string, finalizedBlocks: Map<number, string>, req: RelaySession, reply: RelayReply): FinalizationConflict | undefined;
    private discrepancyChecker;
    newEpoch(epoch: number): void;
    getLatestBlock(): number;
    getExpectedBlockHeight(chainParser: BaseChainParser): ExpectedBlockHeight;
}
interface ExpectedBlockHeight {
    expectedBlockHeight: number;
    numOfProviders: number;
}
export {};
