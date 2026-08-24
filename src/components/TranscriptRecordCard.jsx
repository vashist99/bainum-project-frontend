import { ChevronDown, MapPin, Trash2 } from "lucide-react";
import {
    highlightRAGSegments,
    getSegmentsForHighlighting,
} from "../utils/ragHighlightSegments.js";

/**
 * Per-recording card used by both `TeacherProfilePage` and
 * `ClassroomHomePage`. Purely presentational — no fetching, no auth.
 *
 * The Delete button is rendered iff `onDelete` is a function; the
 * caller owns the authorization decision and wires the right backend
 * endpoint. The component wraps the call in a `window.confirm(...)`
 * prompt matching the wording the Teacher-Profile already uses.
 *
 * All optional props degrade gracefully when missing — the card always
 * at least shows the date and the transcript body.
 *
 * @param {{
 *   id: string,
 *   date: string|Date,
 *   activity?: string,
 *   activityContext?: "home"|"school",
 *   uploadedBy?: string,
 *   attribution?: string|null,
 *   location?: string,
 *   durationSeconds?: number,
 *   wordCount?: number,
 *   wordsPerMinute?: number,
 *   categoryWPM?: { science?: number, social?: number, literature?: number, language?: number },
 *   categoryWordCount?: { science?: number, social?: number, literature?: number, language?: number },
 *   transcript: string,
 *   ragSegments?: Array,
 *   onDelete?: () => void | Promise<void>,
 * }} props
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
    ragSegments,
    onDelete,
}) {
    const segments = getSegmentsForHighlighting(transcript, ragSegments);
    const hasRagHighlights = Array.isArray(segments) && segments.length > 0;

    const formattedDate = formatDate(date);

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

    return (
        <details
            key={id}
            data-testid="transcript-record-card"
            className="card bg-base-200 border border-base-300 group min-w-0 overflow-hidden"
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
                                {wordsPerMinute != null ? (
                                    <span className="badge badge-sm badge-primary">
                                        {Math.round(wordsPerMinute * 10) / 10} WPM
                                    </span>
                                ) : (
                                    <span className="badge badge-sm badge-ghost">WPM: N/A</span>
                                )}
                            </div>
                        <p className="text-xs text-base-content/60 mt-1.5 group-open:hidden">
                            Click to expand transcript
                        </p>
                        <p className="text-xs text-base-content/60 mt-1.5 hidden group-open:block">
                            Click to collapse
                        </p>
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
                </div>
            </div>
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
