/**
 * Layer 2 buckets, date range, and duration-weighted rates.
 * Pure functions shared by the metrics deck and Excel export.
 */

export const CONTENT_CATEGORIES = ["science", "social", "language", "literature"];

export const CONTENT_COLORS = {
    science: "#5B9BD5",
    social: "#ED7D31",
    language: "#7F7F7F",
    literature: "#C99700",
};

export const CONTENT_LABELS = {
    science: "Science",
    social: "Social",
    language: "Language",
    literature: "Literature",
};

const SCHOOL_BUCKETS = [
    ["Alphabet and phonics", ["Letter & phonics activities", "Rhyming and word games", "Alphabet practice"]],
    ["Books and reading", ["Story time / read aloud", "Shared reading", "Talking about pictures", "Library / listening center"]],
    ["Writing", ["Writing or journaling"]],
    ["Math", ["Counting and number games", "Sorting and patterning", "Shape and color activities", "Measuring activities", "Math manipulatives"]],
    ["Science and sensory", ["Science experiments", "Nature exploration", "Sensory table", "Sensory bin", "Garden time"]],
    ["Dramatic play", ["Dramatic play / pretend play", "Kitchen / housekeeping center"]],
    ["Other centers and free play", ["Free play / free choice", "Blocks center", "Construction and building", "Puzzles and manipulatives", "Cars and trucks", "Sand or water play"]],
    ["Circle and group", ["Circle time", "Morning meeting", "Calendar time", "Weather chart", "Attendance", "Question of the day", "Show and tell", "Class meeting", "Small group instruction", "Large group instruction", "Individual instruction"]],
    ["Meals and outdoor", ["Breakfast", "Morning snack", "Lunch", "Afternoon snack", "Outdoor play / recess", "Playground time", "Riding tricycles or ride-ons", "Ball games", "Climbing structures"]],
    ["Routines and transitions", ["Arrival / drop-off", "Morning greeting / sign-in", "Hand washing", "Bathroom break", "Diapering", "Line up", "Hallway transition", "Dismissal / pick-up"]],
    ["Rest and services", ["Nap time", "Quiet / rest time", "Speech therapy", "Occupational therapy", "Physical therapy", "Field trip", "Class celebration / holiday"]],
];

const HOME_BUCKETS = [
    ["Books and literacy", ["Reading together", "Playing with cloth or board books", "Talking about pictures", "Reading or looking at books"]],
    ["Play", ["Puzzles", "Blocks", "Pretend play", "Games", "Baby dolls", "Cars", "Sensory toys", "Playing (general)", "Sports (e.g., soccer, basketball)", "Centers", "Art", "Playdough", "Coloring"]],
    ["Meals", ["Bottle time", "Breakfast", "Lunch", "Dinner", "Snacks", "Water breaks"]],
    ["Care routines", ["Waking up", "Diapering", "Potty time", "Dressing", "Nap time", "Brushing teeth", "Bath time", "Bed time", "Sleeping"]],
    ["Outings", ["Car rides", "Bus rides", "Walks", "Visiting family and friends", "Shopping", "Getting the mail", "Traveling to/from activity"]],
    ["Household", ["Laundry", "Wiping up tables", "Throwing away trash", "Picking up toys", "Putting dishes in sink", "Clean-up, set-up, transition"]],
    ["Screen time", ["Screen time (e.g., movie/show, iPad/tablet/phone, video games)"]],
    ["Structured / other", ["Circle time", "Music time", "Library story time", "Story time", "Large group", "Small group", "Individual activity", "School work", "Faith-based activities", "Therapy", "Other"]],
];

const SCHOOL_LOOKUP = new Map();
for (const [bucket, labels] of SCHOOL_BUCKETS) {
    for (const label of labels) SCHOOL_LOOKUP.set(label, bucket);
}
const HOME_LOOKUP = new Map();
for (const [bucket, labels] of HOME_BUCKETS) {
    for (const label of labels) HOME_LOOKUP.set(label, bucket);
}

const INSTRUCTIONAL = new Set([
    "Alphabet and phonics",
    "Books and reading",
    "Writing",
    "Math",
    "Science and sensory",
    "Dramatic play",
    "Other centers and free play",
    "Circle and group",
]);
const ROUTINE = new Set(["Meals and outdoor", "Routines and transitions", "Rest and services"]);
const KNOWLEDGE = new Set(["Books and reading", "Writing", "Math", "Science and sensory", "Dramatic play"]);
const EVERYDAY = new Set(["Meals and outdoor", "Routines and transitions", "Care routines", "Household", "Meals"]);

export function activityBucket(activity, context = "school") {
    const label = typeof activity === "string" ? activity.trim() : "";
    if (context === "home") return HOME_LOOKUP.get(label) || "Structured / other";
    return SCHOOL_LOOKUP.get(label) || "Other";
}

export function isInstructionalBucket(bucket) {
    return INSTRUCTIONAL.has(bucket);
}

export function dateKey(value) {
    if (!value) return null;
    if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return null;
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${date.getFullYear()}-${month}-${day}`;
}

function pad(date) {
    return dateKey(date);
}

export function presetRange(preset, now = new Date()) {
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    if (preset === "all") return { start: "", end: "" };
    if (preset === "this-month") {
        const start = new Date(today.getFullYear(), today.getMonth(), 1);
        const end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        return { start: pad(start), end: pad(end) };
    }
    if (preset === "this-school-year") {
        const startYear = today.getMonth() >= 7 ? today.getFullYear() : today.getFullYear() - 1;
        return { start: `${startYear}-08-01`, end: `${startYear + 1}-07-31` };
    }
    const sunday = new Date(today);
    sunday.setDate(today.getDate() - today.getDay());
    if (preset === "last-four-weeks") {
        const start = new Date(sunday);
        start.setDate(sunday.getDate() - 21);
        const end = new Date(sunday);
        end.setDate(sunday.getDate() + 6);
        return { start: pad(start), end: pad(end) };
    }
    const end = new Date(sunday);
    end.setDate(sunday.getDate() + 6);
    return { start: pad(sunday), end: pad(end) };
}

export function isRangeReversed(start, end) {
    return Boolean(start && end && start > end);
}

export function filterByDateRange(recordings, start, end) {
    if (isRangeReversed(start, end)) return [];
    return (recordings || []).filter((row) => {
        const key = dateKey(row?.date);
        if (!key) return false;
        if (start && key < start) return false;
        if (end && key > end) return false;
        return true;
    });
}

function minutesOf(row) {
    const seconds = Number(row?.durationSeconds);
    if (!Number.isFinite(seconds) || seconds <= 0) return 0;
    return seconds / 60;
}

function featuresOf(row, category) {
    if (category) return row?.categoryLanguageFeatures?.[category] || null;
    return row?.languageFeatures || null;
}

export function weightedPerMinute(rows, countOf) {
    let count = 0;
    let minutes = 0;
    for (const row of rows || []) {
        const mins = minutesOf(row);
        if (mins <= 0) continue;
        const value = countOf(row);
        if (value == null || Number.isNaN(value)) continue;
        count += value;
        minutes += mins;
    }
    if (minutes <= 0) return null;
    return count / minutes;
}

export function weightedWordsPerIdea(rows, category) {
    let tokens = 0;
    let utterances = 0;
    for (const row of rows || []) {
        const features = featuresOf(row, category);
        const ideas = features?.utteranceCount;
        const length = features?.meanUtteranceLength;
        if (!ideas || length == null) continue;
        tokens += length * ideas;
        utterances += ideas;
    }
    if (utterances <= 0) return null;
    return tokens / utterances;
}

export function round1(value) {
    if (value == null || Number.isNaN(value)) return null;
    return Math.round(value * 10) / 10;
}

export function categorySeriesValue(row, category, metric) {
    if (metric === "wpm") {
        const value = row?.categoryWPM?.[category];
        if (value == null || Number.isNaN(value) || value <= 0) return null;
        return value;
    }
    const features = featuresOf(row, category);
    if (!features || !features.utteranceCount) return null;
    if (metric === "ideas") return features.meanUtteranceLength ?? null;
    const count = metric === "wh" ? features.whQuestionCount : features.uniqueWordCount;
    const mins = minutesOf(row);
    if (mins <= 0 || count == null) return null;
    return count / mins;
}

export function talkByContent(rows) {
    return CONTENT_CATEGORIES.map((category) => ({
        category,
        label: CONTENT_LABELS[category],
        color: CONTENT_COLORS[category],
        avgWpm: round1(weightedPerMinute(rows, (row) => {
            const words = row?.categoryWordCount?.[category];
            return words == null ? null : words;
        })),
        differentWords: round1(weightedPerMinute(rows, (row) => featuresOf(row, category)?.uniqueWordCount)),
        whyHow: round1(weightedPerMinute(rows, (row) => featuresOf(row, category)?.whQuestionCount)),
        wordsPerIdea: round1(weightedWordsPerIdea(rows, category)),
    }));
}

export function talkByActivity(rows, context = "school") {
    const groups = new Map();
    for (const row of rows || []) {
        const bucket = activityBucket(row?.activity, row?.activityContext || context);
        if (!groups.has(bucket)) groups.set(bucket, []);
        groups.get(bucket).push(row);
    }
    const table = [];
    for (const [bucket, group] of groups) {
        const audioMinutes = group.reduce((sum, row) => sum + minutesOf(row), 0);
        table.push({
            bucket,
            recordings: group.length,
            audioMinutes: round1(audioMinutes),
            avgWpm: round1(weightedPerMinute(group, (row) => row?.wordCount)),
            differentWords: round1(weightedPerMinute(group, (row) => featuresOf(row)?.uniqueWordCount)),
            whyHow: round1(weightedPerMinute(group, (row) => featuresOf(row)?.whQuestionCount)),
            wordsPerIdea: round1(weightedWordsPerIdea(group)),
        });
    }
    table.sort((a, b) => b.recordings - a.recordings || a.bucket.localeCompare(b.bucket));
    return table;
}

export function alphabetVersusKnowledge(rows) {
    const instructional = (rows || []).filter((row) => isInstructionalBucket(activityBucket(row?.activity, "school")));
    if (instructional.length < 3) return null;
    const alphabet = instructional.filter((row) => activityBucket(row?.activity, "school") === "Alphabet and phonics").length;
    const knowledge = instructional.filter((row) => KNOWLEDGE.has(activityBucket(row?.activity, "school"))).length;
    return {
        alphabetShare: alphabet / instructional.length,
        knowledgeShare: knowledge / instructional.length,
        instructional: instructional.length,
    };
}

export function storyTimeStats(rows, context = "school") {
    const bucket = context === "home" ? "Books and literacy" : "Books and reading";
    const group = (rows || []).filter((row) => activityBucket(row?.activity, row?.activityContext || context) === bucket);
    if (group.length === 0) return null;
    return {
        count: group.length,
        whyHow: round1(weightedPerMinute(group, (row) => featuresOf(row)?.whQuestionCount)),
        differentWords: round1(weightedPerMinute(group, (row) => featuresOf(row)?.uniqueWordCount)),
        wordsPerIdea: round1(weightedWordsPerIdea(group)),
    };
}

export function everydayMoments(rows, context = "school") {
    const group = (rows || []).filter((row) => EVERYDAY.has(activityBucket(row?.activity, row?.activityContext || context)));
    if (group.length === 0) return null;
    const comparisonBucket = context === "home" ? "Play" : null;
    const comparison = context === "home"
        ? (rows || []).filter((row) => activityBucket(row?.activity, "home") === "Play")
        : (rows || []).filter((row) => isInstructionalBucket(activityBucket(row?.activity, "school")));
    return {
        whyHow: round1(weightedPerMinute(group, (row) => featuresOf(row)?.whQuestionCount)),
        differentWords: round1(weightedPerMinute(group, (row) => featuresOf(row)?.uniqueWordCount)),
        comparisonWhyHow: round1(weightedPerMinute(comparison, (row) => featuresOf(row)?.whQuestionCount)),
        comparisonLabel: comparisonBucket || "lesson time",
    };
}

export function instructionalMix(rows) {
    let instructional = 0;
    let routine = 0;
    for (const row of rows || []) {
        const bucket = activityBucket(row?.activity, "school");
        if (INSTRUCTIONAL.has(bucket)) instructional += 1;
        else if (ROUTINE.has(bucket)) routine += 1;
    }
    const total = instructional + routine;
    if (total === 0) return null;
    return {
        instructional,
        routine,
        instructionalShare: instructional / total,
        routineShare: routine / total,
    };
}

export function weeksOverlapping(start, end) {
    if (!start || !end || isRangeReversed(start, end)) return [];
    const cursor = new Date(`${start}T12:00:00`);
    cursor.setDate(cursor.getDate() - cursor.getDay());
    const last = new Date(`${end}T12:00:00`);
    const weeks = [];
    let index = 1;
    while (cursor <= last && index < 60) {
        const weekStart = pad(cursor);
        const weekEndDate = new Date(cursor);
        weekEndDate.setDate(cursor.getDate() + 6);
        const weekEnd = pad(weekEndDate);
        weeks.push({ label: `Week ${index}`, start: weekStart, end: weekEnd });
        cursor.setDate(cursor.getDate() + 7);
        index += 1;
    }
    return weeks;
}

export function topActivityBucket(rows, context = "school") {
    const table = talkByActivity(rows, context);
    return table[0]?.bucket || null;
}

export function buildDeckModel(recordings, { start = "", end = "", context = "school", metric = "wpm" } = {}) {
    const filtered = filterByDateRange(recordings, start, end);
    const points = [...filtered]
        .filter((row) => dateKey(row?.date))
        .sort((a, b) => dateKey(a.date).localeCompare(dateKey(b.date)))
        .map((row) => ({
            label: dateKey(row.date),
            row,
            values: Object.fromEntries(CONTENT_CATEGORIES.map((category) => [
                category,
                categorySeriesValue(row, category, metric),
            ])),
        }));
    return {
        filtered,
        reversed: isRangeReversed(start, end),
        points,
        content: talkByContent(filtered),
        activity: talkByActivity(filtered, context),
        alphabet: context === "home" ? null : alphabetVersusKnowledge(filtered),
        story: storyTimeStats(filtered, context),
        everyday: everydayMoments(filtered, context),
        mix: context === "home" ? null : instructionalMix(filtered),
    };
}
