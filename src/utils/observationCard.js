export function viewerCanHideObservation({ canHide, recordedById, viewerId } = {}) {
    if (typeof canHide === "boolean") return canHide;
    const recorder = String(recordedById || "");
    const viewer = String(viewerId || "");
    return Boolean(recorder && viewer && recorder === viewer);
}

function commentTime(value) {
    const time = new Date(value || 0).getTime();
    return Number.isNaN(time) ? 0 : time;
}

function normalizeComment(comment) {
    return {
        text: String(comment?.text || "").trim(),
        authorName: comment?.authorName || "",
        authorId: comment?.authorId || null,
        createdAt: comment?.createdAt || null,
    };
}

export function listObservationComments(source) {
    const record = Array.isArray(source) ? { observationComments: source } : source || {};
    const stored = (Array.isArray(record.observationComments) ? record.observationComments : [])
        .map(normalizeComment)
        .filter((comment) => comment.text);
    if (stored.length > 0) {
        return stored.sort((a, b) => commentTime(a.createdAt) - commentTime(b.createdAt));
    }
    const note = record.observationNote;
    const text = typeof note === "string" ? note.trim() : String(note?.text || "").trim();
    if (!text) return [];
    return [
        {
            text,
            authorName: typeof note === "string" ? "" : note?.authorName || "",
            authorId: typeof note === "string" ? null : note?.authorId || null,
            createdAt:
                typeof note === "string" ? null : note?.updatedAt || note?.createdAt || null,
        },
    ];
}

export function formatCommentTimestamp(value) {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return date.toLocaleString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
    });
}

export function formatObservationCommentsCell(source) {
    return listObservationComments(source)
        .map((comment) => {
            const name = comment.authorName || "Unknown";
            const when = formatCommentTimestamp(comment.createdAt);
            const head = when ? `${name} — ${when}` : name;
            return `${head}\n${comment.text}`;
        })
        .join("\n\n");
}
