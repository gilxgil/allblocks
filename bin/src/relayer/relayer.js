"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Relayer = void 0;
const default_1 = require("../config/default");
const crypto_1 = require("@cosmjs/crypto");
const encoding_1 = require("@cosmjs/encoding");
const grpc_web_1 = require("@improbable-eng/grpc-web");
const relay_pb_1 = require("../grpc_web_services/lavanet/lava/pairing/relay_pb");
const relay_pb_service_1 = require("../grpc_web_services/lavanet/lava/pairing/relay_pb_service");
const browser_1 = __importDefault(require("../util/browser"));
const browserAllowInsecure_1 = __importDefault(require("../util/browserAllowInsecure"));
const errors_1 = __importDefault(require("../sdk/errors"));
class Relayer {
    constructor(relayerOptions) {
        var _a;
        this.byteArrayToString = (byteArray) => {
            let output = "";
            for (let i = 0; i < byteArray.length; i++) {
                const byte = byteArray[i];
                if (byte === 0x09) {
                    output += "\\t";
                }
                else if (byte === 0x0a) {
                    output += "\\n";
                }
                else if (byte === 0x0d) {
                    output += "\\r";
                }
                else if (byte === 0x5c) {
                    output += "\\\\";
                }
                else if (byte === 0x22) {
                    output += '\\"';
                }
                else if (byte >= 0x20 && byte <= 0x7e) {
                    output += String.fromCharCode(byte);
                }
                else {
                    output += "\\" + byte.toString(8).padStart(3, "0");
                }
            }
            return output;
        };
        this.privKey = relayerOptions.privKey;
        this.lavaChainId = relayerOptions.lavaChainId;
        this.prefix = relayerOptions.secure ? "https" : "http";
        this.allowInsecureTransport =
            (_a = relayerOptions.allowInsecureTransport) !== null && _a !== void 0 ? _a : false;
        if (relayerOptions.transport) {
            this.transport = relayerOptions.transport;
        }
    }
    // when an epoch changes we need to update the badge
    setBadge(badge) {
        if (this.badge && !badge) {
            // we have a badge and trying to set it to undefined
            throw new Error("Trying to set an undefined badge to an existing badge, bad flow");
        }
        this.badge = badge;
    }
    probeProvider(providerAddress, apiInterface, guid, specId) {
        return __awaiter(this, void 0, void 0, function* () {
            const client = new relay_pb_service_1.RelayerClient(this.prefix + "://" + providerAddress, this.getTransportWrapped());
            const request = new relay_pb_1.ProbeRequest();
            request.setGuid(guid);
            request.setApiInterface(apiInterface);
            request.setSpecId(specId);
            const requestPromise = new Promise((resolve, reject) => {
                client.probe(request, (err, result) => {
                    if (err != null) {
                        console.log("failed sending probe", err);
                        reject(err);
                    }
                    if (result != null) {
                        resolve(result);
                    }
                    reject(new Error("Didn't get an error nor result"));
                });
            });
            return this.relayWithTimeout(5000, requestPromise);
        });
    }
    sendRelay(client, relayRequest, timeout) {
        return __awaiter(this, void 0, void 0, function* () {
            const requestSession = relayRequest.getRelaySession();
            if (requestSession == undefined) {
                return new Error("empty request session");
            }
            requestSession.setSig(new Uint8Array());
            // Sign data
            const signedMessage = yield this.signRelay(requestSession, this.privKey);
            requestSession.setSig(signedMessage);
            if (this.badge) {
                // Badge is separated from the signature!
                requestSession.setBadge(this.badge);
            }
            relayRequest.setRelaySession(requestSession);
            const requestPromise = new Promise((resolve, reject) => {
                client.relay(relayRequest, (err, result) => {
                    if (err != null) {
                        console.log("failed sending relay", err);
                        reject(err);
                    }
                    if (result != null) {
                        resolve(result);
                    }
                    reject(new Error("Didn't get an error nor result"));
                });
            });
            return this.relayWithTimeout(timeout, requestPromise);
        });
    }
    constructAndSendRelay(options, singleConsumerSession) {
        return __awaiter(this, void 0, void 0, function* () {
            // Extract attributes from options
            const { data, url, connectionType } = options;
            const enc = new TextEncoder();
            // create request private data
            const requestPrivateData = new relay_pb_1.RelayPrivateData();
            requestPrivateData.setConnectionType(connectionType);
            requestPrivateData.setApiUrl(url);
            requestPrivateData.setData(enc.encode(data));
            requestPrivateData.setRequestBlock(-1); // TODO: when block parsing is implemented, replace this with the request parsed block. -1 == not applicable
            requestPrivateData.setApiInterface(options.apiInterface);
            requestPrivateData.setSalt(this.getNewSalt());
            const contentHash = this.calculateContentHashForRelayData(requestPrivateData);
            // create request session
            const requestSession = new relay_pb_1.RelaySession();
            requestSession.setSpecId(options.chainId);
            requestSession.setSessionId(singleConsumerSession.sessionId);
            requestSession.setCuSum(singleConsumerSession.cuSum);
            requestSession.setProvider(options.publicProviderLavaAddress);
            requestSession.setRelayNum(singleConsumerSession.relayNum);
            requestSession.setEpoch(options.epoch);
            requestSession.setUnresponsiveProvidersList(new Array());
            requestSession.setContentHash(contentHash);
            requestSession.setSig(new Uint8Array());
            requestSession.setLavaChainId(this.lavaChainId);
            // Sign data
            const signedMessage = yield this.signRelay(requestSession, this.privKey);
            requestSession.setSig(signedMessage);
            if (this.badge) {
                // Badge is separated from the signature!
                requestSession.setBadge(this.badge);
            }
            // Create request
            const request = new relay_pb_1.RelayRequest();
            request.setRelaySession(requestSession);
            request.setRelayData(requestPrivateData);
            const transportation = this.getTransport();
            const requestPromise = new Promise((resolve, reject) => {
                grpc_web_1.grpc.invoke(relay_pb_service_1.Relayer.Relay, {
                    request: request,
                    host: this.prefix + "://" + singleConsumerSession.endpoint.networkAddress,
                    transport: transportation,
                    onMessage: (message) => {
                        resolve(message);
                    },
                    onEnd: (code, msg) => {
                        if (code == grpc_web_1.grpc.Code.OK || msg == undefined) {
                            return;
                        }
                        let additionalInfo = "";
                        if (msg.includes("Response closed without headers")) {
                            additionalInfo =
                                additionalInfo +
                                    ", provider iPPORT: " +
                                    singleConsumerSession.endpoint.networkAddress +
                                    ", provider address: " +
                                    options.publicProviderLavaAddress;
                        }
                        const errMessage = this.extractErrorMessage(msg) + additionalInfo;
                        reject(new Error(errMessage));
                    },
                });
            });
            return this.relayWithTimeout(5000, requestPromise);
        });
    }
    getTransport() {
        if (this.transport) {
            return this.transport;
        }
        return this.allowInsecureTransport ? browserAllowInsecure_1.default : browser_1.default;
    }
    getTransportWrapped() {
        return {
            // if allow insecure we use a transport with rejectUnauthorized disabled
            // otherwise normal transport (default to rejectUnauthorized = true));}
            transport: this.getTransport(),
        };
    }
    extractErrorMessage(error) {
        // Regular expression to match the desired pattern
        const regex = /desc = (.*?)(?=:\s*rpc error|$)/s;
        // Try to match the error message to the regular expression
        const match = error.match(regex);
        // If there is a match, return it; otherwise return the original error message
        if (match && match[1]) {
            return match[1].trim();
        }
        else {
            return error;
        }
    }
    relayWithTimeout(timeLimit, task) {
        return __awaiter(this, void 0, void 0, function* () {
            let timeout;
            const timeoutPromise = new Promise((resolve, reject) => {
                timeout = setTimeout(() => {
                    reject(errors_1.default.relayTimeout);
                }, timeLimit);
            });
            const response = yield Promise.race([task, timeoutPromise]);
            if (timeout) {
                //the code works without this but let's be safe and clean up the timeout
                clearTimeout(timeout);
            }
            return response;
        });
    }
    // Sign relay request using priv key
    signRelay(request, privKey) {
        return __awaiter(this, void 0, void 0, function* () {
            const message = this.prepareRequest(request);
            const sig = yield crypto_1.Secp256k1.createSignature(message, (0, encoding_1.fromHex)(privKey));
            const recovery = sig.recovery;
            const r = sig.r(32); // if r is not 32 bytes, add padding
            const s = sig.s(32); // if s is not 32 bytes, add padding
            // TODO consider adding compression in the signing
            // construct signature
            // <(byte of 27+public key solution)>< padded bytes for signature R><padded bytes for signature S>
            return Uint8Array.from([27 + recovery, ...r, ...s]);
        });
    }
    calculateContentHashForRelayData(relayRequestData) {
        const requestBlock = relayRequestData.getRequestBlock();
        const requestBlockBytes = this.convertRequestedBlockToUint8Array(requestBlock);
        const apiInterfaceBytes = this.encodeUtf8(relayRequestData.getApiInterface());
        const connectionTypeBytes = this.encodeUtf8(relayRequestData.getConnectionType());
        const apiUrlBytes = this.encodeUtf8(relayRequestData.getApiUrl());
        const dataBytes = relayRequestData.getData();
        const dataUint8Array = dataBytes instanceof Uint8Array ? dataBytes : this.encodeUtf8(dataBytes);
        const saltBytes = relayRequestData.getSalt();
        const saltUint8Array = saltBytes instanceof Uint8Array ? saltBytes : this.encodeUtf8(saltBytes);
        const msgData = this.concatUint8Arrays([
            apiInterfaceBytes,
            connectionTypeBytes,
            apiUrlBytes,
            dataUint8Array,
            requestBlockBytes,
            saltUint8Array,
        ]);
        const hash = (0, crypto_1.sha256)(msgData);
        return hash;
    }
    convertRequestedBlockToUint8Array(requestBlock) {
        const requestBlockBytes = new Uint8Array(8);
        let number = BigInt(requestBlock);
        if (requestBlock < 0) {
            // Convert the number to its 64-bit unsigned representation
            const maxUint64 = BigInt(2) ** BigInt(64);
            number = maxUint64 + BigInt(requestBlock);
        }
        // Copy the bytes from the unsigned representation to the byte array
        for (let i = 0; i < 8; i++) {
            requestBlockBytes[i] = Number((number >> BigInt(8 * i)) & BigInt(0xff));
        }
        return requestBlockBytes;
    }
    encodeUtf8(str) {
        return new TextEncoder().encode(str);
    }
    concatUint8Arrays(arrays) {
        const totalLength = arrays.reduce((acc, arr) => acc + arr.length, 0);
        const result = new Uint8Array(totalLength);
        let offset = 0;
        arrays.forEach((arr) => {
            result.set(arr, offset);
            offset += arr.length;
        });
        return result;
    }
    prepareRequest(request) {
        const enc = new TextEncoder();
        // TODO: we serialize the message here the same way gogo proto serializes there's no straightforward implementation available, but we should compile this code into wasm and import it here because it's ugly
        let serializedRequest = "";
        for (const [key, valueInner] of Object.entries(request.toObject())) {
            serializedRequest += ((key, value) => {
                function handleNumStr(key, value) {
                    switch (typeof value) {
                        case "string":
                            if (value == "") {
                                return "";
                            }
                            return key + ':"' + value + '" ';
                        case "number":
                            if (value == 0) {
                                return "";
                            }
                            return key + ":" + value + " ";
                    }
                }
                if (value == undefined) {
                    return "";
                }
                switch (typeof value) {
                    case "string":
                    case "number":
                        return handleNumStr(key, value);
                    case "object":
                        let valueInnerStr = "";
                        if (value instanceof Uint8Array) {
                            valueInnerStr = this.byteArrayToString(value);
                            return key + ':"' + valueInnerStr + '" ';
                        }
                        if (value instanceof Array) {
                            let retst = "";
                            for (const arrayVal of Object.values(value)) {
                                let arrayValstr = "";
                                const entries = Object.entries(arrayVal);
                                for (const [objkey, objVal] of entries) {
                                    const objValStr = handleNumStr(objkey, objVal);
                                    if (objValStr != "") {
                                        arrayValstr += objValStr;
                                    }
                                }
                                if (arrayValstr != "") {
                                    retst += key + ":<" + arrayValstr + "> ";
                                }
                            }
                            return retst;
                        }
                        const entries = Object.entries(value);
                        if (entries.length == 0) {
                            return "";
                        }
                        let retst = "";
                        for (const [objkey, objVal] of entries) {
                            let objValStr = "";
                            switch (typeof objVal) {
                                case "string":
                                case "number":
                                    objValStr = handleNumStr(objkey, objVal);
                                    break;
                                case "object":
                                    objValStr = objkey + ":" + this.byteArrayToString(objVal);
                                    break;
                            }
                            if (objValStr != "") {
                                retst += objValStr;
                            }
                        }
                        if (retst != "") {
                            return key + ":<" + retst + "> ";
                        }
                        return "";
                }
            })(key, valueInner);
        }
        // console.log("message: " + serializedRequest);
        const encodedMessage = enc.encode(serializedRequest);
        // console.log("encodedMessage: " + encodedMessage);
        const hash = (0, crypto_1.sha256)(encodedMessage);
        return hash;
    }
    // SendRelayToAllProvidersAndRace sends relay to all lava providers and returns first response
    SendRelayToAllProvidersAndRace(batch) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log("Started sending to all providers and race");
            let lastError;
            for (let retryAttempt = 0; retryAttempt < default_1.BOOT_RETRY_ATTEMPTS; retryAttempt++) {
                const allRelays = new Map();
                for (const provider of batch) {
                    const uniqueKey = provider.options.publicProviderLavaAddress +
                        String(Math.floor(Math.random() * 10000000));
                    const providerRelayPromise = this.constructAndSendRelay(provider.options, provider.singleConsumerSession);
                    allRelays.set(uniqueKey, providerRelayPromise);
                }
                while (allRelays.size > 0) {
                    const returnedResponse = yield Promise.race([...allRelays.values()]);
                    if (returnedResponse) {
                        console.log("Ended sending to all providers and race");
                        return returnedResponse;
                    }
                    // Handle removal of completed promises separately (Optional and based on your needs)
                    allRelays.forEach((promise, key) => {
                        promise
                            .then(() => allRelays.delete(key))
                            .catch(() => allRelays.delete(key));
                    });
                }
            }
            throw new Error("Failed all promises SendRelayToAllProvidersAndRace: " + String(lastError));
        });
    }
    getNewSalt() {
        const salt = this.generateRandomUint();
        const nonceBytes = new Uint8Array(8);
        const dataView = new DataView(nonceBytes.buffer);
        // use LittleEndian
        dataView.setBigUint64(0, BigInt(salt), true);
        return nonceBytes;
    }
    generateRandomUint() {
        const min = 1;
        const max = Number.MAX_SAFE_INTEGER;
        return Math.floor(Math.random() * (max - min) + min);
    }
}
exports.Relayer = Relayer;
