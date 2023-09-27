"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyFinalizationData = exports.verifyRelayReply = exports.IsFinalizedBlock = exports.ReplaceRequestedBlock = exports.UpdateRequestedBlock = exports.constructRelayRequest = exports.newRelayData = void 0;
const common_1 = require("../common/common");
const relay_pb_1 = require("../grpc_web_services/lavanet/lava/pairing/relay_pb");
const crypto_1 = require("@cosmjs/crypto");
const logger_1 = require("../logger/logger");
const DecPrecision = 18;
function newRelayData(relayData) {
    const { data, url, connectionType } = relayData;
    // create request private data
    const enc = new TextEncoder();
    const requestPrivateData = new relay_pb_1.RelayPrivateData();
    requestPrivateData.setConnectionType(connectionType);
    requestPrivateData.setApiUrl(url);
    requestPrivateData.setData(enc.encode(data));
    requestPrivateData.setRequestBlock(common_1.NOT_APPLICABLE); // TODO: when block parsing is implemented, replace this with the request parsed block.
    requestPrivateData.setApiInterface(relayData.apiInterface);
    requestPrivateData.setSalt(getNewSalt());
    return requestPrivateData;
}
exports.newRelayData = newRelayData;
function getNewSalt() {
    const salt = generateRandomUint();
    const nonceBytes = new Uint8Array(8);
    const dataView = new DataView(nonceBytes.buffer);
    // use LittleEndian
    dataView.setBigUint64(0, BigInt(salt), true);
    return nonceBytes;
}
function generateRandomUint() {
    const min = 1;
    const max = Number.MAX_SAFE_INTEGER;
    return Math.floor(Math.random() * (max - min) + min);
}
function constructRelayRequest(lavaChainID, chainID, relayData, providerAddress, singleConsumerSession, epoch, reportedProviders) {
    const relayRequest = new relay_pb_1.RelayRequest();
    relayRequest.setRelayData(relayData);
    const relaySession = constructRelaySession(lavaChainID, chainID, relayData, providerAddress, singleConsumerSession, epoch, reportedProviders);
    relayRequest.setRelaySession(relaySession);
    return relayRequest;
}
exports.constructRelayRequest = constructRelayRequest;
function constructRelaySession(lavaChainID, chainID, relayData, providerAddress, singleConsumerSession, epoch, reportedProviders) {
    let newQualityOfServiceReport = undefined;
    let newQualityOfServiceReportExcellence = undefined;
    const lastQos = singleConsumerSession.qoSInfo.lastQoSReport;
    function padWithZeros(whole, fractions) {
        if (fractions.length > DecPrecision) {
            fractions = fractions.slice(0, 18);
        }
        const toPad = DecPrecision - fractions.length;
        return (whole + fractions + "0".repeat(toPad)).replace(/^0+/, "");
    }
    function serializeToDec(input) {
        const splitted = input.split(".");
        if (splitted.length > 2 || splitted.length < 1) {
            throw new Error("invalid decimal input " + input);
        }
        const wholenumber = splitted[0];
        let fraction = "";
        if (splitted.length > 1) {
            fraction = splitted[1];
        }
        return padWithZeros(wholenumber, fraction);
    }
    try {
        if (lastQos != undefined) {
            newQualityOfServiceReport = new relay_pb_1.QualityOfServiceReport();
            // TODO: needs to serialize the QoS report value like a serialized Dec
            newQualityOfServiceReport.setLatency(serializeToDec(lastQos.getLatency()));
            newQualityOfServiceReport.setAvailability(serializeToDec(lastQos.getAvailability()));
            newQualityOfServiceReport.setSync(serializeToDec(lastQos.getSync()));
        }
    }
    catch (err) {
        logger_1.Logger.warn("failed serializing QoS ", err);
        newQualityOfServiceReport = undefined;
    }
    const lastQosExcellence = singleConsumerSession.qoSInfo.lastExcellenceQoSReport;
    if (lastQosExcellence != undefined) {
        newQualityOfServiceReportExcellence = new relay_pb_1.QualityOfServiceReport();
        // TODO: needs to serialize the QoS report value like a serialized Dec
        newQualityOfServiceReportExcellence.setLatency(serializeToDec(lastQosExcellence.getLatency()));
        newQualityOfServiceReportExcellence.setAvailability(serializeToDec(lastQosExcellence.getAvailability()));
        newQualityOfServiceReportExcellence.setSync(serializeToDec(lastQosExcellence.getSync()));
    }
    const relaySession = new relay_pb_1.RelaySession();
    relaySession.setSpecId(chainID);
    relaySession.setLavaChainId(lavaChainID);
    relaySession.setSessionId(singleConsumerSession.sessionId);
    relaySession.setProvider(providerAddress);
    relaySession.setSig(new Uint8Array());
    relaySession.setContentHash(calculateContentHash(relayData));
    relaySession.setEpoch(epoch);
    relaySession.setRelayNum(singleConsumerSession.relayNum);
    relaySession.setQosReport(newQualityOfServiceReport); // TODO: this is failing due to unmarshaling
    relaySession.setCuSum(singleConsumerSession.cuSum + singleConsumerSession.latestRelayCu);
    relaySession.setQosExcellenceReport(newQualityOfServiceReportExcellence); // TODO: this is failing due to unmarshaling
    relaySession.setUnresponsiveProvidersList(reportedProviders);
    return relaySession;
}
function calculateContentHash(relayRequestData) {
    const requestBlock = relayRequestData.getRequestBlock();
    const requestBlockBytes = convertRequestedBlockToUint8Array(requestBlock);
    const apiInterfaceBytes = encodeUtf8(relayRequestData.getApiInterface());
    const connectionTypeBytes = encodeUtf8(relayRequestData.getConnectionType());
    const apiUrlBytes = encodeUtf8(relayRequestData.getApiUrl());
    const dataBytes = relayRequestData.getData();
    const dataUint8Array = dataBytes instanceof Uint8Array ? dataBytes : encodeUtf8(dataBytes);
    const saltBytes = relayRequestData.getSalt();
    const saltUint8Array = saltBytes instanceof Uint8Array ? saltBytes : encodeUtf8(saltBytes);
    const msgData = concatUint8Arrays([
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
function encodeUtf8(str) {
    return new TextEncoder().encode(str);
}
function concatUint8Arrays(arrays) {
    const totalLength = arrays.reduce((acc, arr) => acc + arr.length, 0);
    const result = new Uint8Array(totalLength);
    let offset = 0;
    arrays.forEach((arr) => {
        result.set(arr, offset);
        offset += arr.length;
    });
    return result;
}
function convertRequestedBlockToUint8Array(requestBlock) {
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
function UpdateRequestedBlock(request, response) {
    request.setRequestBlock(ReplaceRequestedBlock(request.getRequestBlock(), response.getLatestBlock()));
    return;
}
exports.UpdateRequestedBlock = UpdateRequestedBlock;
function ReplaceRequestedBlock(requestedBlock, latestBlock) {
    switch (requestedBlock) {
        case common_1.LATEST_BLOCK:
        case common_1.SAFE_BLOCK:
        case common_1.FINALIZED_BLOCK:
            return latestBlock;
        case common_1.EARLIEST_BLOCK:
            // TODO: add support for earliest block reliability
            return common_1.NOT_APPLICABLE;
        default:
            return requestedBlock;
    }
}
exports.ReplaceRequestedBlock = ReplaceRequestedBlock;
function IsFinalizedBlock(requestedBlock, latestBlock, finalizationCriteria) {
    switch (requestedBlock) {
        case common_1.NOT_APPLICABLE:
            return false;
        default:
            if (requestedBlock < 0) {
                return false;
            }
            if (requestedBlock <= latestBlock - finalizationCriteria) {
                return true;
            }
    }
    return false;
}
exports.IsFinalizedBlock = IsFinalizedBlock;
function verifyRelayReply(reply, relayRequest, providerAddress) {
    // TODO: implement signature verificaion
    return;
}
exports.verifyRelayReply = verifyRelayReply;
function verifyFinalizationData(reply, relayRequest, providerAddr, consumerAddress, latestSessionBlock, blockDistanceForfinalization) {
    // TODO: implement signature extraction on finalization data
    // relayFinalization := pairingtypes.NewRelayFinalization(pairingtypes.NewRelayExchange(*relayRequest, *reply), consumerAcc)
    // serverKey, err := sigs.RecoverPubKey(relayFinalization)
    // if err != nil {
    // 	return nil, nil, err
    // }
    // serverAddr, err := sdk.AccAddressFromHexUnsafe(serverKey.Address().String())
    // if err != nil {
    // 	return nil, nil, err
    // }
    // if serverAddr.String() != providerAddr {
    // 	return nil, nil, utils.LavaFormatError("reply server address mismatch in finalization data ", ProviderFinzalizationDataError, utils.Attribute{Key: "parsed Address", Value: serverAddr.String()}, utils.Attribute{Key: "expected address", Value: providerAddr})
    // }
    const finalizedBlocks = new Map();
    // const finalizedHashes64 = reply.getFinalizedBlocksHashes_asB64();
    const dec = new TextDecoder();
    const decodedResponse = dec.decode(reply.getFinalizedBlocksHashes_asU8());
    const finalizaedBlocksObj = JSON.parse(decodedResponse);
    for (const key in finalizaedBlocksObj) {
        const numericKey = parseInt(key, 10);
        finalizedBlocks.set(numericKey, finalizaedBlocksObj[key]);
    }
    const finalizationConflict = verifyFinalizationDataIntegrity(reply, latestSessionBlock, finalizedBlocks, providerAddr, blockDistanceForfinalization);
    if (finalizationConflict instanceof Error) {
        return finalizationConflict;
    }
    const finalizationData = {
        finalizedBlocks: finalizedBlocks,
        finalizationConflict: finalizationConflict,
    };
    return finalizationData;
}
exports.verifyFinalizationData = verifyFinalizationData;
function verifyFinalizationDataIntegrity(reply, existingSessionLatestBlock, finalizedBlocks, providerPublicAddress, blockDistanceForFinalizedData) {
    return undefined;
}
