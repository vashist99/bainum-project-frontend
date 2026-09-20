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
        "Directory of the people on the platform: teachers and coaches.",
    "nav.teachers":
        "Teachers you can work with. Administrators manage the full directory; coaches see only the teachers they supervise and can invite up to 20.",
    "nav.home":
        "The home recordings of every child you supervise. Open a child to see their profile and home talk data. Classroom talk lives on the classroom homepage.",
    "nav.coaches":
        "Coach accounts. Coaches register themselves; assign each coach the teachers they oversee and control their classroom data access, including admin-gated transcripts.",
    "nav.schools":
        "Organizational sites. Teachers and children carry a school affiliation used for filtering and classroom enrollment rules.",
    "nav.classrooms":
        "All classrooms. Open one to see its homepage: roster, parents, transcripts, and cohort stats.",
    "nav.homeRecording":
        "Record or upload home audio for your child. Choose a location and activity, then review the transcript when it is ready.",
    "nav.myChildData":
        "Your child's home talk only: developmental charts, transcripts (newest first), and recording history.",
    "nav.myProfile":
        "Your teacher profile with your assessments and transcript cards.",
    "nav.settings":
        "Account preferences, including the voice wake feature and other options.",
    "nav.about":
        "A picture of who can look at classroom and home talk. Opens on your role; you can switch to any other person. Anyone with the link can open this page.",

    // --- Page headers ---
    "page.classrooms":
        "All classrooms across every center. Cards are titled by the lead teacher; open a classroom to manage its roster or review its talk data.",
    "page.teachers":
        "Teacher directory. Add teachers, send invitations, filter by school, and open a teacher to edit their profile.",
    "page.teachersCoach":
        "Teachers you supervise. Invite a teacher by email (up to 20 assigned plus pending). You cannot add, edit, or delete teacher profiles.",
    "page.coaches":
        "Coaches join the platform on their own — no invitation needed. Assign each coach the teachers they oversee; classroom and home charts open automatically, and transcript access is admin-gated.",
    "page.about":
        "Anyone with the link can open this page. Use View as to highlight one person on the picture.",

    // --- Key actions / panels ---
    "control.viewMode":
        "Switch between tile cards and a sortable table. In table view, click a column header to sort; your choice is remembered on this device.",
    "control.createClassroom":
        "Create a classroom. Administrators assign any lead teacher; a teacher who creates one becomes its lead automatically.",
    "control.recordActivity":
        "Record up to 60 minutes in the browser or upload an audio file. Pick a location and activity, then review and accept the transcript before it counts as a saved assessment.",
    "control.homeSharing":
        "Home charts open for classroom teachers and coaches automatically. Use Currently accessing to turn someone off. Transcript text stays admin-gated.",
    "control.homeTranscriptAccess":
        "Admin-only. A parent's grant shares visualizations only; enable this tier to also expose the child's home transcript text to that staff member.",
    "control.activityLog":
        "Admin-only feed of teacher and coach actions (sign-ins, recordings, transcript decisions, classroom and roster changes, access requests). Entries contain no transcript content and are kept for 90 days.",
    "control.termsAcceptance":
        "You must accept the Terms and Conditions to create an account. The account-deletion policy is shown up front: classroom data you produce stays on the platform even if you later delete your account.",
    "control.deleteAccount":
        "Permanently removes your profile and sign-in. Classroom recordings, transcripts, and talk analytics you produced are program records and remain on the platform, attributed to your name. This cannot be undone.",
    "control.transcriptPii":
        "Names and other identifiers (phones, emails, addresses) are replaced with labels like [PERSON] or [EMAIL] before you review the transcript. The original wording is not stored.",
    "control.currentlyAccessing":
        "Who can see these charts right now. Lead teachers switch classroom parents and coaches; parents switch home teachers and coaches. All administrators can view the page and are not listed by name. Turning charts back on resets transcript words.",
    "control.viewAs":
        "See the platform the way another role does — a general preview, not a specific person's account. Navigation and empty screens change; your sign-in and data access do not. Recording, uploading, and other writes stay off.",
    "control.viewAsBanner":
        "You are looking at a general preview of this role. Exit to return to your own navigation. Nothing you do here is saved as that role.",
    "control.takeNotes":
        "Add or replace the shared note on this recording. Anyone who can see the transcript can edit it; the latest save wins. Notes are included when you download Excel.",
    "control.hideObservation":
        "Only the person who recorded this session can hide it. Hidden recordings disappear from everyone else's lists, charts, and Excel — including administrators.",
});

/** Look up help copy for a key; returns null for unknown keys. */
export function helpFor(key) {
    return HELP_TEXT[key] ?? null;
}
