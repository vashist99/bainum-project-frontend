/**
 * Central copy for contextual "i" info tips, distilled from the User Manual
 * (docs/stakeholder-deliverables-v2/src/user-manual.md). Components render
 * this text through <InfoTip> — update wording here, never inline in JSX.
 *
 * Keys are namespaced: `nav.*` sidebar items, `page.*` page headers,
 * `control.*` key actions/panels.
 */
export const HELP_TEXT = Object.freeze({
    // --- Sidebar navigation ---
    "nav.dashboard":
        "Your landing page. Shows quick actions and cards for every classroom you can open.",
    "nav.people":
        "Directory of the people on the platform: teachers, children, and coaches.",
    "nav.teachers":
        "View and manage teacher profiles. Filter by school, search, add teachers, or send account invitations.",
    "nav.children":
        "Every child you supervise. Open a child to see their profile, notes, and home talk data page. Classroom talk lives on the classroom homepage.",
    "nav.coaches":
        "Coach accounts. Coaches register themselves; assign each coach the teachers they oversee and control their classroom data access, including admin-gated transcripts.",
    "nav.schools":
        "Organizational sites. Teachers and children carry a school affiliation used for filtering and classroom enrollment rules.",
    "nav.classrooms":
        "All classrooms. Open one to see its homepage: roster, parents, notes, transcripts, and cohort stats.",
    "nav.homeRecording":
        "Record or upload home audio for your child. Choose a location and activity, then review the transcript when it is ready.",
    "nav.myChildData":
        "Your child's home talk only: developmental charts, transcripts (newest first), recording history, and notes.",
    "nav.myProfile":
        "Your teacher profile with your assessments and transcript cards.",
    "nav.settings":
        "Account preferences, including the voice wake feature and other options.",

    // --- Page headers ---
    "page.classrooms":
        "All classrooms across every center. Cards are titled by the lead teacher; open a classroom to manage its roster or review its talk data.",
    "page.teachers":
        "Teacher directory. Add teachers, send invitations, filter by school, and open a teacher to edit their profile.",
    "page.coaches":
        "Coaches join the platform on their own — no invitation needed. Assign each coach the teachers they oversee; classroom access still requires teacher approval, and transcript access is admin-gated.",

    // --- Key actions / panels ---
    "control.viewMode":
        "Switch between tile cards and a sortable table. In table view, click a column header to sort; your choice is remembered on this device.",
    "control.createClassroom":
        "Create a classroom. Administrators assign any lead teacher; a teacher who creates one becomes its lead automatically.",
    "control.recordActivity":
        "Record up to 60 minutes in the browser or upload an audio file. Pick a location and activity, then review and accept the transcript before it counts as a saved assessment.",
    "control.homeSharing":
        "Home talk is private to your family by default. Grants share visualizations only — transcript text stays admin-gated — and you can revoke any grant at any time.",
    "control.homeTranscriptAccess":
        "Admin-only. A parent's grant shares visualizations only; enable this tier to also expose the child's home transcript text to that staff member.",
});

/** Look up help copy for a key; returns null for unknown keys. */
export function helpFor(key) {
    return HELP_TEXT[key] ?? null;
}
