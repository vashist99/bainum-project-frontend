import axios from "./axios";

/**
 * Client for the coach role APIs:
 * - /api/coaches             admin coach management + coach dashboard + grants
 * - /api/auth/register-coach open coach self-registration (no invitation)
 */

// --- Admin: coach management ---

export async function fetchCoaches() {
    const response = await axios.get("/api/coaches");
    return response.data;
}

export async function assignTeacher(coachId, teacherId, { confirmReassign = false } = {}) {
    const response = await axios.post(`/api/coaches/${coachId}/teachers/${teacherId}`, { confirmReassign });
    return response.data;
}

export async function unassignTeacher(coachId, teacherId) {
    const response = await axios.delete(`/api/coaches/${coachId}/teachers/${teacherId}`);
    return response.data;
}

// --- Public: open self-registration ---

export async function registerCoach({ name, email, username, password, termsAccepted }) {
    const response = await axios.post("/api/auth/register-coach", {
        name,
        email,
        username,
        password,
        termsAccepted,
    });
    return response.data;
}

// --- Coach: dashboard + grant lifecycle ---

export async function fetchCoachOverview() {
    const response = await axios.get("/api/coaches/me/overview");
    return response.data;
}

export async function requestClassroomAccess(classroomId) {
    const response = await axios.post("/api/coaches/grants/request", { classroomId });
    return response.data;
}

// --- Teacher: pending coach requests ---

export async function fetchPendingCoachRequests() {
    const response = await axios.get("/api/coaches/grants/pending-for-teacher");
    return response.data;
}

export async function approveCoachGrant(grantId) {
    const response = await axios.patch(`/api/coaches/grants/${grantId}/approve`);
    return response.data;
}

export async function denyCoachGrant(grantId) {
    const response = await axios.patch(`/api/coaches/grants/${grantId}/deny`);
    return response.data;
}

export async function revokeCoachGrant(grantId) {
    const response = await axios.patch(`/api/coaches/grants/${grantId}/revoke`);
    return response.data;
}

// --- Admin: transcript tier ---

export async function setCoachTranscriptAccess(grantId, enabled) {
    const response = await axios.patch(`/api/coaches/grants/${grantId}/transcript-access`, { enabled });
    return response.data;
}
