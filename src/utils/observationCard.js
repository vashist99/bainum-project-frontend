export function viewerCanHideObservation({ canHide, recordedById, viewerId } = {}) {
    if (typeof canHide === "boolean") return canHide;
    const recorder = String(recordedById || "");
    const viewer = String(viewerId || "");
    return Boolean(recorder && viewer && recorder === viewer);
}

export function observationNoteText(note) {
    if (typeof note === "string") return note.trim();
    return String(note?.text || "").trim();
}
