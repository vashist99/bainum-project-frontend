export const TRANSCRIPT_PAGE_SIZE = 4;

/**
 * Slice an already sorted transcript list. `pageIndex` is 0-based.
 * An empty list is one empty page so the pager stays hidden.
 */
export function pageSlice(items, pageIndex, pageSize = TRANSCRIPT_PAGE_SIZE) {
    const list = Array.isArray(items) ? items : [];
    const size = Number.isFinite(pageSize) && pageSize > 0 ? Math.trunc(pageSize) : TRANSCRIPT_PAGE_SIZE;
    const pageCount = Math.max(1, Math.ceil(list.length / size));
    const requested = Number.isFinite(pageIndex) ? Math.trunc(pageIndex) : 0;
    const clamped = Math.min(Math.max(0, requested), pageCount - 1);
    const offset = clamped * size;
    const visible = list.slice(offset, offset + size);
    return {
        items: visible,
        pageIndex: clamped,
        pageCount,
        start: visible.length === 0 ? 0 : offset + 1,
        end: offset + visible.length,
    };
}
