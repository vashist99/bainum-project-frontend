/**
 * Frontend mirror of the backend role→capability matrix
 * (backend/lib/permissions.js). Drives sidebar entries, protected
 * routes, and page affordances. Unknown capabilities/roles fail closed.
 */

export const CAPABILITIES = Object.freeze({
    manageSchools: ["admin"],
    manageTeachers: ["admin"],
    manageChildren: ["admin", "teacher"],
    manageCoaches: ["admin"],
    inviteParents: ["admin", "teacher"],
    inviteTeachers: ["admin"],
    uploadClassroomRecording: ["teacher"],
    uploadHomeRecording: ["parent"],
    approveCoachAggregateAccess: ["admin", "teacher"],
    grantCoachTranscriptAccess: ["admin"],
    grantHomeTranscriptAccess: ["admin"],
    requestCoachClassroomAccess: ["coach"],
});

export function roleHasCapability(role, capability) {
    const allowed = CAPABILITIES[capability];
    if (!Array.isArray(allowed)) return false;
    return allowed.includes(role);
}

export function userCan(user, capability) {
    return roleHasCapability(user?.role, capability);
}
