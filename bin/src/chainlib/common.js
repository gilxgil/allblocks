"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getChainParser = void 0;
const jsonrpc_1 = require("./jsonrpc");
const rest_1 = require("./rest");
const tendermint_1 = require("./tendermint");
const base_chain_parser_1 = require("./base_chain_parser");
const logger_1 = require("../logger/logger");
function getChainParser(apiInterface) {
    switch (apiInterface) {
        case base_chain_parser_1.APIInterfaceJsonRPC:
            return new jsonrpc_1.JsonRpcChainParser();
        case base_chain_parser_1.APIInterfaceRest:
            return new rest_1.RestChainParser();
        case base_chain_parser_1.APIInterfaceTendermintRPC:
            return new tendermint_1.TendermintRpcChainParser();
        default:
            throw logger_1.Logger.fatal("Couldn't find api interface in getChainParser options", apiInterface);
    }
}
exports.getChainParser = getChainParser;
