import { test, describe } from "node:test";
import assert from "node:assert/strict";

import {
    canToggleViewer,
    listedViewers,
    viewerRoleLabel,
    wordsBadgeLabel,
} from "../../src/lib/currentlyAccessing.js";
import { previewWriteProps } from "../../src/lib/viewAs.js";

describe("currently accessing helpers", () => {
    test("role labels distinguish lead and assistant teachers", () => {
        assert.equal(viewerRoleLabel("admin"), "Admin");
        assert.equal(viewerRoleLabel("parent"), "Parent");
        assert.equal(viewerRoleLabel("coach"), "Coach");
        assert.equal(viewerRoleLabel("teacher", "lead"), "Lead teacher");
        assert.equal(viewerRoleLabel("teacher", "assistant"), "Assistant teacher");
        assert.equal(viewerRoleLabel("teacher"), "Teacher");
    });

    test("words badge is on or off", () => {
        assert.equal(wordsBadgeLabel(true), "Words: on");
        assert.equal(wordsBadgeLabel(false), "Words: off");
    });

    test("only the controller can switch, and View as disables it", () => {
        assert.equal(canToggleViewer({ canSwitch: true, switchable: true, isPreviewing: false }), true);
        assert.equal(canToggleViewer({ canSwitch: false, switchable: true, isPreviewing: false }), false);
        assert.equal(canToggleViewer({ canSwitch: true, switchable: false, isPreviewing: false }), false);
        assert.equal(canToggleViewer({ canSwitch: true, switchable: true, isPreviewing: true }), false);
    });

    test("a parent home list labels the assistant and can switch that row alone", () => {
        const homeViewers = [
            { id: "lead", name: "Lead", role: "teacher", slot: "lead", switchable: true },
            { id: "asst", name: "Aide", role: "teacher", slot: "assistant", switchable: true },
        ];
        assert.deepEqual(
            homeViewers.map((viewer) => viewerRoleLabel(viewer.role, viewer.slot)),
            ["Lead teacher", "Assistant teacher"]
        );
        assert.equal(
            canToggleViewer({ canSwitch: true, switchable: homeViewers[1].switchable, isPreviewing: false }),
            true
        );
        const classroomAssistant = { role: "teacher", slot: "assistant", switchable: false };
        assert.equal(
            canToggleViewer({
                canSwitch: true,
                switchable: classroomAssistant.switchable,
                isPreviewing: false,
            }),
            false
        );
        assert.equal(viewerRoleLabel(classroomAssistant.role, classroomAssistant.slot), "Assistant teacher");
    });

    test("listedViewers drops admins so they are not named in the list", () => {
        const rows = listedViewers([
            { id: "a1", name: "Ada", role: "admin" },
            { id: "t1", name: "Riley", role: "teacher" },
            { id: "a2", name: "Omar", role: "admin" },
        ]);
        assert.deepEqual(rows.map((row) => row.name), ["Riley"]);
        assert.deepEqual(listedViewers(undefined), []);
    });

    test("previewWriteProps disable switches while previewing", () => {
        const preview = previewWriteProps(true);
        assert.equal(preview.disabled, true);
        assert.equal(preview["aria-disabled"], true);
        assert.deepEqual(previewWriteProps(false, { disabled: false }), { disabled: false });
    });
});
