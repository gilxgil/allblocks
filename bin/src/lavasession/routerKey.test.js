"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const routerKey_1 = require("./routerKey");
describe("routerKey", () => {
    it("has no repetitions", () => {
        const unsorted = ["a", "a", "b", "b", "c", "c"];
        const routerKey = (0, routerKey_1.newRouterKey)(unsorted);
        expect(routerKey).toEqual("a|b|c");
    });
    it("sorts correctly", () => {
        const unsorted = ["c", "a", "b"];
        const routerKey = (0, routerKey_1.newRouterKey)(unsorted);
        expect(routerKey).toEqual("a|b|c");
    });
});
