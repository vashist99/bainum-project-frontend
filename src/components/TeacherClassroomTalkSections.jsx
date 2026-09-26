import { FileText } from "lucide-react";
import { LanguageDevelopmentCharts } from "./LanguageDevelopmentCharts";
import TranscriptList from "./TranscriptList.jsx";

function transcriptsWithText(recordings) {
    return (recordings || []).filter((row) => String(row?.transcript || "").trim());
}

/**
 * One year overview and one transcript list for every recording stored
 * under this teacher, from every classroom. The view toggle is owned by the page.
 */
export default function TeacherClassroomTalkSections({
    assessments,
    viewMode,
    cohortThresholdsByCategory,
    headerAction = null,
    emptyTranscriptMessage = "No transcripts yet for this teacher.",
    renderCard,
}) {
    const recordings = Array.isArray(assessments) ? assessments : [];
    const transcripts = [...transcriptsWithText(recordings)].sort(
        (a, b) => new Date(b.date) - new Date(a.date)
    );

    return (
        <>
            <LanguageDevelopmentCharts
                assessments={recordings}
                viewMode={viewMode}
                title="Language Development Analysis - Year Overview"
                contextSubtitle="At School"
                cohortThresholdsByCategory={cohortThresholdsByCategory}
                showWordScores
            />

            <div className="card bg-base-100 shadow-xl mb-6">
                <div className="card-body">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-2">
                        <h2 className="card-title text-2xl flex items-center gap-2">
                            <FileText className="w-6 h-6 text-primary shrink-0" aria-hidden="true" />
                            Transcripts
                        </h2>
                        {transcripts.length > 0 ? headerAction : null}
                    </div>
                    {transcripts.length === 0 ? (
                        <div className="alert alert-info">
                            <FileText className="w-5 h-5" aria-hidden="true" />
                            <span>{emptyTranscriptMessage}</span>
                        </div>
                    ) : (
                        <TranscriptList
                            items={transcripts}
                            emptyFilteredMessage="No transcripts in this date range."
                            renderItem={renderCard}
                        />
                    )}
                </div>
            </div>
        </>
    );
}
