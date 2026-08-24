/**
 * Local-calendar date-range helpers for transcript lists.
 * `from` / `to` are `YYYY-MM-DD` strings from `<input type="date">`.
 */

export function startOfLocalDay(yyyyMmDd) {
    if (!yyyyMmDd || typeof yyyyMmDd !== "string") return null;
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(yyyyMmDd.trim());
    if (!match) return null;
    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);
    const date = new Date(year, month - 1, day, 0, 0, 0, 0);
    if (
        date.getFullYear() !== year ||
        date.getMonth() !== month - 1 ||
        date.getDate() !== day
    ) {
        return null;
    }
    return date;
}

export function endOfLocalDay(yyyyMmDd) {
    const start = startOfLocalDay(yyyyMmDd);
    if (!start) return null;
    return new Date(
        start.getFullYear(),
        start.getMonth(),
        start.getDate(),
        23,
        59,
        59,
        999
    );
}

export function isDateInRange(date, fromYmd, toYmd) {
    const time = new Date(date).getTime();
    if (Number.isNaN(time)) return false;
    const from = startOfLocalDay(fromYmd);
    const to = endOfLocalDay(toYmd);
    if (from && time < from.getTime()) return false;
    if (to && time > to.getTime()) return false;
    return true;
}

export function filterItemsByDateRange(
    items,
    fromYmd,
    toYmd,
    getDate = (item) => item?.date
) {
    if (!Array.isArray(items) || items.length === 0) return [];
    if (!fromYmd && !toYmd) return items;
    return items.filter((item) => isDateInRange(getDate(item), fromYmd, toYmd));
}
