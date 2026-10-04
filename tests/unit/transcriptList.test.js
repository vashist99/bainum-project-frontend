import { test, describe } from "node:test";
import assert from "node:assert/strict";

const React = await import("react");
const { renderToStaticMarkup } = await import("react-dom/server");
const TranscriptList = (await import("../../src/components/TranscriptList.jsx")).default;

function render(props) {
    return renderToStaticMarkup(React.createElement(TranscriptList, props));
}

const ITEMS = [
    { id: "1", date: new Date(2026, 3, 10, 12), label: "First recording" },
    { id: "2", date: new Date(2026, 3, 15, 12), label: "Second recording" },
];

describe("TranscriptList — date filter chrome", () => {
    test("renders from/to date inputs and a showing count of all items when unfiltered", () => {
        const html = render({
            items: ITEMS,
            renderItem: (item) => React.createElement("p", { key: item.id }, item.label),
        });
        assert.match(html, /data-testid="transcript-date-from"/);
        assert.match(html, /data-testid="transcript-date-to"/);
        assert.match(html, /aria-label="Filter transcripts from date"/);
        assert.match(html, /aria-label="Filter transcripts to date"/);
        assert.match(html, /Showing 1–2 of 2/);
        assert.match(html, /First recording/);
        assert.match(html, /Second recording/);
        assert.doesNotMatch(html, /Clear dates/);
    });

    test("does not render Clear dates until a bound is set (initial empty inputs)", () => {
        const html = render({
            items: ITEMS,
            renderItem: (item) => React.createElement("p", { key: item.id }, item.label),
        });
        assert.doesNotMatch(html, />Clear dates</);
        assert.doesNotMatch(html, /data-testid="transcript-pager"/);
    });

    test("shows the first four cards and a pager when there are five recordings", () => {
        const items = ["One", "Two", "Three", "Four", "Five"].map((label, index) => ({
            id: String(index),
            date: new Date(2026, 3, index + 1, 12),
            label,
        }));
        const html = render({
            items,
            renderItem: (item) => React.createElement("p", { key: item.id }, item.label),
        });
        assert.match(html, /Showing 1–4 of 5/);
        assert.match(html, /One/);
        assert.match(html, /Four/);
        assert.doesNotMatch(html, /Five/);
        assert.match(html, /data-testid="transcript-pager"/);
        assert.match(html, /Page 1 of 2/);
        assert.match(html, /<button[^>]*disabled[^>]*>Previous<\/button>/);
        assert.match(html, /<button(?![^>]*disabled)[^>]*>Next<\/button>/);
    });
});
