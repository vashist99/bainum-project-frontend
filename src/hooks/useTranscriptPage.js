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
