/**
 * Pure formatting helpers for the admin Activities log table. Kept out of
 * the component so labels and row shaping are unit-testable.
 */

/** Must cover every action in backend models/ActivityLog.js ACTIVITY_ACTIONS. */
export const ACTIVITY_ACTION_LABELS = Object.freeze({
    "login": "Signed in",
    "recording-uploaded": "Recording uploaded",
    "transcript-accepted": "Transcript accepted",
    "transcript-rejected": "Transcript rejected",
    "classroom-created": "Classroom created",
    "classroom-updated": "Classroom updated",
    "classroom-deleted": "Classroom deleted",
    "roster-parents-added": "Parents added to roster",
    "roster-child-removed": "Child removed from roster",
    "coach-access-requested": "Coach access requested",
    "coach-grant-approved": "Coach access approved",
    "coach-grant-denied": "Coach access denied",
    "coach-grant-revoked": "Coach access revoked",
    "home-access-requested": "Home view access requested",
    "profile-updated": "Profile updated",
});

export const ROLE_LABELS = Object.freeze({
    teacher: "Teacher",
    coach: "Coach",
});

export function actionLabel(action) {
    return ACTIVITY_ACTION_LABELS[action] ?? action ?? "Unknown";
}

export function formatActivityTimestamp(value) {
    // new Date(null) is the epoch, not invalid — reject nullish explicitly.
    if (value == null || value === "") return "—";
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return "—";
    return date.toLocaleString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
    });
}

/** Combine detail and target label into one readable cell. */
export function activityDetailText(entry) {
    const detail = (entry?.detail || "").trim();
    const target = (entry?.targetLabel || "").trim();
    if (detail && target) return `${detail} — ${target}`;
    return detail || target || "—";
}

/** Shape one API entry into the strings the table renders. */
export function formatActivityRow(entry) {
    return {
        id: entry?.id ?? entry?._id ?? "",
        timestamp: formatActivityTimestamp(entry?.createdAt),
        userName: entry?.actorName || "Unknown user",
        role: ROLE_LABELS[entry?.actorRole] ?? entry?.actorRole ?? "—",
        activity: actionLabel(entry?.action),
        detail: activityDetailText(entry),
    };
}
