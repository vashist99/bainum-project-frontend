import { test, describe } from "node:test";
import assert from "node:assert/strict";

import {
    viewerCanHideObservation,
    listObservationComments,
    formatObservationCommentsCell,
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

describe("listObservationComments", () => {
    test("orders comments oldest first and falls back to a legacy note", () => {
        const comments = listObservationComments({
            observationComments: [
                { text: "Later", authorName: "Ada", createdAt: "2026-03-02T15:00:00.000Z" },
                { text: "Earlier", authorName: "Riley", createdAt: "2026-03-01T15:00:00.000Z" },
            ],
        });
        assert.deepEqual(
            comments.map((comment) => comment.text),
            ["Earlier", "Later"]
        );

        const legacy = listObservationComments({
            observationNote: {
                text: "Old note",
                authorName: "Riley",
                updatedAt: "2026-03-01T15:00:00.000Z",
            },
        });
        assert.equal(legacy[0].text, "Old note");
        assert.equal(legacy[0].authorName, "Riley");
        assert.equal(listObservationComments(null).length, 0);
    });

    test("formats a comment cell with author, time, and text", () => {
        const cell = formatObservationCommentsCell({
            observationComments: [
                {
                    text: "First look",
                    authorName: "Riley",
                    createdAt: "2026-03-01T15:00:00.000Z",
                },
            ],
        });
        assert.match(cell, /Riley/);
        assert.match(cell, /First look/);
        assert.equal(formatObservationCommentsCell({}).length, 0);
    });
});
