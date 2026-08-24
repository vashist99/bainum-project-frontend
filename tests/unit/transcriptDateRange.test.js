import { test, describe } from "node:test";
import assert from "node:assert/strict";

import {
    startOfLocalDay,
    endOfLocalDay,
    isDateInRange,
    filterItemsByDateRange,
} from "../../src/utils/transcriptDateRange.js";

const localNoon = (year, month, day) => new Date(year, month - 1, day, 12, 0, 0, 0);

describe("startOfLocalDay / endOfLocalDay", () => {
    test("parses YYYY-MM-DD as local midnight and end of day", () => {
        const start = startOfLocalDay("2026-04-12");
        const end = endOfLocalDay("2026-04-12");
        assert.equal(start.getFullYear(), 2026);
        assert.equal(start.getMonth(), 3);
        assert.equal(start.getDate(), 12);
        assert.equal(start.getHours(), 0);
        assert.equal(start.getMinutes(), 0);
        assert.equal(end.getDate(), 12);
        assert.equal(end.getHours(), 23);
        assert.equal(end.getMinutes(), 59);
        assert.equal(end.getMilliseconds(), 999);
    });

    test("rejects empty, malformed, and impossible calendar dates", () => {
        assert.equal(startOfLocalDay(""), null);
        assert.equal(startOfLocalDay("2026/04/12"), null);
        assert.equal(startOfLocalDay("2026-02-31"), null);
        assert.equal(endOfLocalDay(null), null);
    });
});

describe("isDateInRange", () => {
    test("includes the from and to calendar days (local)", () => {
        const morning = new Date(2026, 3, 12, 0, 1, 0);
        const evening = new Date(2026, 3, 12, 23, 58, 0);
        assert.equal(isDateInRange(morning, "2026-04-12", "2026-04-12"), true);
        assert.equal(isDateInRange(evening, "2026-04-12", "2026-04-12"), true);
        assert.equal(isDateInRange(localNoon(2026, 4, 11), "2026-04-12", "2026-04-12"), false);
        assert.equal(isDateInRange(localNoon(2026, 4, 13), "2026-04-12", "2026-04-12"), false);
    });

    test("from-only and to-only bounds", () => {
        assert.equal(isDateInRange(localNoon(2026, 4, 15), "2026-04-12", ""), true);
        assert.equal(isDateInRange(localNoon(2026, 4, 10), "2026-04-12", ""), false);
        assert.equal(isDateInRange(localNoon(2026, 4, 10), "", "2026-04-12"), true);
        assert.equal(isDateInRange(localNoon(2026, 4, 15), "", "2026-04-12"), false);
    });

    test("rejects unparsable dates", () => {
        assert.equal(isDateInRange("not-a-date", "2026-04-12", "2026-04-12"), false);
    });
});

describe("filterItemsByDateRange", () => {
    const items = [
        { id: "a", date: localNoon(2026, 4, 10) },
        { id: "b", date: localNoon(2026, 4, 12) },
        { id: "c", date: localNoon(2026, 4, 15) },
    ];

    test("returns all items when neither bound is set", () => {
        assert.deepEqual(
            filterItemsByDateRange(items, "", "").map((i) => i.id),
            ["a", "b", "c"]
        );
    });

    test("filters inclusively by from, to, and both", () => {
        assert.deepEqual(
            filterItemsByDateRange(items, "2026-04-12", "").map((i) => i.id),
            ["b", "c"]
        );
        assert.deepEqual(
            filterItemsByDateRange(items, "", "2026-04-12").map((i) => i.id),
            ["a", "b"]
        );
        assert.deepEqual(
            filterItemsByDateRange(items, "2026-04-12", "2026-04-12").map((i) => i.id),
            ["b"]
        );
    });

    test("uses getDate when provided", () => {
        const rows = [
            { id: "x", recordedAt: localNoon(2026, 5, 1) },
            { id: "y", recordedAt: localNoon(2026, 5, 9) },
        ];
        assert.deepEqual(
            filterItemsByDateRange(rows, "2026-05-09", "2026-05-09", (row) => row.recordedAt).map(
                (i) => i.id
            ),
            ["y"]
        );
    });

    test("returns an empty array for non-arrays", () => {
        assert.deepEqual(filterItemsByDateRange(null, "2026-04-12", ""), []);
    });
});
