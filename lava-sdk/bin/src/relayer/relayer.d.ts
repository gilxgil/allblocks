import { ConsumerSessionWithProvider } from "../types/types";
import { RelayReply, RelaySession, RelayPrivateData } from "../grpc_web_services/lava/pairing/relay_pb";
import { Badge } from "../grpc_web_services/lava/pairing/relay_pb";
declare class Relayer {
    private chainID;
    private privKey;
    private lavaChainId;
    private prefix;
    private allowInsecureTransport;
    private badge?;
    constructor(chainID: string, privKey: string, lavaChainId: string, secure: boolean, allowInsecureTransport?: boolean, badge?: Badge);
    setBadge(badge: Badge | undefined): void;
    sendRelay(options: SendRelayOptions, consumerProviderSession: ConsumerSessionWithProvider, cuSum: number, apiInterface: string): Promise<RelayReply>;
    extractErrorMessage(error: string): string;
    relayWithTimeout(timeLimit: number, task: any): Promise<any>;
    byteArrayToString: (byteArray: Uint8Array) => string;
    signRelay(request: RelaySession, privKey: string): Promise<Uint8Array>;
    calculateContentHashForRelayData(relayRequestData: RelayPrivateData): Uint8Array;
    convertRequestedBlockToUint8Array(requestBlock: number): Uint8Array;
    encodeUtf8(str: string): Uint8Array;
    concatUint8Arrays(arrays: Uint8Array[]): Uint8Array;
    prepareRequest(request: RelaySession): Uint8Array;
}
/**
 * Options for send relay method.
 */
interface SendRelayOptions {
    data: string;
    url: string;
    connectionType: string;
}
export default Relayer;
