import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import AppLayout from "../components/AppLayout";
import { ArrowLeft, User, Mail, Building2, Download, Mic, Shield } from "lucide-react";
import axios from "../lib/axios";
import toast from "react-hot-toast";
import { useAuth } from "../contexts/AuthContext";
import { getPrimaryChildId } from "../utils/parentChildren.js";
import ClassroomUploadModal from "../components/ClassroomUploadModal";
import TranscriptRecordCard from "../components/TranscriptRecordCard.jsx";
import TeacherClassroomTalkSections from "../components/TeacherClassroomTalkSections.jsx";
import { useViewAs } from "../contexts/ViewAsContext";
import {
  saveObservationNote,
  setObservationHidden,
  mergeObservationPatch,
} from "../lib/observationApi.js";

const TeacherDataDetailPage = () => {
  const { username: usernameOrId } = useParams();
  const teacherId = usernameOrId;
  const navigate = useNavigate();
  const { user, isTeacher, isParent } = useAuth();
  const { isPreviewing } = useViewAs();
  const [teacher, setTeacher] = useState(null);
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState("dotmatrix");
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [cohortThresholdsByCategory, setCohortThresholdsByCategory] = useState(null);
  const [parentAccessDenied, setParentAccessDenied] = useState(false);
  const [teacherStub, setTeacherStub] = useState(null);
  const [requestingAccess, setRequestingAccess] = useState(false);

  const isViewingOwnPage = isTeacher() && teacher && (String(user?.id) === String(teacher._id) || user?.username === (teacher.username || ''));

  const handleSaveTeacherNote = async (assessment, text) => {
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

  const handleToggleTeacherHidden = async (assessment, hidden) => {
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

  const handleUploadSuccess = () => {
    setShowUploadModal(false);
    if (teacher?._id) {
      axios.get(`/api/assessments/teacher/${teacher._id}`).then((res) => {
        setAssessments(res.data?.assessments || []);
      }).catch(() => {});
    }
  };

  const handleDeleteTeacherAssessment = async (assessmentId) => {
    try {
      await axios.delete(`/api/assessments/teacher/${assessmentId}`);
      toast.success("Transcript deleted successfully");
      if (!teacher?._id) return;
      const [assessmentsRes, cohortRes] = await Promise.all([
        axios.get(`/api/assessments/teacher/${teacher._id}`),
        axios.get(`/api/assessments/cohort-stats/teachers`)
      ]);
      setAssessments(assessmentsRes.data?.assessments || []);
      setCohortThresholdsByCategory(cohortRes.data?.cohortStats || null);
    } catch (error) {
      const msg = error.response?.data?.message || "Failed to delete transcript";
      toast.error(msg);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!teacherId) return;
      try {
        setLoading(true);
        setParentAccessDenied(false);
        setTeacherStub(null);
        let teacherRes;
        try {
          teacherRes = await axios.get(`/api/teachers/${teacherId}`);
        } catch (err) {
          const d = err.response?.data;
          if (err.response?.status === 403 && d?.code === "PARENT_TEACHER_ACCESS_DENIED") {
            setParentAccessDenied(true);
            setTeacherStub(d.teacher || null);
            setTeacher(null);
            setAssessments([]);
            return;
          }
          setTeacher(null);
          throw err;
        }
        const t = teacherRes.data?.teacher || null;
        setTeacher(t);
        if (t) {
          const [assessmentsRes, cohortRes] = await Promise.all([
            axios.get(`/api/assessments/teacher/${t._id}`).catch(() => ({ data: { assessments: [] } })),
            axios.get(`/api/assessments/cohort-stats/teachers`).catch(() => ({ data: { cohortStats: null } })),
          ]);
          setAssessments(assessmentsRes.data?.assessments || []);
          setCohortThresholdsByCategory(cohortRes.data?.cohortStats || null);
        }
      } catch (error) {
        console.error("Error fetching teacher data:", error);
        toast.error("Failed to load teacher data");
        setTeacher(null);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [teacherId]);

  const handleRequestTeacherAccess = async () => {
    const tid = teacherStub?._id;
    const cid = getPrimaryChildId(user);
    if (!tid || !cid) {
      toast.error("Missing teacher or child");
      return;
    }
    setRequestingAccess(true);
    try {
      await axios.post("/api/access/request-teacher-view", {
        teacherId: tid,
        childId: cid,
      });
      toast.success("Request sent. The teacher must approve before you can view their data.");
    } catch (e) {
      toast.error(e.response?.data?.message || "Could not send request");
    } finally {
      setRequestingAccess(false);
    }
  };

  const transcriptsWithContent = assessments.filter((a) => a.transcript?.trim());

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

  if (isParent() && parentAccessDenied && teacherStub) {
    return (
      <AppLayout>
        <div className="container mx-auto p-6 max-w-lg">
          <button type="button" onClick={() => navigate(`/data/child/${getPrimaryChildId(user)}`)} className="btn btn-ghost btn-circle mb-4">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <h2 className="card-title">Access: {teacherStub.name || "Teacher"}</h2>
              <p className="text-base-content/80">
                You don&apos;t have permission to view this teacher&apos;s classroom data yet. Send a request so they
                can approve access for your child.
              </p>
              <button
                type="button"
                className="btn btn-primary gap-2 mt-2"
                disabled={requestingAccess}
                onClick={handleRequestTeacherAccess}
              >
                <Shield className="w-4 h-4" />
                {requestingAccess ? "Sending…" : "Request access"}
              </button>
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!teacher) {
    return (
      <AppLayout>
        <div className="container mx-auto p-6">
          <div className="alert alert-warning">
            <span>Teacher not found</span>
          </div>
          <button onClick={() => navigate(-1)} className="btn btn-ghost mt-4">
            Go back
          </button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="container mx-auto p-6 max-w-6xl">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between mb-6">
          <div className="flex items-start gap-3 min-w-0">
            <button onClick={() => navigate(-1)} className="btn btn-ghost btn-circle shrink-0" title="Go back">
              <ArrowLeft className="w-6 h-6" />
            </button>
            <h1 className="text-2xl sm:text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent break-words">
              {teacher.name}'s Classroom Talk Data
            </h1>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {/* Upload is teacher-only (own page): admin classroom upload was
                removed by the add-coach-role change. */}
            {isViewingOwnPage && (
              <button onClick={() => setShowUploadModal(true)} className="btn btn-primary gap-2">
                <Mic className="w-5 h-5" />
                Record
              </button>
            )}
            <div className="form-control">
            <select
              className="select select-bordered select-primary"
              value={viewMode}
              onChange={(e) => setViewMode(e.target.value)}
            >
              <option value="dotmatrix">Dot Matrix</option>
              <option value="semicircular">Semicircular Dials</option>
            </select>
            </div>
          </div>
        </div>

        <div className="card bg-base-100 shadow-xl mb-6">
          <div className="card-body">
            <h2 className="card-title text-2xl mb-4">Teacher Information</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="rounded-lg bg-base-200 p-4 flex items-start gap-3 min-w-0">
                <User className="w-6 h-6 text-primary shrink-0 mt-0.5" aria-hidden="true" />
                <div className="min-w-0">
                  <p className="text-xs text-base-content/60">Name</p>
                  <p className="font-semibold text-lg break-words">{teacher.name}</p>
                </div>
              </div>
              <div className="rounded-lg bg-base-200 p-4 flex items-start gap-3 min-w-0">
                <Mail className="w-6 h-6 text-secondary shrink-0 mt-0.5" aria-hidden="true" />
                <div className="min-w-0">
                  <p className="text-xs text-base-content/60">Email</p>
                  <p className="font-semibold text-base break-all">{teacher.email}</p>
                </div>
              </div>
              <div className="rounded-lg bg-base-200 p-4 flex items-start gap-3 min-w-0">
                <Building2 className="w-6 h-6 text-accent shrink-0 mt-0.5" aria-hidden="true" />
                <div className="min-w-0">
                  <p className="text-xs text-base-content/60">School</p>
                  <p className="font-semibold text-lg break-words">{teacher.center}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <TeacherClassroomTalkSections
          assessments={assessments}
          viewMode={viewMode}
          cohortThresholdsByCategory={cohortThresholdsByCategory}
          emptyTranscriptMessage="No transcripts yet for this teacher."
          headerAction={
            <button
              onClick={() => {
                const text = [...transcriptsWithContent]
                  .sort((a, b) => new Date(b.date) - new Date(a.date))
                  .map((a) => {
                    const dateStr = new Date(a.date).toLocaleDateString("en-US", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    });
                    const activityLine = a.activity ? `Activity: ${a.activity}\n` : "";
                    const locationLine = a.location ? `Location: ${a.location}\n` : "";
                    return `=== Transcript from ${dateStr} ===\n${activityLine}${locationLine}${a.uploadedBy ? `Uploaded by: ${a.uploadedBy}\n` : ""}${a.transcript}\n\n`;
                  })
                  .join("\n");
                const blob = new Blob([text], { type: "text/plain" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `${teacher.name}_transcripts_${new Date().toISOString().split("T")[0]}.txt`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                toast.success("All transcripts downloaded");
              }}
              className="btn btn-primary btn-sm gap-2"
            >
              <Download className="w-4 h-4" />
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
              transcript={assessment.transcript}
              ragSegments={assessment.ragSegments}
              onDelete={() => handleDeleteTeacherAssessment(assessment._id)}
              observationComments={assessment.observationComments}
              observationNote={assessment.observationNote}
              hidden={assessment.hidden}
              canHide={assessment.canHide}
              isPreviewing={isPreviewing}
              onSaveNote={(text) => handleSaveTeacherNote(assessment, text)}
              onToggleHidden={(nextHidden) =>
                handleToggleTeacherHidden(assessment, nextHidden)
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

export default TeacherDataDetailPage;
