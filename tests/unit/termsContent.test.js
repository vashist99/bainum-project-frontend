import { test, describe } from "node:test";
import assert from "node:assert/strict";

import {
    DELETION_CLAUSE,
    TERMS_SECTIONS,
    TERMS_VERSION,
} from "../../src/lib/termsContent.js";

describe("termsContent", () => {
    test("deletion clause is substantive and states preservation", () => {
        assert.equal(typeof DELETION_CLAUSE, "string");
        assert.ok(DELETION_CLAUSE.length > 100, "clause should be a full statement");
        assert.match(DELETION_CLAUSE, /preserved/i);
        assert.match(DELETION_CLAUSE, /not deleted with your account/i);
    });

    test("full terms cover all thirteen sections plus draft status", () => {
        assert.ok(Object.isFrozen(TERMS_SECTIONS));
        assert.equal(TERMS_SECTIONS.length, 14);
        for (const section of TERMS_SECTIONS) {
            assert.equal(typeof section.heading, "string");
            assert.ok(section.body.trim().length > 0, `${section.heading} body empty`);
        }
        const headings = TERMS_SECTIONS.map((s) => s.heading);
        for (const n of Array.from({ length: 13 }, (_, i) => i + 1)) {
            assert.ok(
                headings.some((h) => h.startsWith(`${n}.`)),
                `missing section ${n}`
            );
        }
    });

    test("retention section embeds the deletion clause verbatim", () => {
        const retention = TERMS_SECTIONS.find((s) => s.heading.startsWith("8."));
        assert.ok(retention.body.includes(DELETION_CLAUSE));
    });

    test("platform naming is CATTAC; Bainum appears only as the Foundation", () => {
        for (const section of TERMS_SECTIONS) {
            const matches = section.body.match(/Bainum[^,.;]*/g) || [];
            for (const m of matches) {
                assert.match(m, /^Bainum Foundation/, `unexpected Bainum reference: "${m}"`);
            }
        }
        assert.ok(
            TERMS_SECTIONS.some((s) => /CATTAC platform/i.test(s.body)),
            "terms should name the CATTAC platform"
        );
        assert.ok(TERMS_VERSION.trim().length > 0);
    });
});
