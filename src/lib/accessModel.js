/**
 * Short labels for the About map.
 * Not an authorization engine — keep in sync with permissions.js by hand.
 */

export const ACTOR_IDS = Object.freeze(["admin", "teacher", "coach", "parent"]);

export const PERSPECTIVES = Object.freeze(["all", ...ACTOR_IDS]);

/** Stated once at the top of the map. Do not repeat on person cards. */
export const JOIN_NOTE =
    "For testing, every role can create an account on the login page (coaches use Register as a coach). Signing up does not open talk data. An email invite is how a teacher or parent is linked to a class or child.";

export const COPY = Object.freeze({
    charts: "Charts",
    writtenTranscript: "Written transcript",
    chartsGloss: "Counts and pictures.",
    transcriptGloss: "The actual words.",
    yes: "Yes",
    no: "No",
    recordsHere: "Records here",
    asksTheTeacherFirst: "Asks the teacher first",
    letsTeacherAndAdminLook: "Lets teacher and admin look",
    onlyIfParentShares: "Only if the parent shares home talk",
    allowsReadingTheTranscript: "Allows reading the written transcript",
    onlyIfAdminAllows: "Only if the admin allows reading",
    onlyIfParentSharesThenAdminReading:
        "Only if the parent shares, then an admin allows reading",
});

export const DELETION_FACT = Object.freeze({
    label: "Can erase their own login",
    actors: Object.freeze(["teacher", "coach"]),
});

export const ACTORS = Object.freeze([
    {
        id: "admin",
        label: "Admin",
        job: "Runs the platform",
        icon: "shield",
        headerClass: "bg-secondary text-secondary-content",
        ringClass: "ring-secondary",
    },
    {
        id: "teacher",
        label: "Teacher",
        job: "Records in class",
        icon: "mic",
        headerClass: "bg-primary text-primary-content",
        ringClass: "ring-primary",
    },
    {
        id: "coach",
        label: "Coach",
        job: "Records and looks at class talk",
        icon: "eye",
        headerClass: "bg-info text-info-content",
        ringClass: "ring-info",
    },
    {
        id: "parent",
        label: "Parent",
        job: "Records at home",
        icon: "user",
        headerClass: "bg-warning text-warning-content",
        ringClass: "ring-warning",
    },
]);

export const PLACES = Object.freeze([
    {
        id: "classroom",
        title: "Classroom",
        icon: "school",
        actors: Object.freeze(["admin", "teacher", "coach", "parent"]),
    },
    {
        id: "home",
        title: "Home",
        icon: "house",
        actors: Object.freeze(["admin", "teacher", "parent", "coach"]),
    },
]);

/**
 * Who can look at each place.
 * yes = can look now; arrow = explained by PATHS id; no = cannot.
 */
export const CLASSROOM_VIEWERS = Object.freeze([
    { actor: "admin", charts: "yes", transcript: "yes" },
    { actor: "teacher", charts: "yes", transcript: "yes" },
    { actor: "parent", charts: "yes", transcript: "yes" },
    { actor: "coach", charts: "arrow", transcript: "arrow", chartsPath: "ask-to-look", transcriptPath: "turns-on-words" },
]);

export const HOME_VIEWERS = Object.freeze([
    { actor: "parent", charts: "yes", transcript: "yes" },
    { actor: "admin", charts: "arrow", transcript: "arrow", chartsPath: "share-staff", transcriptPath: "turns-on-words", transcriptLabelKey: "onlyIfParentSharesThenAdminReading" },
    { actor: "teacher", charts: "arrow", transcript: "arrow", chartsPath: "share-staff", transcriptPath: "turns-on-words", transcriptLabelKey: "onlyIfParentSharesThenAdminReading" },
    { actor: "coach", charts: "no", transcript: "no" },
]);

export const PATHS = Object.freeze([
    {
        id: "record-classroom",
        from: "teacher",
        toPlace: "classroom",
        toColumn: "place",
        toLabel: "Classroom",
        labelKey: "recordsHere",
        actors: Object.freeze(["teacher"]),
    },
    {
        id: "record-classroom-coach",
        from: "coach",
        toPlace: "classroom",
        toColumn: "place",
        toLabel: "Classroom",
        labelKey: "recordsHere",
        actors: Object.freeze(["coach"]),
    },
    {
        id: "record-home",
        from: "parent",
        toPlace: "home",
        toColumn: "place",
        toLabel: "Home",
        labelKey: "recordsHere",
        actors: Object.freeze(["parent"]),
    },
    {
        id: "ask-to-look",
        from: "coach",
        toPlace: "classroom",
        toColumn: "charts",
        toLabel: "Classroom charts",
        labelKey: "asksTheTeacherFirst",
        cellLabelKey: "asksTheTeacherFirst",
        actors: Object.freeze(["coach", "teacher"]),
    },
    {
        id: "share-staff",
        from: "parent",
        toPlace: "home",
        toColumn: "charts",
        toLabel: "Home charts",
        labelKey: "letsTeacherAndAdminLook",
        cellLabelKey: "onlyIfParentShares",
        actors: Object.freeze(["parent", "admin", "teacher"]),
    },
    {
        id: "turns-on-words",
        from: "admin",
        toPlace: null,
        toColumn: "transcript",
        toLabel: "Written transcript",
        labelKey: "allowsReadingTheTranscript",
        cellLabelKey: "onlyIfAdminAllows",
        actors: Object.freeze(["admin", "coach", "teacher"]),
    },
]);

/**
 * User-facing fact strings drawn on the map (names like "Admin" omitted).
 * Each value must appear once in this list.
 */
export function collectVisibleFactStrings() {
    return [
        JOIN_NOTE,
        ...Object.values(COPY),
        DELETION_FACT.label,
        ...ACTORS.map((actor) => actor.job),
        ...PLACES.map((place) => place.title),
    ];
}

/**
 * @param {string} selected  "all" | actor id
 * @param {string} actorId
 * @returns {"full" | "dim"}
 */
export function perspectiveEmphasis(selected, actorId) {
    if (!selected || selected === "all") return "full";
    return selected === actorId ? "full" : "dim";
}

/**
 * @param {string} selected
 * @param {string[]} actors
 * @returns {boolean}
 */
export function connectorEmphasized(selected, actors) {
    if (!selected || selected === "all") return true;
    return Array.isArray(actors) && actors.includes(selected);
}

export function pathLabel(path) {
    return COPY[path.labelKey];
}

export function pathCellLabel(path) {
    return COPY[path.cellLabelKey || path.labelKey];
}

for (const actor of ACTORS) Object.freeze(actor);
for (const place of PLACES) Object.freeze(place);
for (const row of CLASSROOM_VIEWERS) Object.freeze(row);
for (const row of HOME_VIEWERS) Object.freeze(row);
for (const row of PATHS) Object.freeze(row);
