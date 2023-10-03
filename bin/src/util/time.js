"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.secondsToMillis = exports.millisToSeconds = exports.now = exports.hourInMillis = void 0;
exports.hourInMillis = 60 * 60 * 1000;
function now() {
    return performance.timeOrigin + performance.now();
}
exports.now = now;
function millisToSeconds(millis) {
    return millis / 1000;
}
exports.millisToSeconds = millisToSeconds;
function secondsToMillis(seconds) {
    return seconds * 1000;
}
exports.secondsToMillis = secondsToMillis;
