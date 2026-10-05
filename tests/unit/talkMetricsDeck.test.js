import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { labelSpan } from "../../src/lib/dataMatrixLayout.js";
import { helpFor } from "../../src/lib/helpText.js";
import { buildDeckModel } from "../../src/lib/talkMetrics.js";

const React = await import("react");
const { renderToStaticMarkup } = await import("react-dom/server");
const TalkMetricsDeck = (await import("../../src/components/TalkMetricsDeck.jsx")).default;
const DataMatrixChart = (await import("../../src/components/DataMatrixChart.jsx")).default;

const HELP_KEYS = [
    "metric.dateRange",
    "metric.chartType",
    "metric.picker",
    "metric.dataMatrix",
    "metric.homeTrend",
    "metric.dotMatrix",
    "metric.dials",
    "metric.contentBucket",
    "metric.talkByActivity",
    "metric.alphabetKnowledge",
    "metric.storyTime",
    "metric.everyday",
    "metric.instructionalMix",
    "metric.sessionStrip",
    "metric.differentWords",
    "metric.whyHow",
    "metric.ideas",
    "metric.wordsPerIdea",
    "metric.wordVariety",
    "metric.connectingWords",
    "metric.contentWords",
    "metric.bigIdeaPhrases",
    "metric.coachScan",
];

function row(overrides) {
    return {
        date: "2026-10-01",
        durationSeconds: 120,
        wordCount: 40,
        wordsPerMinute: 20,
        activity: "Story time / read aloud",
        activityContext: "school",
        categoryWPM: { science: 8, social: 2, literature: 4, language: 1 },
        categoryWordCount: { science: 16, social: 4, literature: 8, language: 2 },
        languageFeatures: {
            uniqueWordCount: 10,
            whQuestionCount: 2,
            utteranceCount: 4,
            meanUtteranceLength: 5,
        },
        categoryLanguageFeatures: {
            science: { utteranceCount: 1, uniqueWordCount: 4, whQuestionCount: 1, meanUtteranceLength: 4 },
            social: { utteranceCount: 0, uniqueWordCount: 0, whQuestionCount: 0, meanUtteranceLength: null },
            language: { utteranceCount: 0, uniqueWordCount: 0, whQuestionCount: 0, meanUtteranceLength: null },
            literature: { utteranceCount: 1, uniqueWordCount: 3, whQuestionCount: 1, meanUtteranceLength: 6 },
        },
        ...overrides,
    };
}

const DECK_ROWS = [
    row({}),
    row({
        date: "2026-10-02",
        activity: "Letter & phonics activities",
        wordCount: 20,
    }),
    row({
        date: "2026-10-03",
        activity: "Science experiments",
        wordCount: 30,
    }),
    row({
        date: "2026-10-04",
        activity: "Lunch",
        wordCount: 12,
    }),
    row({
        date: "2026-09-15",
        activity: "Music time",
        wordCount: 999,
    }),
];

function dateTexts(html) {
    return [...html.matchAll(/<text x="([\d.]+)" y="[\d.]+" text-anchor="(start|middle|end)"[^>]*>(\d{4}-\d{2}-\d{2})<\/text>/g)];
}

function assertDatesInside(html) {
    const width = Number(html.match(/viewBox="0 0 ([\d.]+)/)[1]);
    const dates = dateTexts(html);
    assert.ok(dates.length >= 2);
    for (const match of dates) {
        const span = labelSpan({ x: Number(match[1]), anchor: match[2], text: match[3] });
        assert.ok(span.left >= -0.01, match[3]);
        assert.ok(span.right <= width + 0.01, match[3]);
    }
    for (let index = 1; index < dates.length; index += 1) {
        const previous = labelSpan({ x: Number(dates[index - 1][1]), anchor: dates[index - 1][2], text: dates[index - 1][3] });
        const current = labelSpan({ x: Number(dates[index][1]), anchor: dates[index][2], text: dates[index][3] });
        assert.ok(current.left >= previous.right - 0.01);
    }
}

describe("Data Matrix chart", () => {
    test("draws a dotted break for a skipped value and keeps dates inside the chart", () => {
        const empty = renderToStaticMarkup(React.createElement(DataMatrixChart, { points: [], metricLabel: "Words per minute" }));
        assert.match(empty, /Data Matrix for CATTAC/);
        assert.match(empty, /Words per minute/);

        const gapped = renderToStaticMarkup(React.createElement(DataMatrixChart, {
            metricLabel: "Why/how questions per minute",
            points: [
                { label: "2026-10-01", values: { science: 1, social: 2, language: 1, literature: 1 } },
                { label: "2026-10-02", values: { science: null, social: 2, language: 1, literature: 1 } },
                { label: "2026-10-03", values: { science: 3, social: 2, language: 1, literature: 1 } },
                { label: "2026-10-04", values: { science: 4, social: 2, language: 1, literature: 1 } },
            ],
        }));
        assert.equal((gapped.match(/<polyline /g) || []).length, 5);
        assert.equal((gapped.match(/stroke-dasharray="7 6"/g) || []).length, 1);
        assert.doesNotMatch(gapped, /<circle /);
        assert.equal((gapped.match(/aria-pressed="false"/g) || []).length, 4);
        assert.doesNotMatch(gapped, /aria-pressed="true"/);
        assert.equal((gapped.match(/opacity="1"/g) || []).length, 4);
        assert.equal((gapped.match(/stroke-width="2\.8"/g) || []).length, 5);
        assert.match(gapped, /text-anchor="start"[^>]*>2026-10-01</);
        assert.match(gapped, /text-anchor="end"[^>]*>2026-10-04</);
        assertDatesInside(gapped);
        const legendAt = gapped.lastIndexOf("Science");
        const scrollAt = gapped.indexOf("overflow-x-auto");
        assert.ok(scrollAt !== -1 && legendAt > scrollAt);
    });

    test("a long range is wider than the default chart and still shows the end dates", () => {
        const points = Array.from({ length: 40 }, (_, index) => ({
            label: `2026-03-${String((index % 28) + 1).padStart(2, "0")}`,
            values: { science: index + 1, social: 2, language: 1, literature: 1 },
        }));
        const html = renderToStaticMarkup(React.createElement(DataMatrixChart, { points, metricLabel: "Words per minute" }));
        const width = Number(html.match(/viewBox="0 0 ([\d.]+)/)[1]);
        assert.ok(width > 980);
        assert.match(html, new RegExp(`min-width:${width}px`));
        assert.match(html, /overflow-x-auto/);
        const last = points.at(-1).label;
        assert.match(html, /text-anchor="start"[^>]*>2026-03-01</);
        assert.match(html, new RegExp(`text-anchor="end"[^>]*>${last}<`));
        assertDatesInside(html);
        assert.doesNotMatch(html, /stroke-dasharray/);
    });
});

describe("Talk metrics deck date range", () => {
    test("one date range changes the chart points and the activity table together", () => {
        const early = buildDeckModel(DECK_ROWS, { start: "2026-10-01", end: "2026-10-01", context: "school", metric: "wpm" });
        const later = buildDeckModel(DECK_ROWS, { start: "2026-10-04", end: "2026-10-04", context: "school", metric: "wpm" });
        assert.deepEqual(early.points.map((point) => point.label), ["2026-10-01"]);
        assert.equal(early.activity.some((item) => item.bucket === "Books and reading"), true);
        assert.equal(early.activity.some((item) => item.bucket === "Meals and outdoor"), false);
        assert.deepEqual(later.points.map((point) => point.label), ["2026-10-04"]);
        assert.equal(later.activity.some((item) => item.bucket === "Meals and outdoor"), true);
        assert.equal(later.content.length, early.content.length);

        const html = renderToStaticMarkup(React.createElement(TalkMetricsDeck, {
            assessments: DECK_ROWS,
            initialStart: "2026-10-01",
            initialEnd: "2026-10-01",
            initialView: "datamatrix",
            role: "teacher",
        }));
        assert.match(html, /2026-10-01/);
        assert.match(html, /Books and reading/);
        assert.match(html, /Story-time interactivity/);
        assert.doesNotMatch(html, /Meals and outdoor/);
        assert.doesNotMatch(html, /Music time/);
        assert.doesNotMatch(html, /Alphabet vs knowledge/);
        assert.match(html, /of these recordings were lesson time/);
        assert.doesNotMatch(html, /lesson recordings/);
    });

    test("puts an info sticker on each metric block and keeps the help in everyday language", () => {
        const html = renderToStaticMarkup(React.createElement(TalkMetricsDeck, {
            assessments: DECK_ROWS,
            initialStart: "2026-10-01",
            initialEnd: "2026-10-04",
            initialView: "datamatrix",
            role: "coach",
        }));
        const stickers = html.match(/More information/g) || [];
        assert.ok(stickers.length >= 10, `expected stickers on each block, saw ${stickers.length}`);
        for (const key of HELP_KEYS) {
            const copy = helpFor(key);
            assert.equal(typeof copy, "string", key);
            assert.ok(copy.trim().length > 0, key);
            assert.doesNotMatch(copy, /utterance|type-token|cohort|schema|diarization|wh-question|below-typical|needs-improvement/i);
        }
        assert.match(html, /lesson recordings/);
        assert.match(html, /Alphabet vs knowledge/);
        assert.match(html, /Everyday moments/);
    });

    test("Dot Matrix and the dials do not use the category legend", () => {
        const dot = renderToStaticMarkup(React.createElement(TalkMetricsDeck, {
            assessments: DECK_ROWS,
            initialView: "dotmatrix",
            role: "teacher",
        }));
        assert.doesNotMatch(dot, /aria-pressed/);
        assert.match(dot, /Language Development Analysis - Year Overview/);
        const dials = readFileSync(new URL("../../src/components/LanguageDevelopmentCharts.jsx", import.meta.url), "utf8");
        assert.doesNotMatch(dials, /aria-pressed/);
        assert.doesNotMatch(dials, /Data Matrix for CATTAC/);
    });
});
