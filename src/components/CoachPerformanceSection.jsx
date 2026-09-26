import { useEffect, useRef, useState } from "react";
import { fetchCoachPerformance } from "../lib/coachApi";
import CoachPerformanceOverview from "./CoachPerformanceOverview.jsx";

export default function CoachPerformanceSection({
    coachId,
    enabled = true,
    emptyTeachersMessage,
    onLoaded,
}) {
    const [viewMode, setViewMode] = useState("dotmatrix");
    const [payload, setPayload] = useState(null);
    const [loading, setLoading] = useState(Boolean(enabled && coachId));
    const [error, setError] = useState("");
    const onLoadedRef = useRef(onLoaded);
    onLoadedRef.current = onLoaded;

    useEffect(() => {
        if (!enabled || !coachId) {
            setPayload(null);
            setError("");
            setLoading(false);
            return undefined;
        }
        let cancelled = false;
        setLoading(true);
        setError("");
        fetchCoachPerformance(coachId)
            .then((data) => {
                if (cancelled) return;
                setPayload(data);
                onLoadedRef.current?.(data);
            })
            .catch((err) => {
                if (cancelled) return;
                setPayload(null);
                setError(err.response?.data?.message || "Failed to load performance");
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });
        return () => {
            cancelled = true;
        };
    }, [coachId, enabled]);

    if (!enabled) {
        return (
            <CoachPerformanceOverview
                assignedTeacherCount={0}
                emptyTeachersMessage={emptyTeachersMessage}
            />
        );
    }

    if (loading) {
        return (
            <div className="flex justify-center py-16 mb-8">
                <span className="loading loading-spinner loading-lg text-primary" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="alert alert-error mb-8">
                <span>{error}</span>
            </div>
        );
    }

    return (
        <CoachPerformanceOverview
            assessments={payload?.assessments || []}
            assignedTeacherCount={payload?.assignedTeacherCount || 0}
            emptyTeachersMessage={emptyTeachersMessage}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
        />
    );
}
