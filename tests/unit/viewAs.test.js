import { test, describe } from "node:test";
import assert from "node:assert/strict";

import {
    PREVIEW_ALLOWLIST,
    PREVIEW_CHILD_PATH,
    PREVIEW_ROLES,
    VIEW_AS_STORAGE_KEY,
    allowedPreviewRoles,
    canPreviewAs,
    clearStoredPreviewRole,
    isPreviewChildSegment,
    isPreviewRole,
    parentHomeRedirect,
    pathAllowedDuringPreview,
    pathAllowedForRole,
    previewWriteProps,
    readStoredPreviewRole,
    resolveEffectiveRole,
    roleDisplayName,
    routeAccess,
    shouldLoadLiveRoleData,
    shouldRedirectOnPreviewChange,
    writesAllowed,
    writeStoredPreviewRole,
} from "../../src/lib/viewAs.js";
import { sidebarNavLabels } from "../../src/lib/sidebarNav.js";

function memoryStorage(initial = {}) {
    const data = { ...initial };
    return {
        getItem: (key) => (key in data ? data[key] : null),
        setItem: (key, value) => {
            data[key] = String(value);
        },
        removeItem: (key) => {
            delete data[key];
        },
        _data: data,
    };
}

describe("viewAs allow-list", () => {
    test("admin may preview teacher, parent, and coach", () => {
        assert.deepEqual(allowedPreviewRoles("admin"), ["teacher", "parent", "coach"]);
        assert.equal(canPreviewAs("admin", "teacher"), true);
        assert.equal(canPreviewAs("admin", "parent"), true);
        assert.equal(canPreviewAs("admin", "coach"), true);
        assert.equal(canPreviewAs("admin", "admin"), false);
    });

    test("teacher may preview only parent", () => {
        assert.deepEqual(allowedPreviewRoles("teacher"), ["parent"]);
        assert.equal(canPreviewAs("teacher", "parent"), true);
        assert.equal(canPreviewAs("teacher", "coach"), false);
        assert.equal(canPreviewAs("teacher", "teacher"), false);
        assert.equal(canPreviewAs("teacher", "admin"), false);
    });

    test("coach and parent may preview only teacher", () => {
        assert.deepEqual(allowedPreviewRoles("coach"), ["teacher"]);
        assert.deepEqual(allowedPreviewRoles("parent"), ["teacher"]);
        assert.equal(canPreviewAs("coach", "teacher"), true);
        assert.equal(canPreviewAs("parent", "teacher"), true);
        assert.equal(canPreviewAs("coach", "parent"), false);
        assert.equal(canPreviewAs("parent", "coach"), false);
    });

    test("unknown roles get an empty list", () => {
        assert.deepEqual(allowedPreviewRoles("intern"), []);
        assert.deepEqual(allowedPreviewRoles(null), []);
        assert.equal(canPreviewAs(undefined, "teacher"), false);
    });

    test("isPreviewRole rejects admin and junk", () => {
        for (const role of PREVIEW_ROLES) assert.equal(isPreviewRole(role), true);
        assert.equal(isPreviewRole("admin"), false);
        assert.equal(isPreviewRole("alice"), false);
        assert.equal(Object.isFrozen(PREVIEW_ALLOWLIST), true);
    });
});

describe("viewAs effective role and persistence", () => {
    test("effectiveRole follows an allowed preview", () => {
        assert.equal(resolveEffectiveRole("admin", "teacher"), "teacher");
        assert.equal(resolveEffectiveRole("teacher", "parent"), "parent");
        assert.equal(resolveEffectiveRole("parent", "teacher"), "teacher");
    });

    test("disallowed preview is ignored", () => {
        assert.equal(resolveEffectiveRole("teacher", "coach"), "teacher");
        assert.equal(resolveEffectiveRole("teacher", "teacher"), "teacher");
        assert.equal(resolveEffectiveRole("admin", "admin"), "admin");
    });

    test("stored preview is kept when still allowed", () => {
        const storage = memoryStorage({ [VIEW_AS_STORAGE_KEY]: "parent" });
        assert.equal(readStoredPreviewRole("teacher", storage), "parent");
        assert.equal(storage._data[VIEW_AS_STORAGE_KEY], "parent");
    });

    test("invalid stored value is cleared", () => {
        const storage = memoryStorage({ [VIEW_AS_STORAGE_KEY]: "coach" });
        assert.equal(readStoredPreviewRole("teacher", storage), null);
        assert.equal(storage._data[VIEW_AS_STORAGE_KEY], undefined);
    });

    test("logout-equivalent clear drops the stored preview", () => {
        const storage = memoryStorage();
        writeStoredPreviewRole("teacher", storage);
        assert.equal(storage._data[VIEW_AS_STORAGE_KEY], "teacher");
        clearStoredPreviewRole(storage);
        assert.equal(storage._data[VIEW_AS_STORAGE_KEY], undefined);
        assert.equal(resolveEffectiveRole("parent", null), "parent");
    });
});

describe("viewAs writes and preview child path", () => {
    test("writes and live data load only when not previewing", () => {
        assert.equal(writesAllowed(false), true);
        assert.equal(writesAllowed(true), false);
        assert.equal(shouldLoadLiveRoleData(true), false);
        assert.equal(shouldLoadLiveRoleData(false), true);
        const locked = previewWriteProps(true, { className: "btn" });
        assert.equal(locked.disabled, true);
        assert.equal(locked["aria-disabled"], true);
        assert.match(locked.title, /preview/i);
        assert.deepEqual(previewWriteProps(false, { className: "btn" }), { className: "btn" });
    });

    test("reserved child preview segment", () => {
        assert.equal(isPreviewChildSegment("preview"), true);
        assert.equal(isPreviewChildSegment("abc123"), false);
        assert.equal(PREVIEW_CHILD_PATH, "/data/child/preview");
    });
});

describe("sidebar labels for view-as chrome", () => {
    test("admin previewing coach includes People → Teachers", () => {
        const labels = sidebarNavLabels("coach", { isPreviewing: true });
        assert.deepEqual(labels.primary, ["Dashboard"]);
        assert.deepEqual(labels.people, ["Teachers"]);
        assert.deepEqual(labels.afterPeople, []);
        assert.deepEqual(labels.footer, ["Settings", "About", "Logout"]);
        assert.ok(!labels.primary.concat(labels.people, labels.afterPeople).includes("Schools"));
        assert.ok(!labels.people.includes("Coaches"));
    });

    test("parent previewing teacher gets teacher entries", () => {
        const labels = sidebarNavLabels("teacher", { isPreviewing: true, user: { username: "pat" } });
        assert.ok(labels.primary.includes("Dashboard"));
        assert.deepEqual(labels.people, []);
        assert.ok(labels.afterPeople.includes("Home Environment Data"));
        assert.ok(labels.afterPeople.includes("Classrooms"));
        assert.ok(labels.afterPeople.includes("My Profile"));
        assert.ok(!labels.primary.includes("My Child's Data"));
        assert.ok(!labels.primary.includes("Home Environment Data"));
    });

    test("teacher previewing parent gets parent entries including child data", () => {
        const labels = sidebarNavLabels("parent", { isPreviewing: true });
        assert.deepEqual(labels.primary, ["Dashboard", "Home Environment Data", "My Child's Data"]);
        assert.ok(!labels.afterPeople.includes("Classrooms"));
        assert.ok(!labels.afterPeople.includes("My Profile"));
        assert.deepEqual(labels.footer, ["Settings", "About", "Logout"]);
    });

    test("real parent without a child has no My Child's Data item", () => {
        const labels = sidebarNavLabels("parent", { isPreviewing: false, user: { role: "parent" } });
        assert.deepEqual(labels.primary, ["Dashboard", "Home Environment Data"]);
    });

    test("admin not previewing keeps people and schools", () => {
        const labels = sidebarNavLabels("admin");
        assert.deepEqual(labels.people, ["Coaches", "Teachers"]);
        assert.ok(labels.afterPeople.includes("Schools"));
        assert.ok(labels.afterPeople.includes("Classrooms"));
    });
});

describe("viewAs route helpers", () => {
    test("preview opens only that role's safe pages", () => {
        assert.equal(pathAllowedDuringPreview("teacher", "/data"), true);
        assert.equal(pathAllowedDuringPreview("teacher", "/profile"), true);
        assert.equal(pathAllowedDuringPreview("teacher", "/home"), true);
        assert.equal(pathAllowedDuringPreview("teacher", "/schools"), false);
        assert.equal(pathAllowedDuringPreview("teacher", "/classrooms"), false);
        assert.equal(pathAllowedDuringPreview("parent", "/home/recording"), true);
        assert.equal(pathAllowedDuringPreview("parent", PREVIEW_CHILD_PATH), true);
        assert.equal(pathAllowedDuringPreview("parent", "/teachers"), false);
        assert.equal(pathAllowedDuringPreview("parent", "/classrooms"), false);
        assert.equal(pathAllowedDuringPreview("coach", "/home"), true);
        assert.equal(pathAllowedDuringPreview("coach", "/teachers"), true);
        assert.equal(pathAllowedDuringPreview("coach", "/teachers/add"), false);
        assert.equal(pathAllowedDuringPreview("coach", "/data"), false);
    });

    test("exit from a preview-only page returns home", () => {
        assert.equal(
            shouldRedirectOnPreviewChange({
                pathname: "/home/recording",
                nextPreviewRole: null,
                actualRole: "teacher",
            }),
            true
        );
        assert.equal(
            shouldRedirectOnPreviewChange({
                pathname: "/home",
                nextPreviewRole: null,
                actualRole: "teacher",
            }),
            false
        );
        assert.equal(
            shouldRedirectOnPreviewChange({
                pathname: "/schools",
                nextPreviewRole: "parent",
                actualRole: "admin",
            }),
            true
        );
    });

    test("actual-role path gates match the app shell", () => {
        assert.equal(pathAllowedForRole("admin", "/schools"), true);
        assert.equal(pathAllowedForRole("teacher", "/schools"), false);
        assert.equal(pathAllowedForRole("parent", "/data"), false);
        assert.equal(pathAllowedForRole("teacher", "/data"), true);
        assert.equal(pathAllowedForRole("parent", "/home/recording"), true);
        assert.equal(pathAllowedForRole("coach", "/home/recording"), false);
        assert.equal(pathAllowedForRole("coach", "/teachers"), true);
        assert.equal(pathAllowedForRole("coach", "/teachers/add"), false);
        assert.equal(pathAllowedForRole("coach", "/teachers/edit/1"), false);
        assert.equal(pathAllowedForRole("admin", "/teachers"), true);
    });

    test("ProtectedRoute access uses effective role", () => {
        assert.equal(routeAccess({ effectiveRole: "parent", requiredRole: "parent" }), "allow");
        assert.equal(routeAccess({ effectiveRole: "teacher", requiredRole: "parent" }), "deny");
        assert.equal(routeAccess({ effectiveRole: "teacher", excludeRoles: ["parent", "coach"] }), "allow");
        assert.equal(routeAccess({ effectiveRole: "parent", excludeRoles: ["parent", "coach"] }), "deny");
        assert.equal(routeAccess({ effectiveRole: "admin", requiredRole: "admin" }), "allow");
        assert.equal(routeAccess({ effectiveRole: "coach", requiredRole: ["admin", "coach"] }), "allow");
        assert.equal(routeAccess({ effectiveRole: "teacher", requiredRole: ["admin", "coach"] }), "deny");
    });

    test("parent home redirect is skipped while previewing", () => {
        assert.equal(
            parentHomeRedirect({
                effectiveRole: "parent",
                isPreviewing: false,
                primaryChildId: "c1",
            }),
            "/data/child/c1"
        );
        assert.equal(
            parentHomeRedirect({
                effectiveRole: "parent",
                isPreviewing: true,
                primaryChildId: "c1",
            }),
            null
        );
    });

    test("role labels are the product names", () => {
        assert.equal(roleDisplayName("teacher"), "Teacher");
        assert.equal(roleDisplayName("parent"), "Parent");
        assert.equal(roleDisplayName("coach"), "Coach");
    });
});
