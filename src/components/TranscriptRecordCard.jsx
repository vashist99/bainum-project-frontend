import { useState } from "react";
import { ChevronDown, MapPin, MessageSquare, Trash2 } from "lucide-react";
import {
    highlightRAGSegments,
    getSegmentsForHighlighting,
} from "../utils/ragHighlightSegments.js";
import {
    formatCommentTimestamp,
    listObservationComments,
} from "../utils/observationCard.js";
import { previewWriteProps } from "../lib/viewAs.js";
import InfoTip from "./InfoTip.jsx";
import LanguageFeatureStrip from "./LanguageFeatureStrip.jsx";

/**
 * Per-recording card used by classroom, child, and teacher profile pages.
 * Purely presentational — callers own fetch/auth and pass note/hide handlers.
 */
export default function TranscriptRecordCard({
    id,
    date,
    activity,
    activityContext,
    attribution,
    location,
    durationSeconds,
    wordCount,
    wordsPerMinute,
    categoryWPM,
    categoryWordCount,
    transcript,
    languageFeatures,
    hideTranscript = false,
    ragSegments,
    onDelete,
    observationNote,
    observationComments,
    hidden,
    canHide,
    isPreviewing = false,
    initialCommentsOpen = false,
    onSaveNote,
    onToggleHidden,
}) {
    const segments = getSegmentsForHighlighting(transcript, ragSegments);
    const hasRagHighlights = Array.isArray(segments) && segments.length > 0;
    const formattedDate = formatDate(date);
    const comments = listObservationComments({ observationComments, observationNote });
    const [commentsOpen, setCommentsOpen] = useState(initialCommentsOpen);
    const [draft, setDraft] = useState("");
    const [posting, setPosting] = useState(false);

    const handleDelete = () => {
        if (typeof onDelete !== "function") return;
        if (
            !window.confirm(
                "Are you sure you want to delete this transcript? This will remove it from the dot matrix and dials, and recalculate thresholds."
            )
        ) {
            return;
        }
        onDelete();
    };

    const openComments = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setCommentsOpen(true);
    };

    const closeComments = () => setCommentsOpen(false);

    const postComment = async () => {
        if (typeof onSaveNote !== "function" || posting || isPreviewing) return;
        const text = draft.trim();
        if (!text) return;
        setPosting(true);
        try {
            await onSaveNote(text);
            setDraft("");
        } catch {
            // The page toasts the error and rethrows so the draft stays.
        } finally {
            setPosting(false);
        }
    };

    return (
        <details
            key={id}
            data-testid="transcript-record-card"
            className="card bg-base-200 border border-base-300 group min-w-0 overflow-hidden"
            open={hideTranscript ? false : undefined}
            onToggle={(event) => {
                if (hideTranscript) event.currentTarget.open = false;
            }}
        >
            <summary className="p-3 sm:p-4 cursor-pointer list-none [&::-webkit-details-marker]:hidden">
                <div className="flex items-start gap-2 min-w-0">
                    <ChevronDown
                        className="w-4 h-4 shrink-0 mt-1 text-base-content/60 transition-transform group-open:rotate-180"
                        aria-hidden="true"
                    />
                    <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm sm:text-base leading-snug break-words">
                            {formattedDate}
                        </h3>
                        <div className="flex flex-wrap items-center gap-1.5 mt-2">
                                {activity && (
                                    <span
                                        className="badge badge-outline badge-primary badge-sm font-normal max-w-full truncate"
                                        title={
                                            activityContext === "home"
                                                ? "Activity recorded at home"
                                                : "Activity recorded at school"
                                        }
                                    >
                                        {activity}
                                    </span>
                                )}
                                {location && (
                                    <span
                                        className="badge badge-outline badge-secondary badge-sm font-normal gap-1 max-w-full"
                                        title="Recording location"
                                    >
                                        <MapPin className="w-3 h-3 shrink-0" aria-hidden="true" />
                                        <span className="truncate">{location}</span>
                                    </span>
                                )}
                                {attribution && (
                                    <span
                                        className="text-xs text-base-content/60 min-w-0 break-words"
                                        title={attribution}
                                    >
                                        {attribution}
                                    </span>
                                )}
                                {hidden && (
                                    <span className="badge badge-sm badge-warning font-normal">
                                        Hidden
                                    </span>
                                )}
                                {wordsPerMinute != null ? (
                                    <span className="badge badge-sm badge-primary">
                                        {Math.round(wordsPerMinute * 10) / 10} WPM
                                    </span>
                                ) : (
                                    <span className="badge badge-sm badge-ghost">WPM: N/A</span>
                                )}
                            </div>
                        <LanguageFeatureStrip features={languageFeatures} />
                        {!hideTranscript && (
                        <>
                        <p className="text-xs text-base-content/60 mt-1.5 group-open:hidden">
                            Click to expand transcript
                        </p>
                        <p className="text-xs text-base-content/60 mt-1.5 hidden group-open:block">
                            Click to collapse
                        </p>
                        </>
                        )}
                    </div>
                    {typeof onDelete === "function" && (
                        <button
                            type="button"
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleDelete();
                            }}
                            className="btn btn-ghost btn-circle text-error min-h-11 min-w-11 h-11 w-11 shrink-0 -mt-1 -mr-1"
                            title="Delete transcript"
                            aria-label="Delete transcript"
                        >
                            <Trash2 className="w-4 h-4" aria-hidden="true" />
                        </button>
                    )}
                </div>
            </summary>

            {!hideTranscript && (
            <div className="px-3 sm:px-4 pb-4">
                <div className="bg-base-100 p-3 sm:p-4 rounded-lg border border-base-300 max-h-64 overflow-y-auto">
                    {hasRagHighlights ? (
                        <p className="text-sm whitespace-pre-wrap leading-relaxed break-words">
                            {highlightRAGSegments(transcript, segments)}
                        </p>
                    ) : (
                        <p className="text-sm whitespace-pre-wrap leading-relaxed break-words">
                            {transcript}
                        </p>
                    )}
                </div>

                <div className="mt-3 space-y-2">
                    <div className="flex flex-wrap gap-1 items-center">
                        {durationSeconds != null && (
                            <span className="text-xs text-base-content/60">
                                {Math.floor(durationSeconds / 60)} min{" "}
                                {Math.round(durationSeconds % 60)} sec
                            </span>
                        )}
                        {wordCount != null && (
                            <span className="badge badge-sm badge-ghost">
                                {wordCount} word{wordCount === 1 ? "" : "s"}
                            </span>
                        )}
                        {wordsPerMinute != null ? (
                            <span className="badge badge-sm badge-primary">
                                {Math.round(wordsPerMinute * 10) / 10} WPM
                            </span>
                        ) : (
                            <span className="badge badge-sm badge-ghost">WPM: N/A</span>
                        )}
                        {categoryWPM && (
                            <span
                                className="text-[10px] text-base-content/60 ml-1 break-words"
                                title={`Science: ${categoryWPM.science ?? "—"} | Social: ${categoryWPM.social ?? "—"} | Literature: ${categoryWPM.literature ?? "—"} | Language: ${categoryWPM.language ?? "—"}`}
                            >
                                Sci {categoryWPM.science ?? "—"} · Soc{" "}
                                {categoryWPM.social ?? "—"} · Lit{" "}
                                {categoryWPM.literature ?? "—"} · Lang{" "}
                                {categoryWPM.language ?? "—"}
                            </span>
                        )}
                    </div>
                    {categoryWordCount && (
                        <div className="flex flex-wrap gap-2 text-xs">
                            {CATEGORY_BADGE_DEFS.map(({ key, label, color }) => {
                                const words = categoryWordCount[key];
                                if (words == null) return null;
                                const wpm = categoryWPM?.[key];
                                return (
                                    <span
                                        key={key}
                                        className={`badge badge-sm ${color}`}
                                        data-testid={`category-badge-${key}`}
                                    >
                                        {label}: {words} word{words !== 1 ? "s" : ""}
                                        {wpm != null
                                            ? ` (${Math.round(wpm * 10) / 10} WPM)`
                                            : ""}
                                    </span>
                                );
                            })}
                        </div>
                    )}
                    {(typeof onSaveNote === "function" || canHide) && (
                        <div className="flex flex-wrap items-center gap-2 pt-1">
                            {typeof onSaveNote === "function" && (
                                <span className="inline-flex items-center gap-1">
                                    <button
                                        type="button"
                                        className="btn btn-ghost btn-sm gap-1.5 min-h-11"
                                        onClick={openComments}
                                    >
                                        <MessageSquare className="w-3.5 h-3.5" aria-hidden="true" />
                                        Comments{comments.length > 0 ? ` (${comments.length})` : ""}
                                    </button>
                                    <InfoTip helpKey="control.takeNotes" />
                                </span>
                            )}
                            {canHide && (
                                <label className="label cursor-pointer gap-2 py-0 min-h-11">
                                    <span className="label-text text-sm">Hide Observation</span>
                                    <InfoTip helpKey="control.hideObservation" />
                                    <input
                                        type="checkbox"
                                        className="toggle toggle-sm"
                                        checked={!!hidden}
                                        aria-label="Hide Observation"
                                        {...previewWriteProps(isPreviewing, {
                                            onChange: (e) => {
                                                if (typeof onToggleHidden === "function") {
                                                    onToggleHidden(e.target.checked);
                                                }
                                            },
                                        })}
                                    />
                                </label>
                            )}
                        </div>
                    )}
                </div>
            </div>
            )}

            {commentsOpen && (
                <div className="modal modal-open" role="dialog" aria-labelledby={`comments-title-${id}`}>
                    <div className="modal-box">
                        <h3 id={`comments-title-${id}`} className="font-bold text-lg">
                            Comments
                        </h3>
                        <p className="text-sm text-base-content/70 mt-1">
                            Comments stay with this recording. A post cannot be edited or deleted.
                        </p>
                        {comments.length === 0 ? (
                            <p className="text-sm text-base-content/60 mt-3">No comments yet.</p>
                        ) : (
                            <ul className="mt-3 max-h-64 space-y-3 overflow-y-auto">
                                {comments.map((comment, index) => {
                                    const when = formatCommentTimestamp(comment.createdAt);
                                    return (
                                        <li
                                            key={`${comment.createdAt || "comment"}-${index}`}
                                            className="rounded-lg bg-base-200 px-3 py-2"
                                        >
                                            <div className="flex flex-wrap items-baseline gap-x-2">
                                                <span className="text-sm font-medium">
                                                    {comment.authorName || "Unknown"}
                                                </span>
                                                {when && (
                                                    <time
                                                        className="text-xs text-base-content/50"
                                                        dateTime={
                                                            comment.createdAt
                                                                ? new Date(comment.createdAt).toISOString()
                                                                : undefined
                                                        }
                                                    >
                                                        {when}
                                                    </time>
                                                )}
                                            </div>
                                            <p className="mt-1 text-sm whitespace-pre-wrap break-words">
                                                {comment.text}
                                            </p>
                                        </li>
                                    );
                                })}
                            </ul>
                        )}
                        <textarea
                            className="textarea textarea-bordered w-full min-h-24 mt-3"
                            value={draft}
                            onChange={(e) => setDraft(e.target.value)}
                            maxLength={4000}
                            aria-label="Comment"
                            placeholder="Write a comment"
                            {...previewWriteProps(isPreviewing)}
                        />
                        <div className="modal-action">
                            <button type="button" className="btn btn-ghost" onClick={closeComments}>
                                Close
                            </button>
                            <button
                                type="button"
                                className="btn btn-primary"
                                onClick={postComment}
                                {...previewWriteProps(isPreviewing, {
                                    disabled: posting || !draft.trim(),
                                })}
                            >
                                {posting ? "Posting…" : "Post"}
                            </button>
                        </div>
                    </div>
                    <button type="button" className="modal-backdrop" onClick={closeComments}>
                        close
                    </button>
                </div>
            )}
        </details>
    );
}

const CATEGORY_BADGE_DEFS = [
    { key: "science", label: "Science", color: "badge-info" },
    { key: "social", label: "Social", color: "badge-success" },
    { key: "literature", label: "Literature", color: "badge-secondary" },
    { key: "language", label: "Language", color: "badge-warning" },
];

function formatDate(date) {
    if (!date) return "—";
    const d = date instanceof Date ? date : new Date(date);
    if (isNaN(d.getTime())) return "—";
    return d.toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}
