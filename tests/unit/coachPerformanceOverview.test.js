import { test, describe } from "node:test";
import assert from "node:assert/strict";

const React = await import("react");
const { renderToStaticMarkup } = await import("react-dom/server");
const CoachPerformanceOverview = (await import("../../src/components/CoachPerformanceOverview.jsx")).default;

const payload = {
    assignedTeacherCount: 2,
    assessments: [
        {
            date: "2026-10-01",
            wordsPerMinute: 120,
            categoryWPM: { science: 10, social: 20, literature: 30, language: 40 },
            transcript: "Lead words should not render",
        },
        {
            date: "2026-10-02",
            wordsPerMinute: 80,
            categoryWPM: { science: 5, social: 5, literature: 5, language: 5 },
            transcript: "Assistant words should not render",
        },
    ],
};

function renderOverview(props) {
    return renderToStaticMarkup(React.createElement(CoachPerformanceOverview, props));
}

describe("CoachPerformanceOverview", () => {
    test("coach dashboard and admin coach page each render one chart from the same payload", () => {
        const dashboard = renderOverview({
            ...payload,
            emptyTeachersMessage: "No teachers are assigned to you yet.",
        });
        const adminPage = renderOverview({
            ...payload,
            emptyTeachersMessage: "No teachers are assigned to this coach.",
        });

        for (const html of [dashboard, adminPage]) {
            assert.equal((html.match(/Language Development Analysis - Year Overview/g) || []).length, 1);
            assert.match(html, /At School/);
            assert.match(html, /Dot Matrix/);
            assert.doesNotMatch(html, /Lead words should not render/);
            assert.doesNotMatch(html, /Assistant words should not render/);
            assert.doesNotMatch(html, /Download All/);
            assert.doesNotMatch(html, /Record/);
        }
    });

    test("explains when no teachers are assigned and shows no chart", () => {
        const html = renderOverview({
            assignedTeacherCount: 0,
            assessments: [],
            emptyTeachersMessage: "No teachers are assigned to this coach.",
        });
        assert.match(html, /No teachers are assigned to this coach/);
        assert.doesNotMatch(html, /Language Development Analysis/);
    });
});
