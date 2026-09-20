import { test, describe } from "node:test";
import assert from "node:assert/strict";

import {
    viewerCanHideObservation,
    observationNoteText,
} from "../../src/utils/observationCard.js";

describe("viewerCanHideObservation", () => {
    test("prefers the server canHide flag", () => {
        assert.equal(viewerCanHideObservation({ canHide: true }), true);
        assert.equal(viewerCanHideObservation({ canHide: false, recordedById: "a", viewerId: "a" }), false);
    });

    test("falls back to matching recorder and viewer ids", () => {
        assert.equal(
            viewerCanHideObservation({ recordedById: "64b1", viewerId: "64b1" }),
            true
        );
        assert.equal(
            viewerCanHideObservation({ recordedById: "64b1", viewerId: "64b2" }),
            false
        );
        assert.equal(viewerCanHideObservation({ recordedById: "64b1" }), false);
        assert.equal(viewerCanHideObservation({}), false);
    });
});

describe("observationNoteText", () => {
    test("reads text from the shared note object", () => {
        assert.equal(observationNoteText({ text: "  Hello  " }), "Hello");
        assert.equal(observationNoteText("plain"), "plain");
        assert.equal(observationNoteText(null), "");
    });
});
