import { BadgeOptions } from "../badge/badgeManager";
import { LogLevel } from "../logger/logger";
import { RPCConsumerServer } from "../rpcconsumer/rpcconsumer_server";
import { SendRelayOptions, SendRestRelayOptions } from "../chainlib/base_chain_parser";
export declare type ChainIDsToInit = string | string[];
declare type RelayReceiver = string;
/**
 * Options for initializing the LavaSDK.
 */
export interface LavaSDKOptions {
    privateKey?: string;
    badge?: BadgeOptions;
    chainIds: ChainIDsToInit;
    pairingListConfig?: string;
    network?: string;
    geolocation?: string;
    lavaChainId?: string;
    secure?: boolean;
    allowInsecureTransport?: boolean;
    logLevel?: string | LogLevel;
    transport?: any;
}
export declare class LavaSDK {
    private privKey;
    private walletAddress;
    private network;
    private pairingListConfig;
    private geolocation;
    private lavaChainId;
    private badgeManager;
    private account;
    private secure;
    private allowInsecureTransport;
    private chainIDRpcInterface;
    private transport;
    private rpcConsumerServerRouter;
    private relayer?;
    /**
     * Create Lava-SDK instance
     *
     * Use Lava-SDK for dAccess with a supported network. You can find a list of supported networks and their chain IDs at (url).
     *
     * @async
     * @param {LavaSDKOptions} options The options to use for initializing the LavaSDK.
     *
     * @returns A promise that resolves when the LavaSDK has been successfully initialized, returns LavaSDK object.
     */
    constructor(options: LavaSDKOptions);
    static create(options: LavaSDKOptions): Promise<LavaSDK>;
    init(): Promise<void>;
    getRpcConsumerServer(options: SendRelayOptions | SendRestRelayOptions): RPCConsumerServer | Error;
    sendRelay(options: SendRelayOptions | SendRestRelayOptions): Promise<any>;
    protected getRouterKey(chainId: string, apiInterface: string): RelayReceiver;
    protected isRest(options: SendRelayOptions | SendRestRelayOptions): options is SendRestRelayOptions;
    private getRpcConsumerServerRaw;
}
export { SendRelayOptions, SendRestRelayOptions };
