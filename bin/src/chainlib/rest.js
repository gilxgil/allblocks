"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RestChainParser = void 0;
const base_chain_parser_1 = require("../chainlib/base_chain_parser");
const logger_1 = require("../logger/logger");
const common_1 = require("../common/common");
class RestChainParser extends base_chain_parser_1.BaseChainParser {
    constructor() {
        super();
        this.apiInterface = base_chain_parser_1.APIInterfaceRest;
    }
    parseMsg(options) {
        if (!this.isRest(options)) {
            throw logger_1.Logger.fatal("Wrong relay options provided, expected SendRestRelayOptions got SendRelayOptions");
        }
        const [apiCont, found] = this.matchSpecApiByName(options.url, options.connectionType);
        if (!found || !apiCont) {
            throw logger_1.Logger.fatal("Rest api not supported", options.url);
        }
        if (!apiCont.api.getEnabled()) {
            throw logger_1.Logger.fatal("API is disabled in spec", options.url);
        }
        // TODO: implement block parser
        const apiCollection = this.getApiCollection({
            addon: apiCont.collectionKey.addon,
            connectionType: options.connectionType,
            internalPath: apiCont.collectionKey.internalPath,
        });
        const headerHandler = this.handleHeaders(options.metadata, apiCollection, base_chain_parser_1.HeadersPassSend);
        // TODO: implement apip.GetParsingByTag to support headers
        let data = "";
        if (options.data) {
            data = "?";
            for (const key in options.data) {
                data = data + key + "=" + options.data[key] + "&";
            }
        }
        // TODO: add block parsing and use header overwrite.
        const chainMessage = new base_chain_parser_1.ChainMessage(common_1.NOT_APPLICABLE, apiCont.api, apiCollection, data, options.url);
        // TODO: add extension parsing.
        return chainMessage;
    }
}
exports.RestChainParser = RestChainParser;
