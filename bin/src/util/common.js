"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.promiseAny = exports.byteArrayToString = exports.encodeUtf8 = exports.median = exports.sleep = exports.generateRandomInt = exports.debugPrint = exports.parseLong = exports.generateRPCData = exports.base64ToUint8Array = void 0;
function base64ToUint8Array(str) {
    const buffer = Buffer.from(str, "base64");
    return new Uint8Array(buffer);
}
exports.base64ToUint8Array = base64ToUint8Array;
function generateRPCData(rpcMessage) {
    const stringifyVersion = JSON.stringify(rpcMessage.version);
    const stringifyMethod = JSON.stringify(rpcMessage.method);
    const stringifyParam = JSON.stringify(rpcMessage.params, (key, value) => {
        if (typeof value === "bigint") {
            return value.toString();
        }
        return value;
    });
    return `{"jsonrpc": ${stringifyVersion}, "id": ${rpcMessage.id}, "method": ${stringifyMethod}, "params": ${stringifyParam}}`;
}
exports.generateRPCData = generateRPCData;
function parseLong(long) {
    /**
     * this function will parse long to a 64bit number,
     * this assumes all systems running the sdk will run on 64bit systems
     * @param long A long number to parse into number
     */
    const high = Number(long.high);
    const low = Number(long.low);
    const parsedNumber = (high << 32) + low;
    if (high > 0) {
        console.log("MAYBE AN ISSUE", high);
    }
    return parsedNumber;
}
exports.parseLong = parseLong;
function debugPrint(debugMode, message, ...optionalParams) {
    if (debugMode) {
        console.log(message, ...optionalParams);
    }
}
exports.debugPrint = debugPrint;
function generateRandomInt() {
    return Math.floor(Math.random() * (Number.MAX_SAFE_INTEGER + 1));
}
exports.generateRandomInt = generateRandomInt;
function sleep(ms) {
    if (ms <= 0) {
        return Promise.resolve();
    }
    return new Promise((resolve) => {
        const timeout = setTimeout(() => {
            resolve();
            clearTimeout(timeout);
        }, ms);
    });
}
exports.sleep = sleep;
function median(values) {
    // First, we need to sort the array in ascending order
    const sortedValues = values.slice().sort((a, b) => a - b);
    // Calculate the middle index
    const middleIndex = Math.floor(sortedValues.length / 2);
    // Check if the array length is even or odd
    if (sortedValues.length % 2 === 0) {
        // If it's even, return the average of the two middle values
        return (sortedValues[middleIndex - 1] + sortedValues[middleIndex]) / 2;
    }
    else {
        // If it's odd, return the middle value
        return sortedValues[middleIndex];
    }
}
exports.median = median;
function encodeUtf8(str) {
    return new TextEncoder().encode(str);
}
exports.encodeUtf8 = encodeUtf8;
function byteArrayToString(byteArray, replaceDoubleQuotes = false) {
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
        else if (replaceDoubleQuotes && byte === 0x22) {
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
}
exports.byteArrayToString = byteArrayToString;
function promiseAny(promises) {
    let errorCounter = 0;
    let hasResolved = false;
    const errorOutput = new Array(promises.length);
    return new Promise((resolve, reject) => {
        const resolveOnce = (value) => {
            if (!hasResolved) {
                hasResolved = true;
                resolve(value);
            }
        };
        const rejection = (idx, error) => {
            errorCounter++;
            errorOutput[idx] = error;
            if (errorCounter === promises.length) {
                reject(errorOutput);
            }
        };
        for (const [idx, promise] of promises.entries()) {
            Promise.resolve(promise)
                .then(resolveOnce)
                .catch((error) => rejection(idx, error));
        }
    });
}
exports.promiseAny = promiseAny;
