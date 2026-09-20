import { test, describe } from "node:test";
import assert from "node:assert/strict";

import {
    COACH_TEACHER_SLOT_LIMIT,
    countCoachTeacherSlots,
} from "../../src/lib/coachTeacherSlots.js";
import { roleHasCapability } from "../../src/lib/permissions.js";
import { sidebarNavLabels } from "../../src/lib/sidebarNav.js";

describe("coach teacher slots helper", () => {
    test("limit is 20", () => {
        assert.equal(COACH_TEACHER_SLOT_LIMIT, 20);
    });

    test("assigned plus distinct pending emails", () => {
        assert.equal(
            countCoachTeacherSlots({
                assigned: [{ email: "a@x.com" }],
                pending: [{ email: "b@x.com" }, { email: "A@x.com" }],
            }),
            2
        );
    });
});

describe("coach people nav", () => {
    test("coach people items are Teachers only", () => {
        const labels = sidebarNavLabels("coach");
        assert.deepEqual(labels.people, ["Teachers"]);
        assert.ok(!labels.people.includes("Coaches"));
    });

    test("coach can invite teachers but cannot manage them", () => {
        assert.equal(roleHasCapability("coach", "inviteTeachers"), true);
        assert.equal(roleHasCapability("coach", "manageTeachers"), false);
        assert.equal(roleHasCapability("teacher", "inviteTeachers"), false);
    });
});
