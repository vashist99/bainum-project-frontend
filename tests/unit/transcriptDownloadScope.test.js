import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

function source(relativePath) {
    return readFileSync(new URL(relativePath, import.meta.url), "utf8");
}

describe("transcript downloads stay on the full set", () => {
    test("classroom Excel uses the loaded transcripts, not the open page", () => {
        const page = source("../../src/pages/ClassroomHomePage.jsx");
        assert.match(page, /buildClassroomWorkbook\(classroom\?\.name \|\| "Classroom", transcripts\)/);
    });

    test("teacher profile Excel uses every transcript with content", () => {
        const page = source("../../src/pages/TeacherProfilePage.jsx");
        assert.match(page, /const transcriptsWithContent = assessments\.filter/);
        assert.match(page, /buildTranscriptsWorkbook\(teacherName \|\| "Classroom Talk", sorted,/);
    });

    test("child home download walks every home transcript", () => {
        const page = source("../../src/pages/ChildDataPage.jsx");
        assert.match(page, /const transcriptsWithDates = viewAssessments/);
        assert.doesNotMatch(page, /pageSlice|useTranscriptPage/);
    });
});