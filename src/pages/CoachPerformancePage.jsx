import { useState } from "react";
import { useNavigate, useParams } from "react-router";
import { ArrowLeft } from "lucide-react";
import AppLayout from "../components/AppLayout";
import CoachPerformanceSection from "../components/CoachPerformanceSection.jsx";

const CoachPerformancePage = () => {
    const { coachId } = useParams();
    const navigate = useNavigate();
    const [coachName, setCoachName] = useState("");

    const breadcrumbs = [
        { label: "Dashboard", href: "/home" },
        { label: "Coaches", href: "/coaches" },
        { label: coachName || "Teacher performance" },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <div className="container mx-auto p-6 max-w-6xl">
                <div className="flex items-start gap-3 mb-6 min-w-0">
                    <button
                        type="button"
                        onClick={() => navigate("/coaches")}
                        className="btn btn-ghost btn-circle shrink-0"
                        title="Go back"
                    >
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                    <h1 className="text-2xl sm:text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent break-words">
                        {coachName ? `${coachName}'s Teacher Performance` : "Teacher Performance"}
                    </h1>
                </div>
                <CoachPerformanceSection
                    coachId={coachId}
                    emptyTeachersMessage="No teachers are assigned to this coach."
                    onLoaded={(data) => setCoachName(data?.coach?.name || "")}
                />
            </div>
        </AppLayout>
    );
};

export default CoachPerformancePage;
