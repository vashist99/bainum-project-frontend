import { useEffect, useState } from "react";
import axios from "../lib/axios";
import {
    filterByDateRange,
    isRangeReversed,
    presetRange,
    round1,
    topActivityBucket,
    weightedPerMinute,
} from "../lib/talkMetrics.js";

export function scanStats(rows, start, end) {
    if (isRangeReversed(start, end)) return { status: "reversed" };
    if (rows == null) return { status: rows === null ? "unavailable" : "loading" };
    const filtered = filterByDateRange(rows, start, end);
    return {
        status: "ready",
        recordings: filtered.length,
        whyHow: round1(weightedPerMinute(filtered, (row) => row?.languageFeatures?.whQuestionCount)),
        differentWords: round1(weightedPerMinute(filtered, (row) => row?.languageFeatures?.uniqueWordCount)),
        top: topActivityBucket(filtered, "school"),
    };
}

export function useCoachClassroomScan(classrooms) {
    const initial = presetRange("this-month");
    const [start, setStart] = useState(initial.start);
    const [end, setEnd] = useState(initial.end);
    const [byRoom, setByRoom] = useState({});

    useEffect(() => {
        const ids = (classrooms || []).map((room) => room.id).filter(Boolean);
        if (ids.length === 0) {
            setByRoom({});
            return undefined;
        }
        let cancelled = false;
        Promise.all(ids.map(async (id) => {
            try {
                const response = await axios.get(`/api/classrooms/${id}/assessments`);
                return [id, response.data?.assessments || []];
            } catch {
                return [id, null];
            }
        })).then((pairs) => {
            if (!cancelled) setByRoom(Object.fromEntries(pairs));
        });
        return () => {
            cancelled = true;
        };
    }, [classrooms]);

    return { start, setStart, end, setEnd, byRoom };
}
