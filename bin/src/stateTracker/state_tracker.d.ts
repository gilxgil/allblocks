import { BadgeManager } from "../badge/badgeManager";
import { Relayer } from "../relayer/relayer";
import { AccountData } from "@cosmjs/proto-signing";
import { PairingResponse } from "../stateTracker/stateQuery/state_query";
import { ConsumerSessionManager } from "../lavasession/consumerSessionManager";
import { RPCConsumerServer } from "../rpcconsumer/rpcconsumer_server";
import { Spec } from "../grpc_web_services/lavanet/lava/spec/spec_pb";
export interface Config {
    geolocation: string;
    network: string;
}
export declare class StateTracker {
    private updaters;
    private stateQuery;
    private timeTillNextEpoch;
    constructor(pairingListConfig: string, relayer: Relayer, chainIDs: string[], config: Config, rpcConsumer: RPCConsumerServer | undefined, spec: Spec, account: AccountData, walletAddress: string, badgeManager?: BadgeManager);
    getPairingResponse(chainId: string): PairingResponse | undefined;
    initialize(): Promise<void>;
    startTracking(): Promise<void>;
    executeUpdateOnNewEpoch(): Promise<void>;
    RegisterConsumerSessionManagerForPairingUpdates(consumerSessionManager: ConsumerSessionManager): void;
    private update;
    private registerForUpdates;
}
