export const COACH_TEACHER_SLOT_LIMIT = 20;

/**
 * Assigned teachers plus pending invite emails that are not already assigned.
 * Mirrors backend/lib/coachTeacherSlots.js countCoachTeacherSlots.
 */
export function countCoachTeacherSlots({ assigned = [], pending = [] }) {
    const assignedEmails = new Set(
        assigned
            .map((row) => String(row.email || row).toLowerCase().trim())
            .filter(Boolean)
    );
    const extraPending = pending.filter((row) => {
        const email = String(row.email || row).toLowerCase().trim();
        return email && !assignedEmails.has(email);
    });
    return assignedEmails.size + extraPending.length;
}
