import { test, describe } from "node:test";
import assert from "node:assert/strict";

import {
    ACTIVITY_ACTION_LABELS,
    actionLabel,
    activityDetailText,
    formatActivityRow,
    formatActivityTimestamp,
} from "../../src/utils/activityLogFormat.js";

// Mirror of backend models/ActivityLog.js ACTIVITY_ACTIONS — keep in sync.
const BACKEND_ACTIONS = [
    "login",
    "recording-uploaded",
    "transcript-accepted",
    "transcript-rejected",
    "classroom-created",
    "classroom-updated",
    "classroom-deleted",
    "roster-parents-added",
    "roster-child-removed",
    "coach-access-requested",
    "coach-grant-approved",
    "coach-grant-denied",
    "coach-grant-revoked",
    "home-access-requested",
    "profile-updated",
    "account-deleted",
];

describe("activityLogFormat — action labels", () => {
    test("every backend action has a friendly label", () => {
        for (const action of BACKEND_ACTIONS) {
            const label = ACTIVITY_ACTION_LABELS[action];
            assert.equal(typeof label, "string", `missing label for ${action}`);
            assert.ok(label.trim().length > 0);
        }
    });

    test("no orphan labels for actions the backend does not emit", () => {
        for (const key of Object.keys(ACTIVITY_ACTION_LABELS)) {
            assert.ok(BACKEND_ACTIONS.includes(key), `orphan label ${key}`);
        }
    });

    test("unknown actions fall back to the raw value", () => {
        assert.equal(actionLabel("mystery-action"), "mystery-action");
        assert.equal(actionLabel(undefined), "Unknown");
    });
});

describe("activityLogFormat — detail and timestamp", () => {
    test("combines detail and target label", () => {
        assert.equal(
            activityDetailText({ detail: "Approved a coach access request", targetLabel: "Room A" }),
            "Approved a coach access request — Room A"
        );
        assert.equal(activityDetailText({ detail: "", targetLabel: "Room A" }), "Room A");
        assert.equal(activityDetailText({ detail: "Signed in", targetLabel: "" }), "Signed in");
        assert.equal(activityDetailText({}), "—");
    });

    test("invalid timestamps render a dash", () => {
        assert.equal(formatActivityTimestamp("garbage"), "—");
        assert.equal(formatActivityTimestamp(null), "—");
    });

    test("valid timestamps produce a locale string", () => {
        const out = formatActivityTimestamp("2026-03-05T14:30:00.000Z");
        assert.notEqual(out, "—");
        assert.ok(out.includes("2026"));
    });
});

describe("activityLogFormat — formatActivityRow", () => {
    test("shapes an API entry for the table", () => {
        const row = formatActivityRow({
            id: "abc",
            actorName: "Ms. Lee",
            actorRole: "teacher",
            action: "classroom-created",
            detail: "",
            targetLabel: "Sunflowers",
            createdAt: "2026-03-05T14:30:00.000Z",
        });
        assert.equal(row.id, "abc");
        assert.equal(row.userName, "Ms. Lee");
        assert.equal(row.role, "Teacher");
        assert.equal(row.activity, "Classroom created");
        assert.equal(row.detail, "Sunflowers");
    });

    test("handles missing fields gracefully", () => {
        const row = formatActivityRow({});
        assert.equal(row.userName, "Unknown user");
        assert.equal(row.role, "—");
        assert.equal(row.timestamp, "—");
        assert.equal(row.detail, "—");
    });
});
