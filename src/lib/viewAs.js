/**
 * View as — generic role preview (chrome only).
 * Not a backend capability and not user impersonation.
 */

export const VIEW_AS_STORAGE_KEY = "cattac.previewRole";

export const PREVIEW_ROLES = Object.freeze(["teacher", "parent", "coach"]);

export const PREVIEW_CHILD_SEGMENT = "preview";

export const PREVIEW_CHILD_PATH = "/data/child/preview";

export const PREVIEW_WRITE_HINT = "Not available in a general preview";

export const PREVIEW_ALLOWLIST = Object.freeze({
    admin: Object.freeze(["teacher", "parent", "coach"]),
    coach: Object.freeze(["teacher"]),
    parent: Object.freeze(["teacher"]),
    teacher: Object.freeze(["parent"]),
});

const ROLE_LABELS = Object.freeze({
    admin: "Admin",
    teacher: "Teacher",
    parent: "Parent",
    coach: "Coach",
});

export function isPreviewRole(value) {
    return PREVIEW_ROLES.includes(value);
}

export function allowedPreviewRoles(role) {
    const allowed = PREVIEW_ALLOWLIST[role];
    return Array.isArray(allowed) ? [...allowed] : [];
}

export function canPreviewAs(role, target) {
    if (!role || !isPreviewRole(target) || target === role) return false;
    return allowedPreviewRoles(role).includes(target);
}

export function roleDisplayName(role) {
    return ROLE_LABELS[role] || "";
}

export function resolveEffectiveRole(actualRole, previewRole) {
    if (previewRole && canPreviewAs(actualRole, previewRole)) return previewRole;
    return actualRole ?? null;
}

export function writesAllowed(isPreviewing) {
    return !isPreviewing;
}

export function shouldLoadLiveRoleData(isPreviewing) {
    return !isPreviewing;
}

export function previewWriteProps(isPreviewing, extra = {}) {
    if (!isPreviewing) return extra;
    return {
        ...extra,
        disabled: true,
        title: PREVIEW_WRITE_HINT,
        "aria-disabled": true,
    };
}

export function isPreviewChildSegment(childId) {
    return String(childId || "") === PREVIEW_CHILD_SEGMENT;
}

function getStorage(storage) {
    if (storage) return storage;
    try {
        return typeof sessionStorage !== "undefined" ? sessionStorage : null;
    } catch {
        return null;
    }
}

export function readStoredPreviewRole(actualRole, storage) {
    const store = getStorage(storage);
    if (!store) return null;
    let raw = null;
    try {
        raw = store.getItem(VIEW_AS_STORAGE_KEY);
    } catch {
        return null;
    }
    if (!canPreviewAs(actualRole, raw)) {
        clearStoredPreviewRole(store);
        return null;
    }
    return raw;
}

export function writeStoredPreviewRole(role, storage) {
    const store = getStorage(storage);
    if (!store || !isPreviewRole(role)) return;
    try {
        store.setItem(VIEW_AS_STORAGE_KEY, role);
    } catch {
        /* private mode / quota */
    }
}

export function clearStoredPreviewRole(storage) {
    const store = getStorage(storage);
    if (!store) return;
    try {
        store.removeItem(VIEW_AS_STORAGE_KEY);
    } catch {
        /* ignore */
    }
}

function normalizePath(pathname) {
    if (!pathname) return "/";
    const path = String(pathname).split("?")[0];
    if (path.length > 1 && path.endsWith("/")) return path.slice(0, -1);
    return path || "/";
}

export function pathAllowedDuringPreview(previewRole, pathname) {
    if (!isPreviewRole(previewRole)) return false;
    const path = normalizePath(pathname);
    if (path === "/home" || path === "/settings" || path === "/about" || path.startsWith("/about")) {
        return true;
    }
    if (previewRole === "teacher") {
        return path === "/data" || path === "/profile";
    }
    if (previewRole === "parent") {
        return path === "/home/recording" || path === PREVIEW_CHILD_PATH;
    }
    if (previewRole === "coach") {
        return path === "/teachers";
    }
    return false;
}

export function pathAllowedForRole(role, pathname) {
    const path = normalizePath(pathname);
    if (path === "/home" || path === "/settings" || path === "/about" || path.startsWith("/about")) {
        return true;
    }
    if (path === "/home/recording") return role === "parent";
    if (path === "/classrooms") return role === "admin";
    if (path === "/classrooms/create") return role === "admin" || role === "teacher";
    if (path.startsWith("/classrooms/")) return true;
    if (path === "/schools" || path.startsWith("/schools/") || path.startsWith("/centers")) {
        return role === "admin";
    }
    if (path === "/coaches") return role === "admin";
    if (path === "/teachers") return role === "admin" || role === "coach";
    if (path === "/teachers/add" || path.startsWith("/teachers/edit/")) {
        return role === "admin";
    }
    if (path.startsWith("/teachers/")) return true;
    if (path === "/profile") return role === "teacher";
    if (path === "/data" || path === "/data/add") return role === "admin" || role === "teacher";
    if (path.startsWith("/data/child/")) return true;
    if (path.startsWith("/children/")) return role === "admin" || role === "teacher";
    return true;
}

export function shouldRedirectOnPreviewChange({ pathname, nextPreviewRole, actualRole }) {
    if (nextPreviewRole) {
        return !pathAllowedDuringPreview(nextPreviewRole, pathname);
    }
    return !pathAllowedForRole(actualRole, pathname);
}

export function routeAccess({ effectiveRole, requiredRole = null, excludeRoles = [] }) {
    if (excludeRoles.length > 0 && excludeRoles.includes(effectiveRole)) return "deny";
    if (requiredRole) {
        const allowed = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
        if (!allowed.includes(effectiveRole)) return "deny";
    }
    return "allow";
}

export function parentHomeRedirect({
    effectiveRole,
    isPreviewing,
    primaryChildId,
    skipParentHomeRedirect = false,
    requiredRole = null,
    excludeRoles = [],
}) {
    if (isPreviewing) return null;
    if (effectiveRole !== "parent" || !primaryChildId) return null;
    if (skipParentHomeRedirect || requiredRole || excludeRoles.length > 0) return null;
    return `/data/child/${primaryChildId}`;
}
