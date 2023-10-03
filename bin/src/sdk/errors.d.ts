declare class SDKErrors {
    static errAccountNotInitialized: Error;
    static errRelayerServiceNotInitialized: Error;
    static errLavaProvidersNotInitialized: Error;
    static errSessionNotInitialized: Error;
    static errMethodNotSupported: Error;
    static errChainIDUnsupported: Error;
    static errNetworkUnsupported: Error;
    static errRPCRelayMethodNotSupported: Error;
    static errPrivKeyAndBadgeNotInitialized: Error;
    static errPrivKeyAndBadgeBothInitialized: Error;
    static errRestRelayMethodNotSupported: Error;
    static sessionSyncLoss: Error;
    static relayTimeout: Error;
}
export default SDKErrors;
