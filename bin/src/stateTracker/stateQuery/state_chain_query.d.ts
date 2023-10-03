import { Config } from "../state_tracker";
import { PairingResponse } from "./state_query";
import { AccountData } from "@cosmjs/proto-signing";
import { RPCConsumerServer } from "../../rpcconsumer/rpcconsumer_server";
import { Spec } from "../../grpc_web_services/lavanet/lava/spec/spec_pb";
export declare class StateChainQuery {
    private pairingListConfig;
    private chainIDs;
    private rpcConsumer;
    private config;
    private pairing;
    private account;
    private latestBlockNumber;
    private lavaSpec;
    private csp;
    constructor(pairingListConfig: string, chainIDs: string[], rpcConsumer: RPCConsumerServer, config: Config, account: AccountData, lavaSpec: Spec);
    init(): Promise<void>;
    fetchPairing(): Promise<number>;
    getPairing(chainID: string): PairingResponse | undefined;
    private fetchLavaProviders;
    private getPairingFromChain;
    private fetchLocalLavaPairingList;
    private fetchDefaultLavaPairingList;
    private constructLavaPairing;
    private validatePairingData;
}
