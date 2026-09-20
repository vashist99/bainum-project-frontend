export function viewerRoleLabel(role, slot) {
    if (role === "admin") return "Admin";
    if (role === "parent") return "Parent";
    if (role === "coach") return "Coach";
    if (slot === "lead") return "Lead teacher";
    if (slot === "assistant") return "Assistant teacher";
    return "Teacher";
}

/** Admins are summarized as a group, never listed by name. */
export function listedViewers(viewers) {
    return (viewers || []).filter((viewer) => viewer?.role !== "admin");
}

export function wordsBadgeLabel(transcripts) {
    return transcripts ? "Words: on" : "Words: off";
}

export function canToggleViewer({ canSwitch, switchable, isPreviewing }) {
    return Boolean(canSwitch && switchable && !isPreviewing);
}
