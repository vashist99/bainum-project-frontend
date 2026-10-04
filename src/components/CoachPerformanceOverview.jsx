import TalkMetricsDeck from "./TalkMetricsDeck.jsx";

export default function CoachPerformanceOverview({
    assessments = [],
    assignedTeacherCount = 0,
    emptyTeachersMessage,
}) {
    const hasTeachers = assignedTeacherCount > 0;

    return (
        <section aria-label="Teacher performance" className="mb-8">
            <h2 className="text-xl font-bold text-base-content mb-4">Teacher performance</h2>
            {hasTeachers ? (
                <TalkMetricsDeck
                    assessments={assessments}
                    context="school"
                    role="coach"
                    defaultPreset="this-month"
                    contextSubtitle="At School"
                    title=""
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
