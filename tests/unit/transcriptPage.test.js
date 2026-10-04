import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { pageSlice, TRANSCRIPT_PAGE_SIZE } from "../../src/utils/transcriptPage.js";

const five = ["a", "b", "c", "d", "e"];

describe("transcript page slice", () => {
    test("uses a page size of 4", () => {
        assert.equal(TRANSCRIPT_PAGE_SIZE, 4);
    });

    test("splits five items across two pages and keeps the last page short", () => {
        const first = pageSlice(five, 0);
        assert.deepEqual(first.items, ["a", "b", "c", "d"]);
        assert.equal(first.pageIndex, 0);
        assert.equal(first.pageCount, 2);
        assert.equal(first.start, 1);
        assert.equal(first.end, 4);

        const last = pageSlice(five, 1);
        assert.deepEqual(last.items, ["e"]);
        assert.equal(last.pageIndex, 1);
        assert.equal(last.pageCount, 2);
        assert.equal(last.start, 5);
        assert.equal(last.end, 5);
    });

    test("treats an empty list as one empty page", () => {
        const page = pageSlice([], 0);
        assert.deepEqual(page.items, []);
        assert.equal(page.pageIndex, 0);
        assert.equal(page.pageCount, 1);
        assert.equal(page.start, 0);
        assert.equal(page.end, 0);
    });

    test("clamps an index past the end to the last page", () => {
        const page = pageSlice(five, 9);
        assert.deepEqual(page.items, ["e"]);
        assert.equal(page.pageIndex, 1);
        assert.equal(page.pageCount, 2);
    });
});
