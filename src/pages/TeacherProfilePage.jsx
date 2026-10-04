import { useState, useEffect } from "react";
import { Navigate } from "react-router";
import AppLayout from "../components/AppLayout";
import { User, Mail, Building2, Mic, Download } from "lucide-react";
import axios from "../lib/axios";
import toast from "react-hot-toast";
import { useAuth } from "../contexts/AuthContext";
import { useViewAs } from "../contexts/ViewAsContext";
import RolePreviewEmpty from "../components/RolePreviewEmpty";
import { shouldLoadLiveRoleData } from "../lib/viewAs.js";
import {
  saveObservationNote,
  setObservationHidden,
  mergeObservationPatch,
} from "../lib/observationApi.js";
import ClassroomUploadModal from "../components/ClassroomUploadModal";
import TranscriptRecordCard from "../components/TranscriptRecordCard.jsx";
import TeacherClassroomTalkSections from "../components/TeacherClassroomTalkSections.jsx";
import { buildTranscriptsWorkbook } from "../utils/classroomExcel";

const TeacherProfilePage = () => {
  const { user } = useAuth();
  const { isPreviewing } = useViewAs();
  const [teacher, setTeacher] = useState(null);
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [cohortThresholdsByCategory, setCohortThresholdsByCategory] = useState(null);
  const [downloadingXlsx, setDownloadingXlsx] = useState(false);

  useEffect(() => {
    if (!shouldLoadLiveRoleData(isPreviewing)) {
      setTeacher(null);
      setAssessments([]);
      setLoading(false);
      return;
    }
    const fetchData = async () => {
      if (!user?.id) return;
      try {
        setLoading(true);
        const [teacherRes, assessmentsRes, cohortRes] = await Promise.all([
          axios.get(`/api/teachers/${user.id}`).catch(() => ({ data: { teacher: null } })),
          axios.get(`/api/assessments/teacher/${user.id}`).catch(() => ({ data: { assessments: [] } })),
          axios.get(`/api/assessments/cohort-stats/teachers`).catch(() => ({ data: { cohortStats: null } })),
        ]);
        setTeacher(teacherRes.data?.teacher || null);
        setAssessments(assessmentsRes.data?.assessments || []);
        setCohortThresholdsByCategory(cohortRes.data?.cohortStats || null);
      } catch (error) {
        console.error("Error fetching profile data:", error);
        setAssessments([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user?.id, isPreviewing]);

  if (isPreviewing) {
    return (
      <AppLayout breadcrumbs={[{ label: "My Profile", href: "/profile" }]}>
        <div className="p-4 sm:p-6 max-w-4xl mx-auto">
          <h1 className="text-2xl sm:text-3xl font-bold text-base-content mb-2">My Profile</h1>
          <p className="text-base-content/70 mb-6">
            A teacher&apos;s own assessments and transcript cards.
          </p>
          <RolePreviewEmpty title="Teacher profile" icon={User}>
            Teachers land here to review their classroom recordings. This is a general
            preview — no specific teacher&apos;s assessments are loaded.
          </RolePreviewEmpty>
        </div>
      </AppLayout>
    );
  }

  if (user?.username) return <Navigate to={`/teachers/${user.username}`} replace />;

  const handleUploadSuccess = () => {
    setShowUploadModal(false);
    axios.get(`/api/assessments/teacher/${user.id}`).then((res) => {
      setAssessments(res.data?.assessments || []);
    }).catch(() => {});
  };

  const handleSaveProfileNote = async (assessment, text) => {
    try {
      const payload = await saveObservationNote("teacher", assessment._id, text);
      setAssessments((rows) =>
        rows.map((row) =>
          String(row._id) === String(assessment._id)
            ? mergeObservationPatch(row, payload)
            : row
        )
      );
      toast.success("Comment posted");
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not post comment");
      throw error;
    }
  };

  const handleToggleProfileHidden = async (assessment, hidden) => {
    try {
      const payload = await setObservationHidden("teacher", assessment._id, hidden);
      setAssessments((rows) =>
        rows.map((row) =>
          String(row._id) === String(assessment._id)
            ? mergeObservationPatch(row, payload)
            : row
        )
      );
      const cohortRes = await axios
        .get(`/api/assessments/cohort-stats/teachers`)
        .catch(() => ({ data: { cohortStats: null } }));
      setCohortThresholdsByCategory(cohortRes.data?.cohortStats || null);
      toast.success(hidden ? "Observation hidden" : "Observation visible");
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not update visibility");
    }
  };

  const handleDeleteTeacherAssessment = async (assessmentId) => {
    try {
      await axios.delete(`/api/assessments/teacher/${assessmentId}`);
      toast.success("Transcript deleted successfully");
      const [assessmentsRes, cohortRes] = await Promise.all([
        axios.get(`/api/assessments/teacher/${user.id}`),
        axios.get(`/api/assessments/cohort-stats/teachers`)
      ]);
      setAssessments(assessmentsRes.data?.assessments || []);
      setCohortThresholdsByCategory(cohortRes.data?.cohortStats || null);
    } catch (error) {
      const msg = error.response?.data?.message || "Failed to delete transcript";
      toast.error(msg);
    }
  };

  const transcriptsWithContent = assessments.filter((a) => a.transcript?.trim());

  const handleDownloadXlsx = async () => {
    if (!transcriptsWithContent.length) return;
    setDownloadingXlsx(true);
    try {
      // Newest first — matches the on-screen ordering.
      const sorted = [...transcriptsWithContent].sort(
        (a, b) => new Date(b.date) - new Date(a.date)
      );
      const teacherName = teacher?.name || user?.name || "";
      const wb = buildTranscriptsWorkbook(teacherName || "Classroom Talk", sorted, {
        layout: "single-sheet",
      });
      const buffer = await wb.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = URL.createObjectURL(blob);
      const today = new Date().toISOString().split("T")[0];
      // Match the classroom export's sanitizer; fall back to the
      // historical filename when the teacher's name hasn't loaded yet.
      const safeName = teacherName
        ? teacherName.replace(/[^a-z0-9-_]+/gi, "_")
        : "my_classroom";
      const a = document.createElement("a");
      a.href = url;
      a.download = `${safeName}_transcripts_${today}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Excel export failed:", error);
      toast.error("Failed to build Excel file");
    } finally {
      setDownloadingXlsx(false);
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="container mx-auto p-6">
          <div className="flex justify-center items-center h-64">
            <span className="loading loading-spinner loading-lg" />
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="container mx-auto p-6 max-w-6xl">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between mb-6">
          <h1 className="text-2xl sm:text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            My Classroom Talk Data
          </h1>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <button onClick={() => setShowUploadModal(true)} className="btn btn-primary gap-2">
              <Mic className="w-5 h-5" />
              Record
            </button>
          </div>
        </div>

        <div className="card bg-base-100 shadow-xl mb-6">
          <div className="card-body">
            <h2 className="card-title text-2xl mb-4">Profile</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="rounded-lg bg-base-200 p-4 flex items-start gap-3 min-w-0">
                <User className="w-6 h-6 text-primary shrink-0 mt-0.5" aria-hidden="true" />
                <div className="min-w-0">
                  <p className="text-xs text-base-content/60">Name</p>
                  <p className="font-semibold text-lg break-words">{teacher?.name || user?.name || "N/A"}</p>
                </div>
              </div>
              <div className="rounded-lg bg-base-200 p-4 flex items-start gap-3 min-w-0">
                <Mail className="w-6 h-6 text-secondary shrink-0 mt-0.5" aria-hidden="true" />
                <div className="min-w-0">
                  <p className="text-xs text-base-content/60">Email</p>
                  <p className="font-semibold text-base break-all">{teacher?.email || user?.email || "N/A"}</p>
                </div>
              </div>
              <div className="rounded-lg bg-base-200 p-4 flex items-start gap-3 min-w-0">
                <Building2 className="w-6 h-6 text-accent shrink-0 mt-0.5" aria-hidden="true" />
                <div className="min-w-0">
                  <p className="text-xs text-base-content/60">School</p>
                  <p className="font-semibold text-lg break-words">{teacher?.center || "N/A"}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <TeacherClassroomTalkSections
          assessments={assessments}
          cohortThresholdsByCategory={cohortThresholdsByCategory}
          emptyTranscriptMessage="No transcripts yet. Upload a classroom recording to get started."
          headerAction={
            <button
              type="button"
              onClick={handleDownloadXlsx}
              disabled={downloadingXlsx}
              className="btn btn-primary btn-sm gap-2"
              title="Download all transcripts and per-category word counts as an Excel file"
            >
              {downloadingXlsx ? (
                <span className="loading loading-spinner loading-xs" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              Download All
            </button>
          }
          renderCard={(assessment) => (
            <TranscriptRecordCard
              key={assessment._id}
              id={String(assessment._id)}
              date={assessment.date}
              activity={assessment.activity}
              activityContext={assessment.activityContext}
              location={assessment.location}
              durationSeconds={assessment.durationSeconds}
              wordCount={assessment.wordCount}
              wordsPerMinute={assessment.wordsPerMinute}
              categoryWPM={assessment.categoryWPM}
              categoryWordCount={assessment.categoryWordCount}
              languageFeatures={assessment.languageFeatures}
              transcript={assessment.transcript}
              ragSegments={assessment.ragSegments}
              onDelete={() => handleDeleteTeacherAssessment(assessment._id)}
              observationComments={assessment.observationComments}
              observationNote={assessment.observationNote}
              hidden={assessment.hidden}
              canHide={assessment.canHide}
              isPreviewing={isPreviewing}
              onSaveNote={(text) => handleSaveProfileNote(assessment, text)}
              onToggleHidden={(nextHidden) =>
                handleToggleProfileHidden(assessment, nextHidden)
              }
            />
          )}
        />
      </div>

      {showUploadModal && (
        <ClassroomUploadModal
          isAdmin={false}
          onSuccess={handleUploadSuccess}
          onClose={() => setShowUploadModal(false)}
        />
      )}
    </AppLayout>
  );
};

export default TeacherProfilePage;
