import { JsonRpcChainParser } from "./jsonrpc";
import { RestChainParser } from "./rest";
import { TendermintRpcChainParser } from "./tendermint";
export declare function getChainParser(apiInterface: string): JsonRpcChainParser | RestChainParser | TendermintRpcChainParser;
