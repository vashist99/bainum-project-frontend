import { useMemo, useState } from "react";
import { filterItemsByDateRange } from "../utils/transcriptDateRange.js";

/**
 * Date-range filter + list shell for saved transcripts.
 * Callers pass `renderItem` so classroom / child / teacher cards stay in one place.
 */
export default function TranscriptList({
    items = [],
    getDate = (item) => item?.date,
    renderItem,
    emptyFilteredMessage = "No transcripts in this date range.",
}) {
    const [from, setFrom] = useState("");
    const [to, setTo] = useState("");

    const filtered = useMemo(
        () => filterItemsByDateRange(items, from, to, getDate),
        [items, from, to, getDate]
    );

    const hasFilter = Boolean(from || to);

    return (
        <div className="space-y-4 min-w-0">
            <div className="flex flex-col gap-3 min-[520px]:flex-row min-[520px]:flex-wrap min-[520px]:items-end">
                <label className="form-control w-full min-[520px]:w-auto min-w-0">
                    <span className="label py-0 pb-1">
                        <span className="label-text text-xs text-base-content/70">From</span>
                    </span>
                    <input
                        type="date"
                        className="input input-bordered input-sm w-full min-[520px]:w-40 max-w-full"
                        value={from}
                        max={to || undefined}
                        onChange={(e) => setFrom(e.target.value)}
                        aria-label="Filter transcripts from date"
                        data-testid="transcript-date-from"
                    />
                </label>
                <label className="form-control w-full min-[520px]:w-auto min-w-0">
                    <span className="label py-0 pb-1">
                        <span className="label-text text-xs text-base-content/70">To</span>
                    </span>
                    <input
                        type="date"
                        className="input input-bordered input-sm w-full min-[520px]:w-40 max-w-full"
                        value={to}
                        min={from || undefined}
                        onChange={(e) => setTo(e.target.value)}
                        aria-label="Filter transcripts to date"
                        data-testid="transcript-date-to"
                    />
                </label>
                {hasFilter && (
                    <button
                        type="button"
                        className="btn btn-ghost btn-sm self-start min-[520px]:self-auto"
                        onClick={() => {
                            setFrom("");
                            setTo("");
                        }}
                    >
                        Clear dates
                    </button>
                )}
                <p className="text-xs text-base-content/60 min-[520px]:ml-auto min-[520px]:pb-2">
                    Showing {filtered.length} of {items.length}
                </p>
            </div>

            {filtered.length === 0 ? (
                <p className="text-sm text-base-content/60 py-2">{emptyFilteredMessage}</p>
            ) : (
                <div className="space-y-4 min-w-0">
                    {filtered.map((item) => renderItem(item))}
                </div>
            )}
        </div>
    );
}
