import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { CONTENT_CATEGORIES } from "../../src/lib/talkMetrics.js";
import { nextHighlight, seriesStyle } from "../../src/lib/dataMatrixSeries.js";

describe("data matrix series highlight", () => {
    test("a null selection leaves every category at full strength", () => {
        for (const category of CONTENT_CATEGORIES) {
            assert.deepEqual(seriesStyle(category, null), { opacity: 1, strokeWidth: 2.8 });
        }
    });

    test("Science fades the other three", () => {
        assert.equal(seriesStyle("science", "science").opacity, 1);
        assert.equal(seriesStyle("science", "science").strokeWidth, 4.2);
        for (const category of ["social", "language", "literature"]) {
            assert.equal(seriesStyle(category, "science").opacity, 0.2);
            assert.equal(seriesStyle(category, "science").strokeWidth, 2.8);
        }
    });

    test("selecting Science again matches no selection", () => {
        assert.equal(nextHighlight("science", "science"), null);
        for (const category of CONTENT_CATEGORIES) {
            assert.deepEqual(seriesStyle(category, nextHighlight("science", "science")), seriesStyle(category, null));
        }
    });
});
