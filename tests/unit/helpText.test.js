import { test, describe } from "node:test";
import assert from "node:assert/strict";

import { HELP_TEXT, helpFor } from "../../src/lib/helpText.js";

// Keys that components reference. If a key is renamed in helpText.js this
// list must be updated together with the placement, keeping tips visible.
const EXPECTED_KEYS = [
    "nav.dashboard",
    "nav.people",
    "nav.teachers",
    "nav.coaches",
    "nav.schools",
    "nav.classrooms",
    "nav.home",
    "nav.homeRecording",
    "nav.myChildData",
    "nav.myProfile",
    "nav.settings",
    "nav.about",
    "page.classrooms",
    "page.teachers",
    "page.teachersCoach",
    "page.coaches",
    "page.about",
    "control.viewMode",
    "control.createClassroom",
    "control.recordActivity",
    "control.homeSharing",
    "control.homeTranscriptAccess",
    "control.activityLog",
    "control.termsAcceptance",
    "control.deleteAccount",
    "control.transcriptPii",
    "control.viewAs",
    "control.viewAsBanner",
];

describe("helpText map integrity", () => {
    test("every expected key exists with a non-empty string", () => {
        for (const key of EXPECTED_KEYS) {
            const value = HELP_TEXT[key];
            assert.equal(typeof value, "string", `${key} should be a string`);
            assert.ok(value.trim().length > 0, `${key} should be non-empty`);
        }
    });

    test("map has no unexpected empty or non-string entries", () => {
        for (const [key, value] of Object.entries(HELP_TEXT)) {
            assert.equal(typeof value, "string", `${key} should be a string`);
            assert.ok(value.trim().length > 0, `${key} should be non-empty`);
        }
    });

    test("map is frozen and helpFor resolves known/unknown keys", () => {
        assert.ok(Object.isFrozen(HELP_TEXT));
        assert.equal(helpFor("nav.teachers"), HELP_TEXT["nav.teachers"]);
        assert.equal(helpFor("nope.missing"), null);
    });

    test("copy never references the old platform name", () => {
        for (const [key, value] of Object.entries(HELP_TEXT)) {
            assert.ok(!/bainum/i.test(value), `${key} should not mention Bainum`);
        }
    });
});
