import { LanguageDevelopmentCharts } from "./LanguageDevelopmentCharts";

export default function CoachPerformanceOverview({
    assessments = [],
    assignedTeacherCount = 0,
    emptyTeachersMessage,
    viewMode = "dotmatrix",
    onViewModeChange,
}) {
    const hasTeachers = assignedTeacherCount > 0;

    return (
        <section aria-label="Teacher performance" className="mb-8">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
                <h2 className="text-xl font-bold text-base-content">Teacher performance</h2>
                {hasTeachers ? (
                    <select
                        className="select select-bordered select-primary"
                        aria-label="Chart view"
                        value={viewMode}
                        onChange={(event) => onViewModeChange?.(event.target.value)}
                    >
                        <option value="dotmatrix">Dot Matrix</option>
                        <option value="semicircular">Semicircular Dials</option>
                    </select>
                ) : null}
            </div>
            {hasTeachers ? (
                <LanguageDevelopmentCharts
                    assessments={assessments}
                    viewMode={viewMode}
                    title="Language Development Analysis - Year Overview"
                    contextSubtitle="At School"
                    showWordScores
                />
            ) : (
                <div className="card bg-base-100 shadow border border-dashed border-base-300">
                    <div className="card-body items-center text-center py-10">
                        <p className="text-base-content/70 max-w-md">{emptyTeachersMessage}</p>
                    </div>
                </div>
            )}
        </section>
    );
}
