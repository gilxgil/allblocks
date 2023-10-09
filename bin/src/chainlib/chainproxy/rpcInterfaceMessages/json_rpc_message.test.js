"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const common_1 = require("../../../util/common");
const json_rpc_message_1 = require("./json_rpc_message");
describe("JsonrpcMessage", () => {
    it("should get Params", () => {
        const cp = new json_rpc_message_1.JsonrpcMessage();
        cp.initJsonrpcMessage("", "", "", "test_params", undefined, "");
        expect(cp.getParams()).toEqual("test_params");
    });
    it("should get Result", () => {
        const cp = new json_rpc_message_1.JsonrpcMessage();
        cp.initJsonrpcMessage("", "", "", "", undefined, "test_result");
        expect(cp.getResult()).toEqual("test_result");
    });
});
describe("JsonrpcMessage", () => {
    describe("should parse Block", () => {
        const testTable = [
            {
                name: "Default block param",
                input: "latest",
                expected: -2,
            },
            {
                name: "String representation of int64",
                input: "80",
                expected: 80,
            },
            {
                name: "Hex representation of int64",
                input: "0x26D",
                expected: 621,
            },
        ];
        testTable.forEach((testCase) => {
            it(testCase.name, () => {
                const restMessage = new json_rpc_message_1.JsonrpcMessage();
                const block = restMessage.parseBlock(testCase.input);
                expect(block).toEqual(testCase.expected);
            });
        });
    });
});
describe("ParseJsonRPCMsg", () => {
    it("should parse valid JSON input", () => {
        const data = (0, common_1.encodeUtf8)('{"jsonrpc": "2.0", "id": 1, "method": "getblock", "params": [], "result": {"block": "block data"}}');
        const msgsOrError = (0, json_rpc_message_1.parseJsonRPCMsg)(data);
        expect(Array.isArray(msgsOrError)).toBe(true);
        const msgs = msgsOrError;
        expect(msgs).toHaveLength(1);
        const msg = msgs[0];
        expect(msg.version).toEqual("2.0");
        expect(msg.method).toEqual("getblock");
    });
    it("should return Error on invalid JSON input", () => {
        const data = (0, common_1.encodeUtf8)('{"jsonrpc": "2.0", "id": 1, "method": "getblock", "params": []');
        const msgs = (0, json_rpc_message_1.parseJsonRPCMsg)(data);
        expect(msgs).toBeInstanceOf(Error);
    });
});
describe("ParseJsonRPCBatch", () => {
    it("should parse valid JSON input", () => {
        const data = (0, common_1.encodeUtf8)('[{"method":"eth_chainId","params":[],"id":1,"jsonrpc":"2.0"},{"method":"eth_accounts","params":[],"id":2,"jsonrpc":"2.0"},{"method":"eth_blockNumber","params":[],"id":3,"jsonrpc":"2.0"}]');
        const msgsOrError = (0, json_rpc_message_1.parseJsonRPCMsg)(data);
        expect(Array.isArray(msgsOrError)).toBe(true);
        const msgs = msgsOrError;
        const methods = ["eth_chainId", "eth_accounts", "eth_blockNumber"];
        expect(msgs).toHaveLength(3);
        for (let index = 0; index < msgs.length; index++) {
            const msg = msgs[index];
            expect(msg.version).toBe("2.0");
            expect(msg.method).toBe(methods[index]);
        }
    });
});
