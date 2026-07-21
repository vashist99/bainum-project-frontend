/**
 * Pure helpers for the home talk sharing panel (parents) and the staff
 * home view gate on ChildDataPage. Split from the components so they
 * can be unit-tested without loading Vite-only modules (lib/axios.js).
 */

export const HOME_ACCESS_STATUS = {
    GRANTED: "granted",
    PENDING: "pending",
    NONE: "none",
};

/** Staff effective status from GET /api/home-access/child/:childId. */
export function staffHomeStatusFrom(state) {
    const status = state?.status;
    return status === HOME_ACCESS_STATUS.GRANTED || status === HOME_ACCESS_STATUS.PENDING
        ? status
        : HOME_ACCESS_STATUS.NONE;
}

/** True when the staff member may see home talk data. */
export function staffHasHomeAccess(state) {
    return staffHomeStatusFrom(state) === HOME_ACCESS_STATUS.GRANTED;
}

/**
 * True when the staff member holds the admin-gated transcript tier. The
 * parent's grant alone covers visualizations only; the API strips
 * transcript text unless an admin set transcriptAccess on the grant.
 */
export function staffHasTranscriptAccess(state) {
    return staffHasHomeAccess(state) && state?.transcriptAccess === true;
}

/**
 * Active grants for the admin management panel (admin responses from
 * GET /api/home-access/child/:childId include them).
 */
export function adminGrantRows(state) {
    return Array.isArray(state?.grants) ? state.grants : [];
}

export function allStaffGrantActive(state) {
    return state?.allStaff?.status === "active";
}

export function classroomGrantRows(state) {
    return Array.isArray(state?.classrooms) ? state.classrooms : [];
}

/**
 * Pending staff requests to show in the parent panel. Hidden while an
 * all-staff grant is active — every staff member already has access,
 * so the requests are moot.
 */
export function visiblePendingRequests(state) {
    if (!state || allStaffGrantActive(state)) return [];
    return Array.isArray(state.pendingRequests) ? state.pendingRequests : [];
}
