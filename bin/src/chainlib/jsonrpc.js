"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JsonRpcChainParser = void 0;
const base_chain_parser_1 = require("../chainlib/base_chain_parser");
const logger_1 = require("../logger/logger");
const common_1 = require("../util/common");
const common_2 = require("../common/common");
const MethodPost = "POST";
class JsonRpcChainParser extends base_chain_parser_1.BaseChainParser {
    constructor() {
        super();
        this.apiInterface = base_chain_parser_1.APIInterfaceJsonRPC;
    }
    parseMsg(options) {
        if (this.isRest(options)) {
            throw logger_1.Logger.fatal("Wrong relay options provided, expected SendRestRelayOptions got SendRelayOptions");
        }
        const apiCont = this.getSupportedApi(options.method, MethodPost);
        const apiCollection = this.getApiCollection({
            addon: apiCont.collectionKey.addon,
            connectionType: MethodPost,
            internalPath: apiCont.collectionKey.internalPath,
        });
        const headerHandler = this.handleHeaders(options.metadata, apiCollection, base_chain_parser_1.HeadersPassSend);
        // TODO: implement apip.GetParsingByTag to support headers
        const chainMessage = new base_chain_parser_1.ChainMessage(common_2.NOT_APPLICABLE, apiCont.api, apiCollection, (0, common_1.generateRPCData)(options.method, options.params), "");
        return chainMessage;
    }
}
exports.JsonRpcChainParser = JsonRpcChainParser;
