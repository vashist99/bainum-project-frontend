import axios from "./axios";

/**
 * Client for /api/activity-log — the admin-only teacher/coach activity
 * feed shown in Settings → Activities log.
 */

/**
 * @param {object} params  { page, limit, actorId, role, action, from, to }
 * @returns {Promise<{ entries: Array, page: number, totalPages: number, total: number }>}
 */
export async function fetchActivityLog(params = {}) {
    const query = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
        if (value != null && value !== "") query.set(key, value);
    }
    const suffix = query.toString() ? `?${query.toString()}` : "";
    const response = await axios.get(`/api/activity-log${suffix}`);
    return response.data;
}

/**
 * Transcript rejection is a client-side discard — nothing is persisted —
 * so the recording modals self-report it here. Fire-and-forget: the
 * backend silently ignores non-teacher/coach callers, and failures must
 * never disturb the discard UX.
 */
export function reportTranscriptRejected(targetLabel = "") {
    axios.post("/api/activity-log/transcript-rejected", { targetLabel }).catch(() => {});
}
