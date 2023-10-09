import { Metadata } from "../grpc_web_services/lavanet/lava/pairing/relay_pb";
export interface RPCInput {
    getParams(): any;
    getResult(): string;
    parseBlock(block: string): number | Error;
    getHeaders(): Metadata[];
}
