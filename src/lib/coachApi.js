import axios from "./axios";

/**
 * Client for the coach role APIs:
 * - /api/coaches            admin coach management + coach dashboard + grants
 * - /api/coach-invitations  admin-sent coach invitations
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

// --- Admin: coach invitations ---

export async function sendCoachInvitation({ email, firstName, lastName }) {
    const response = await axios.post("/api/coach-invitations/send", { email, firstName, lastName });
    return response.data;
}

export async function fetchCoachInvitations() {
    const response = await axios.get("/api/coach-invitations/list");
    return response.data;
}

export async function verifyCoachInvitation(token) {
    const response = await axios.get(`/api/coach-invitations/verify/${token}`);
    return response.data;
}

export async function registerCoach({ password, username, invitationToken }) {
    const response = await axios.post("/api/auth/register-coach", { password, username, invitationToken });
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
