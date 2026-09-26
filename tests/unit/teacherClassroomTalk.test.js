import { test, describe } from "node:test";
import assert from "node:assert/strict";

const React = await import("react");
const { renderToStaticMarkup } = await import("react-dom/server");
const TeacherClassroomTalkSections = (
    await import("../../src/components/TeacherClassroomTalkSections.jsx")
).default;

function render(assessments) {
    return renderToStaticMarkup(
        React.createElement(TeacherClassroomTalkSections, {
            assessments,
            viewMode: "dotmatrix",
            headerAction: React.createElement("button", { type: "button" }, "Download All"),
            renderCard: (row) => React.createElement("p", { key: row._id }, row.transcript),
        })
    );
}

describe("TeacherClassroomTalkSections", () => {
    test("lists two classrooms and an unscoped recording in one transcript list", () => {
        const html = render([
            {
                _id: "sun",
                classroomId: "room-sun",
                classroomName: "Sunflowers",
                date: "2026-03-02",
                transcript: "Sun talk",
            },
            {
                _id: "bug",
                classroomId: "room-bug",
                classroomName: "Butterflies",
                date: "2026-04-01",
                transcript: "Bug talk",
            },
            {
                _id: "loose",
                classroomId: null,
                date: "2026-01-15",
                transcript: "Legacy talk",
            },
        ]);

        assert.match(html, /Language Development Analysis - Year Overview/);
        assert.equal((html.match(/Language Development Analysis/g) || []).length, 1);
        assert.match(html, /Showing 3 of 3/);
        assert.match(html, /Sun talk/);
        assert.match(html, /Bug talk/);
        assert.match(html, /Legacy talk/);
        assert.match(html, /Download All/);
        assert.doesNotMatch(html, /By classroom/);
        assert.doesNotMatch(html, /Other recordings/);
        assert.doesNotMatch(html, /Owl talk/);
    });
});
