import { useEffect, useState } from "react";
import { pageSlice } from "../utils/transcriptPage.js";

export function useTranscriptPage(items, resetKey = "") {
    const [pageIndex, setPageIndex] = useState(0);

    useEffect(() => {
        setPageIndex(0);
    }, [resetKey]);

    const page = pageSlice(items, pageIndex);

    useEffect(() => {
        if (page.pageIndex !== pageIndex) setPageIndex(page.pageIndex);
    }, [page.pageIndex, pageIndex]);

    return { ...page, setPageIndex };
}

export default function TranscriptPager({ pageIndex, pageCount, onPageChange }) {
    if (pageCount <= 1) return null;
    const atStart = pageIndex <= 0;
    const atEnd = pageIndex >= pageCount - 1;
    return (
        <div className="flex max-w-full flex-wrap items-center justify-between gap-2" data-testid="transcript-pager">
            <button
                type="button"
                className="btn btn-ghost btn-sm"
                disabled={atStart}
                onClick={() => onPageChange(pageIndex - 1)}
            >
                Previous
            </button>
            <p className="text-sm text-base-content/70">Page {pageIndex + 1} of {pageCount}</p>
            <button
                type="button"
                className="btn btn-ghost btn-sm"
                disabled={atEnd}
                onClick={() => onPageChange(pageIndex + 1)}
            >
                Next
            </button>
        </div>
    );
}
