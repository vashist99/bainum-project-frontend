import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { BASE_WIDTH, categorySegments, chartLayout, labelSpan } from "../../src/lib/dataMatrixLayout.js";

function spansInside(layout) {
    const spans = layout.dateLabels.map(labelSpan);
    for (const span of spans) {
        assert.ok(span.left >= -0.01, `left ${span.left}`);
        assert.ok(span.right <= layout.width + 0.01, `right ${span.right} width ${layout.width}`);
    }
    for (let index = 1; index < spans.length; index += 1) {
        assert.ok(spans[index].left >= spans[index - 1].right - 0.01);
    }
    return spans;
}

describe("data matrix category lines", () => {
    test("a missing middle Science value is a dotted segment and not zero", () => {
        const segments = categorySegments([1, null, 3]);
        assert.equal(segments.length, 1);
        assert.equal(segments[0].kind, "dotted");
        assert.deepEqual(segments[0].points.map((point) => point.index), [0, 2]);
        assert.deepEqual(segments[0].points.map((point) => point.value), [1, 3]);
    });

    test("consecutive Social values are one solid segment", () => {
        const segments = categorySegments([2, 2, 2]);
        assert.equal(segments.length, 1);
        assert.equal(segments[0].kind, "solid");
        assert.equal(segments[0].points.length, 3);
    });

    test("a single Literature value is a marker", () => {
        const segments = categorySegments([null, 4, null]);
        assert.deepEqual(segments, [{ kind: "marker", points: [{ index: 1, value: 4 }] }]);
    });
});

describe("data matrix date layout", () => {
    test("the first and last dates stay inside the chart", () => {
        const layout = chartLayout(["2026-06-16", "2026-08-02", "2026-10-03"]);
        assert.equal(layout.dateLabels[0].anchor, "start");
        assert.equal(layout.dateLabels.at(-1).anchor, "end");
        assert.equal(layout.dateLabels[0].text, "2026-06-16");
        assert.equal(layout.dateLabels.at(-1).text, "2026-10-03");
        spansInside(layout);
    });

    test("a long observation list is wider than the default chart and dates do not overlap", () => {
        const labels = Array.from({ length: 40 }, (_, index) => `2026-01-${String((index % 28) + 1).padStart(2, "0")}`);
        const layout = chartLayout(labels);
        assert.ok(layout.width > BASE_WIDTH);
        assert.equal(layout.dateLabels[0].text, labels[0]);
        assert.equal(layout.dateLabels.at(-1).text, labels.at(-1));
        spansInside(layout);
    });
});
