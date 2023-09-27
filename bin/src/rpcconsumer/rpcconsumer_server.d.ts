import { Relayer } from "../relayer/relayer";
import { ConsumerSessionManager } from "../lavasession/consumerSessionManager";
import { SingleConsumerSession } from "../lavasession/consumerTypes";
import { BaseChainParser, SendRelayOptions, SendRestRelayOptions } from "../chainlib/base_chain_parser";
import { RPCEndpoint } from "../lavasession/consumerTypes";
import { RelayReply, RelayRequest } from "../grpc_web_services/lavanet/lava/pairing/relay_pb";
import { FinalizationConsensus } from "../lavaprotocol/finalization_consensus";
export declare class RPCConsumerServer {
    private consumerSessionManager;
    private chainParser;
    private geolocation;
    private relayer;
    private rpcEndpoint;
    private lavaChainId;
    private consumerAddress;
    private finalizationConsensus;
    constructor(relayer: Relayer, consumerSessionManager: ConsumerSessionManager, chainParser: BaseChainParser, geolocation: string, rpcEndpoint: RPCEndpoint, lavaChainId: string, finalizationConsensus: FinalizationConsensus);
    setChainParser(chainParser: BaseChainParser): void;
    supportedChainAndApiInterface(): SupportedChainAndApiInterface;
    sendRelay(options: SendRelayOptions | SendRestRelayOptions): Promise<RelayResult>;
    private sendRelayToProvider;
    protected relayInner(singleConsumerSession: SingleConsumerSession, relayResult: RelayResult, relayTimeout: number): Promise<RelayResponse>;
    protected sendRelayProviderInSession(singleConsumerSession: SingleConsumerSession, relayResult: RelayResult, relayTimeout: number): Promise<RelayResponse>;
}
interface RelayResult {
    request: RelayRequest | undefined;
    reply: RelayReply | undefined;
    providerAddress: string;
    finalized: boolean;
}
export interface RelayResponse {
    relayResult: RelayResult | undefined;
    latency: number;
    backoff: boolean;
    err: Error | undefined;
}
export interface SupportedChainAndApiInterface {
    specId: string;
    apiInterface: string;
}
export {};
