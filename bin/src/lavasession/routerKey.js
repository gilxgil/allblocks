"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.newRouterKey = void 0;
const SEPARATOR = "|";
function newRouterKey(extensions) {
    const uniqueExtensions = new Set(extensions);
    return Array.from(uniqueExtensions).sort().join(SEPARATOR);
}
exports.newRouterKey = newRouterKey;
