import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router";
import AppLayout from "../components/AppLayout";
import { ArrowLeft, User, UserRound, Calendar, Languages, Stethoscope, Users, School, ChevronDown, FileText, BookOpen, MessageCircle, Microscope, Brain, Download, Mail, Lock } from "lucide-react";
import { LanguageDevelopmentCharts } from "../components/LanguageDevelopmentCharts";
import axios from "../lib/axios";
import toast from "react-hot-toast";
import { useAuth } from "../contexts/AuthContext";
import { getPrimaryChildId, parentHasAccessToChild } from "../utils/parentChildren.js";
import { classroomRefId, classroomRefName } from "../utils/classroomMembershipUi.js";
import { compareAssessmentsNewestFirst } from "../utils/assessmentSort.js";
import TranscriptRecordCard from "../components/TranscriptRecordCard.jsx";
import TranscriptList from "../components/TranscriptList.jsx";
import HomeTalkSharingPanel from "../components/HomeTalkSharingPanel.jsx";
import HomeTranscriptAccessPanel from "../components/HomeTranscriptAccessPanel.jsx";
import CurrentlyAccessingButton from "../components/CurrentlyAccessingButton.jsx";
import { fetchHomeAccessState } from "../lib/homeAccessApi.js";
import {
  staffHomeStatusFrom,
  staffHasTranscriptAccess,
  HOME_ACCESS_STATUS,
} from "../utils/homeViewAccess.js";
import { userCan } from "../lib/permissions.js";
import { useViewAs } from "../contexts/ViewAsContext";
import RolePreviewEmpty from "../components/RolePreviewEmpty";
import { isPreviewChildSegment, shouldLoadLiveRoleData } from "../lib/viewAs.js";
import {
  saveObservationNote,
  setObservationHidden,
  mergeObservationPatch,
} from "../lib/observationApi.js";

const ChildDataPage = () => {
  const { childId } = useParams();
  const navigate = useNavigate();
  const { user, isParent, isAdmin, isTeacher } = useAuth();
  const { isPreviewing } = useViewAs();
  const previewChildPage = isPreviewChildSegment(childId);
  const [child, setChild] = useState(null);
  const [parentChildren, setParentChildren] = useState([]);
  const [loadingParentChildren, setLoadingParentChildren] = useState(false);
  const [loading, setLoading] = useState(true);
  const [allAssessments, setAllAssessments] = useState([]);
  const [viewMode, setViewMode] = useState("dotmatrix"); // "dotmatrix" or "semicircular"
  /** Home view access state: parents get the full sharing state, staff their own status. */
  const [homeAccess, setHomeAccess] = useState(null);
  const [loadingHomeAccess, setLoadingHomeAccess] = useState(false);
  const [classmates, setClassmates] = useState([]);
  const [loadingClassmates, setLoadingClassmates] = useState(false);
  const [cohortThresholdsByCategory, setCohortThresholdsByCategory] = useState(null);
  /** Teacher must have parent-approved access; until then show invite UI */
  const [teacherAccessDenied, setTeacherAccessDenied] = useState(false);
  const [childPreview, setChildPreview] = useState(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [sendingInvite, setSendingInvite] = useState(false);
  /** True when an invitation already exists for this child (teacher access-denied panel) */
  const [parentInviteAlreadySent, setParentInviteAlreadySent] = useState(false);

  useEffect(() => {
    if (previewChildPage || !shouldLoadLiveRoleData(isPreviewing) || !isParent()) return;
    let cancelled = false;
    const fetchParentChildren = async () => {
      try {
        setLoadingParentChildren(true);
        const response = await axios.get("/api/children");
        if (!cancelled) {
          setParentChildren(Array.isArray(response.data?.children) ? response.data.children : []);
        }
      } catch {
        if (!cancelled) setParentChildren([]);
      } finally {
        if (!cancelled) setLoadingParentChildren(false);
      }
    };
    fetchParentChildren();
    return () => {
      cancelled = true;
    };
  }, [isParent, user?.id, isPreviewing, previewChildPage]);

  useEffect(() => {
    if (!teacherAccessDenied || !childPreview?._id) {
      setParentInviteAlreadySent(false);
      return;
    }
    const cid = String(childPreview._id);
    axios
      .get("/api/invitations/list")
      .then((res) => {
        const has = (res.data?.invitations || []).some((inv) => {
          if (Array.isArray(inv.childIds) && inv.childIds.length) {
            return inv.childIds.some((id) => String(id) === cid);
          }
          return String(inv.childId) === cid;
        });
        setParentInviteAlreadySent(has);
      })
      .catch(() => setParentInviteAlreadySent(false));
  }, [teacherAccessDenied, childPreview]);

  useEffect(() => {
    if (previewChildPage || !shouldLoadLiveRoleData(isPreviewing)) {
      setChild(null);
      setLoading(false);
      return;
    }
    const fetchChild = async () => {
      try {
        setLoading(true);
        setTeacherAccessDenied(false);
        setChildPreview(null);
        const response = await axios.get(`/api/children/${childId}`);
        const childData = response.data.child;
        
        if (!childData) {
          console.error("No child data received from API");
          setChild(null);
          setLoading(false);
          return;
        }
        
        // If user is a parent, verify they have access to this child
        if (user?.role === 'parent') {
          const currentChildId = childData._id?.toString() || childData.id?.toString();
          if (!parentHasAccessToChild(user, currentChildId)) {
            toast.error("You don't have access to this child's data");
            const fallback = getPrimaryChildId(user);
            if (fallback) navigate(`/data/child/${fallback}`, { replace: true });
            return;
          }
        }
        
        setTeacherAccessDenied(false);
        setChildPreview(null);
        setChild(childData);
      } catch (error) {
        console.error("Error fetching child:", error);
        const errData = error.response?.data;
        if (error.response?.status === 403 && errData?.code === "TEACHER_ACCESS_DENIED" && errData?.child) {
          setTeacherAccessDenied(true);
          setChildPreview(errData.child);
          setChild(null);
          return;
        }
        if (error.response?.status === 403) {
          toast.error(errData?.message || "You don't have access to this child's data");
          if (user?.role === 'parent') {
            const fallback = getPrimaryChildId(user);
            if (fallback) navigate(`/data/child/${fallback}`, { replace: true });
          } else if (user?.role !== 'teacher') {
            navigate("/home");
          }
        }
        setChild(null);
      } finally {
        setLoading(false);
      }
    };

    fetchChild();
  }, [childId, user, navigate, isPreviewing, previewChildPage]);

  // Load all assessments from database for aggregation
  useEffect(() => {
    if (previewChildPage || !shouldLoadLiveRoleData(isPreviewing)) {
      setAllAssessments([]);
      return;
    }
    const fetchAllAssessments = async () => {
      if (childId) {
        try {
          const response = await axios.get(`/api/assessments/child/${childId}`);
          setAllAssessments(response.data.assessments || []);
        } catch (error) {
          console.error("Error fetching all assessments:", error);
          setAllAssessments([]);
        }
      }
    };

    fetchAllAssessments();
  }, [childId, isPreviewing, previewChildPage]);

  // Home view access state — drives the parent sharing panel and the staff home tab gate.
  const refreshHomeAccess = async () => {
    if (!childId) return;
    try {
      const state = await fetchHomeAccessState(childId);
      setHomeAccess(state);
    } catch {
      setHomeAccess(null);
    }
  };

  useEffect(() => {
    if (previewChildPage || !shouldLoadLiveRoleData(isPreviewing) || !childId || !user?.role) return;
    let cancelled = false;
    setLoadingHomeAccess(true);
    fetchHomeAccessState(childId)
      .then((state) => {
        if (!cancelled) setHomeAccess(state);
      })
      .catch(() => {
        if (!cancelled) setHomeAccess(null);
      })
      .finally(() => {
        if (!cancelled) setLoadingHomeAccess(false);
      });
    return () => {
      cancelled = true;
    };
  }, [childId, user?.id, user?.role, isPreviewing, previewChildPage]);

  // Load cohort WPM stats for children (used for semicircular dial zones)
  useEffect(() => {
    if (previewChildPage || !shouldLoadLiveRoleData(isPreviewing)) {
      setCohortThresholdsByCategory(null);
      return;
    }
    axios.get(`/api/assessments/cohort-stats/children`).then((res) => {
      setCohortThresholdsByCategory(res.data?.cohortStats || null);
    }).catch(() => setCohortThresholdsByCategory(null));
  }, [isPreviewing, previewChildPage]);

  // Classmates: roster members from shared classrooms (admin / teacher only).
  useEffect(() => {
    if (previewChildPage || !shouldLoadLiveRoleData(isPreviewing) || teacherAccessDenied || !(isAdmin() || isTeacher())) {
      setClassmates([]);
      return;
    }
    const rooms = child?.classrooms;
    if (!Array.isArray(rooms) || rooms.length === 0) {
      setClassmates([]);
      return;
    }
    let cancelled = false;
    const loadClassmates = async () => {
      setLoadingClassmates(true);
      try {
        const roomIds = [...new Set(rooms.map(classroomRefId).filter(Boolean))];
        const results = await Promise.allSettled(
          roomIds.map((id) => axios.get(`/api/classrooms/${id}`))
        );
        if (cancelled) return;
        const seen = new Set();
        const mates = [];
        const currentId = String(childId);
        for (const result of results) {
          if (result.status !== "fulfilled") continue;
          for (const c of result.value.data?.classroom?.children || []) {
            const id = String(c.id ?? c._id ?? "");
            if (!id || id === currentId || seen.has(id)) continue;
            seen.add(id);
            mates.push({ id, name: c.name || "Child" });
          }
        }
        mates.sort((a, b) => a.name.localeCompare(b.name));
        setClassmates(mates);
      } catch (error) {
        console.error("Error loading classmates:", error);
        if (!cancelled) setClassmates([]);
      } finally {
        if (!cancelled) setLoadingClassmates(false);
      }
    };
    loadClassmates();
    return () => {
      cancelled = true;
    };
  }, [child, childId, teacherAccessDenied, isAdmin, isTeacher, isPreviewing, previewChildPage]);

  const handleSendInviteToParent = async () => {
    if (!inviteEmail.trim()) {
      toast.error("Please enter the parent's email address");
      return;
    }
    const cid = childPreview?._id || childId;
    if (!cid) {
      toast.error("Missing child");
      return;
    }
    setSendingInvite(true);
    try {
      const response = await axios.post("/api/invitations/send", {
        email: inviteEmail.trim(),
        childId: cid,
      });
      if (response.data.warning || response.data.invitation?.invitationLink) {
        const link =
          response.data.invitation?.invitationLink ||
          response.data.invitationLink ||
          `${window.location.origin}/parent/register?token=${response.data.invitation?.token}`;
        toast.error("Invitation created but email may have failed. Copy the link if needed.", { duration: 8000 });
        navigator.clipboard.writeText(link).then(() => toast.success("Invitation link copied"));
      } else {
        toast.success("Invitation sent. The parent must register or accept before you can view this page.");
      }
      setParentInviteAlreadySent(true);
      setInviteEmail("");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to send invitation");
    } finally {
      setSendingInvite(false);
    }
  };

  const handleSaveChildNote = async (assessment, text) => {
    try {
      const payload = await saveObservationNote("child", assessment._id, text);
      setAllAssessments((rows) =>
        rows.map((row) =>
          String(row._id) === String(assessment._id)
            ? mergeObservationPatch(row, payload)
            : row
        )
      );
      toast.success("Note saved");
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not save note");
    }
  };

  const handleToggleChildHidden = async (assessment, hidden) => {
    try {
      const payload = await setObservationHidden("child", assessment._id, hidden);
      setAllAssessments((rows) =>
        rows.map((row) =>
          String(row._id) === String(assessment._id)
            ? mergeObservationPatch(row, payload)
            : row
        )
      );
      const cohortRes = await axios
        .get(`/api/assessments/cohort-stats/children`)
        .catch(() => ({ data: { cohortStats: null } }));
      setCohortThresholdsByCategory(cohortRes.data?.cohortStats || null);
      toast.success(hidden ? "Observation hidden" : "Observation visible");
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not update visibility");
    }
  };

  const handleDeleteChildAssessment = async (assessmentId) => {
    try {
      await axios.delete(`/api/assessments/child/${assessmentId}`);
      toast.success("Transcript deleted successfully");
      const assessmentsRes = await axios.get(`/api/assessments/child/${childId}`);
      setAllAssessments(assessmentsRes.data.assessments || []);
      const cohortRes = await axios.get(`/api/assessments/cohort-stats/children`);
      setCohortThresholdsByCategory(cohortRes.data?.cohortStats || null);
    } catch (error) {
      const msg = error.response?.data?.message || "Failed to delete transcript";
      toast.error(msg);
    }
  };

  // The child data page shows home talk only — classroom talk lives on the
  // classroom homepage. The API already serves home-context rows exclusively
  // (staff receive them only under an active parent grant).
  const viewAssessments = useMemo(
    () => (Array.isArray(allAssessments) ? allAssessments : []),
    [allAssessments]
  );
  const isStaffUser = user?.role === 'teacher' || user?.role === 'admin' || user?.role === 'coach';
  const staffHomeStatus = isStaffUser ? staffHomeStatusFrom(homeAccess) : null;
  /** Staff without a parent grant see the privacy gate instead of home data. */
  const staffHomeLocked =
    isStaffUser && staffHomeStatus !== HOME_ACCESS_STATUS.GRANTED;
  /**
   * Transcript tier: the parent's grant covers visualizations only. Staff
   * see transcript text only when an admin set transcriptAccess on their
   * grant (the API strips it otherwise — this only controls the UI).
   */
  const canViewTranscripts =
    !isStaffUser || staffHasTranscriptAccess(homeAccess);

  // Get language development data from latest assessment
  // Average words per minute across all assessments with duration data
  const averageWPM = useMemo(() => {
    const validWPM = (Array.isArray(viewAssessments) ? viewAssessments : [])
      .map((a) => a?.wordsPerMinute)
      .filter((w) => w != null && !isNaN(w));
    if (validWPM.length === 0) return null;
    return validWPM.reduce((s, w) => s + w, 0) / validWPM.length;
  }, [viewAssessments]);

  // Average WPM per category (science, social, literature, language)
  const averageCategoryWPM = useMemo(() => {
    const cats = ['science', 'social', 'literature', 'language'];
    const result = {};
    cats.forEach((cat) => {
      const valid = (Array.isArray(viewAssessments) ? viewAssessments : [])
        .map((a) => a?.categoryWPM?.[cat])
        .filter((w) => w != null && !isNaN(w));
      result[cat] = valid.length > 0 ? valid.reduce((s, w) => s + w, 0) / valid.length : null;
    });
    return result;
  }, [viewAssessments]);

  // Calculate age in months from date of birth
  const calculateAgeInMonths = (dateOfBirth) => {
    if (!dateOfBirth) return "N/A";
    
    const birthDate = new Date(dateOfBirth);
    const today = new Date();
    
    // Calculate difference in months
    const yearsDiff = today.getFullYear() - birthDate.getFullYear();
    const monthsDiff = today.getMonth() - birthDate.getMonth();
    
    const totalMonths = yearsDiff * 12 + monthsDiff;
    
    // If the day of month hasn't occurred yet this month, subtract one
    if (today.getDate() < birthDate.getDate()) {
      return Math.max(0, totalMonths - 1);
    }
    
    return totalMonths;
  };

  const ageInMonths = calculateAgeInMonths(child?.dateOfBirth);
  const enrolledClassrooms = Array.isArray(child?.classrooms) ? child.classrooms : [];
  const classroomCount = enrolledClassrooms.length;

  if (previewChildPage) {
    return (
      <AppLayout breadcrumbs={[{ label: "My Child's Data", href: "/data/child/preview" }]}>
        <div className="container mx-auto p-4 md:p-6 max-w-6xl">
          <h1 className="text-2xl sm:text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-2">
            My Child&apos;s Data
          </h1>
          <p className="text-base-content/70 mb-6">
            Home talk charts, transcripts, and notes a parent sees for their child.
          </p>
          <RolePreviewEmpty title="No home recordings yet" icon={User}>
            Parents review their child&apos;s home talk here. This is a general preview —
            no family&apos;s recordings or transcripts are loaded.
          </RolePreviewEmpty>
        </div>
      </AppLayout>
    );
  }

  if (loading) {
    return (
      <AppLayout>
        <div className="container mx-auto p-6">
          <div className="flex justify-center items-center h-64">
            <span className="loading loading-spinner loading-lg"></span>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!child && !(isTeacher() && teacherAccessDenied && childPreview)) {
    return (
      <AppLayout>
        <div className="container mx-auto p-6">
          <div className="alert alert-warning">
            <span>Child not found</span>
          </div>
        </div>
      </AppLayout>
    );
  }

  const displayChild = child || childPreview;
  const showFullProfile = !!child && !teacherAccessDenied;

  return (
    <AppLayout>
      <div className="container mx-auto p-4 md:p-6 max-w-6xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
          <div className="flex items-center gap-2 sm:gap-4 min-w-0">
            {user?.role !== 'parent' && (
            <button
              onClick={() => navigate("/data")}
              className="btn btn-ghost btn-circle flex-shrink-0"
            >
              <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
            )}
            <h1 className="text-2xl sm:text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent truncate">
              {displayChild?.name || 'Child'}&apos;s Data
            </h1>
          </div>
          <div className="flex items-end justify-end gap-2 sm:gap-3 flex-wrap">
            {showFullProfile && !staffHomeLocked && (
              <CurrentlyAccessingButton place="home" targetId={childId} />
            )}
            {isParent() && showFullProfile && (
              <div className="form-control">
                <label className="label py-0 pb-1">
                  <span className="label-text text-xs">Child</span>
                </label>
                <select
                  className="select select-bordered select-primary min-w-[180px]"
                  value={String(child?._id || childId || "")}
                  disabled={loadingParentChildren}
                  onChange={(e) => {
                    const nextId = e.target.value;
                    if (nextId && String(nextId) !== String(childId)) {
                      navigate(`/data/child/${nextId}`);
                    }
                  }}
                >
                  {loadingParentChildren ? (
                    <option value={String(child?._id || childId || "")}>Loading children...</option>
                  ) : parentChildren.length > 0 ? (
                    parentChildren.map((pc) => (
                      <option key={pc._id || pc.id} value={String(pc._id || pc.id)}>
                        {pc.name}
                      </option>
                    ))
                  ) : (
                    <option value={String(child?._id || childId || "")}>
                      {child?.name || "Selected child"}
                    </option>
                  )}
                </select>
              </div>
            )}
            {showFullProfile && (
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
            )}
          </div>
        </div>

        {isTeacher() && teacherAccessDenied && childPreview && (
          <div className="card bg-base-100 shadow-xl mb-6 border border-warning/30">
            <div className="card-body">
              <h2 className="card-title text-xl">Full access pending</h2>
              <p className="text-base-content/80">
                Classroom transcripts for this child are shown below.
                Send an invitation for full profile access (charts and all demographics).
              </p>
              <div className="form-control w-full mt-2">
                <label className="label"><span className="label-text">Parent email</span></label>
                {parentInviteAlreadySent ? (
                  <div className="flex items-center gap-2">
                    <span className="badge badge-lg badge-ghost border border-base-300 px-4 py-3">
                      Invited
                    </span>
                    <span className="text-sm text-base-content/60">
                      An invitation was already sent for this child.
                    </span>
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="email"
                      className="input input-bordered flex-1"
                      placeholder="parent@example.com"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                    />
                    <button
                      type="button"
                      className="btn btn-primary gap-2"
                      disabled={sendingInvite}
                      onClick={handleSendInviteToParent}
                    >
                      <Mail className="w-4 h-4" />
                      {sendingInvite ? "Sending…" : "Send invitation"}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {showFullProfile && (
        <>
        {/* Parent sharing controls for home talk data */}
        {isParent() && (
          <HomeTalkSharingPanel
            childId={childId}
            state={homeAccess}
            loading={loadingHomeAccess}
            onChanged={refreshHomeAccess}
          />
        )}

        {/* Admin-only transcript tier management for this child's active grants */}
        {userCan(user, "grantHomeTranscriptAccess") && (
          <HomeTranscriptAccessPanel
            childId={childId}
            state={homeAccess}
            onChanged={refreshHomeAccess}
          />
        )}

        {staffHomeLocked && (
          <div className="card bg-base-100 shadow-xl mb-6 border border-warning/30">
            <div className="card-body items-center text-center">
              <Lock className="w-10 h-10 text-warning" />
              <h2 className="card-title text-xl">Home talk data is private</h2>
              <p className="text-base-content/70 max-w-lg">
                Home charts open automatically when you share a classroom with{" "}
                {displayChild?.name || "this child"}&apos;s parent, unless they were turned off.
                Transcript words stay admin-gated.
              </p>
            </div>
          </div>
        )}

        {/* Child Info Card */}
        <div className="card bg-base-100 shadow-xl mb-6">
          <div className="card-body">
            <h2 className="card-title text-2xl mb-4">Student Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="stat bg-base-200 rounded-lg">
                <div className="stat-figure text-primary">
                  <User className="w-8 h-8" />
                </div>
                <div className="stat-title">Full Name</div>
                <div className="stat-value text-2xl">
                  {child?.name || 'N/A'}
                </div>
              </div>

              <div className="stat bg-base-200 rounded-lg">
                <div className="stat-figure text-secondary">
                  <Calendar className="w-8 h-8" />
                </div>
                <div className="stat-title">Age</div>
                <div className="stat-value text-2xl">{ageInMonths} months</div>
                <div className="stat-desc text-xs text-base-content/60">
                  Born: {child.dateOfBirth ? new Date(child.dateOfBirth).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}
                </div>
              </div>

              <div className="stat bg-base-200 rounded-lg min-w-0">
                <div className="stat-figure text-accent">
                  <UserRound className="w-8 h-8" />
                </div>
                <div className="stat-title">Gender</div>
                <div className="stat-value text-2xl">{child.gender}</div>
              </div>

              <div className="stat bg-base-200 rounded-lg">
                <div className="stat-figure text-info">
                  <Languages className="w-8 h-8" />
                </div>
                <div className="stat-title">Primary Language</div>
                <div className="stat-value text-2xl">{child.primaryLanguage}</div>
              </div>

              <div className="stat bg-base-200 rounded-lg min-w-0">
                <div className="stat-figure text-primary opacity-90">
                  <School className="w-8 h-8" />
                </div>
                <div className="stat-title">Classrooms</div>
                <div className="stat-value text-2xl">
                  {classroomCount > 0 ? classroomCount : "—"}
                </div>
                <div className="stat-desc min-w-0">
                  {classroomCount === 0 ? (
                    <span className="text-base-content/60">Not enrolled yet</span>
                  ) : (
                    <div className="dropdown dropdown-top dropdown-start">
                      <button
                        type="button"
                        tabIndex={0}
                        className="btn btn-ghost btn-xs h-auto min-h-0 py-0 px-0 gap-1 font-normal text-primary normal-case"
                        aria-label={`View ${classroomCount} enrolled classroom${classroomCount === 1 ? "" : "s"}`}
                      >
                        <span className="truncate max-w-[9rem]">
                          {classroomCount === 1
                            ? classroomRefName(enrolledClassrooms[0])
                            : `View all ${classroomCount}`}
                        </span>
                        <ChevronDown className="w-3 h-3 shrink-0 opacity-70" />
                      </button>
                      <ul
                        tabIndex={0}
                        className="dropdown-content z-[20] menu p-2 shadow-lg bg-base-100 rounded-box w-56 border max-h-48 overflow-y-auto"
                      >
                        {enrolledClassrooms.map((room) => {
                          const id = classroomRefId(room);
                          const name = classroomRefName(room);
                          return (
                            <li key={id}>
                              <span className="truncate" title={name}>
                                {name}
                              </span>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  )}
                </div>
              </div>

              <div className="stat bg-base-200 rounded-lg">
                <div className="stat-figure text-warning">
                  <Stethoscope className="w-8 h-8" />
                </div>
                <div className="stat-title">Diagnosis</div>
                <div className="stat-value text-2xl">
                  <span
                    className={`badge ${
                      child.diagnosis === "Yes" ? "badge-warning" : "badge-success"
                    } badge-lg`}
                  >
                    {child.diagnosis}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Classmates — other children in the same classroom roster (staff only). */}
        {(isAdmin() || isTeacher()) &&
          !teacherAccessDenied &&
          Array.isArray(child?.classrooms) &&
          child.classrooms.length > 0 && (
          <div className="card bg-base-100 shadow-xl mb-6">
            <div className="card-body">
              <h2 className="card-title text-2xl mb-4 flex items-center gap-2">
                <Users className="w-6 h-6 text-primary" />
                Classmates
              </h2>
              <div className="divider"></div>
              {loadingClassmates ? (
                <div className="py-4 flex justify-center">
                  <span className="loading loading-spinner loading-md text-primary" />
                </div>
              ) : classmates.length === 0 ? (
                <div className="alert alert-info">
                  <span>No other children in the same classroom yet</span>
                </div>
              ) : (
                <ul className="flex flex-wrap gap-2">
                  {classmates.map((mate) => (
                    <li key={mate.id}>
                      <button
                        type="button"
                        onClick={() => navigate(`/data/child/${mate.id}`)}
                        className="btn btn-sm btn-outline btn-primary gap-2"
                        title={`View ${mate.name}'s data`}
                      >
                        <User className="w-4 h-4" />
                        {mate.name}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}

        {staffHomeLocked ? null : viewAssessments.length === 0 ? (
          <div className="alert alert-info mb-6">
            <FileText className="w-5 h-5" />
            <span>
              No home talk recordings yet. Use the Record Activity page to capture talk at home.
              Classroom talk lives on the classroom&apos;s page.
            </span>
          </div>
        ) : (
          <LanguageDevelopmentCharts
            assessments={viewAssessments}
            viewMode={viewMode}
            title={`Language Development Analysis ${viewMode === "dotmatrix" ? "- Year Overview" : ""}`}
            contextSubtitle="At Home"
            showWordScores
            cohortThresholdsByCategory={cohortThresholdsByCategory}
          />
        )}

        {!staffHomeLocked && (
        <div className="card bg-base-100 shadow-xl mb-6">
            <div className="card-body">
              <h2 className="card-title flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Words Per Minute Summary
              </h2>
              <div className="divider"></div>
              <div className="flex flex-col gap-4 py-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { key: 'science', label: 'Science', color: 'text-blue-600' },
                    { key: 'social', label: 'Social', color: 'text-green-600' },
                    { key: 'literature', label: 'Literature', color: 'text-purple-600' },
                    { key: 'language', label: 'Language', color: 'text-orange-600' }
                  ].map(({ key, label, color }) => {
                    const val = averageCategoryWPM[key];
                    return (
                      <div key={key} className="stat bg-base-200 rounded-lg p-3">
                        <div className={`stat-title text-xs ${color}`}>{label}</div>
                        <div className={`stat-value text-xl ${color}`}>
                          {val != null ? `${Math.round(val * 10) / 10}` : '—'}
                        </div>
                        <div className="stat-desc text-[10px]">WPM</div>
                      </div>
                    );
                  })}
                </div>
                <div className="flex flex-col items-center pt-2 border-t border-base-300">
                  <div className="text-2xl font-bold text-primary">
                    {averageWPM != null ? `${Math.round(averageWPM * 10) / 10} WPM` : 'N/A'} <span className="text-sm font-normal text-base-content/60">(overall)</span>
                  </div>
                  <p className="text-sm text-base-content/60 mt-1">
                    {averageWPM != null
                      ? `Average across ${viewAssessments.filter((a) => a?.wordsPerMinute != null).length} recording(s)`
                      : 'WPM appears when assessments include duration data (e.g. from external ingest).'}
                  </p>
                </div>
              </div>
            </div>
        </div>
        )}

        </>
        )}

        {/* Aggregate-tier staff: charts are visible, transcripts are admin-gated. */}
        {!staffHomeLocked && isStaffUser && !canViewTranscripts && (
          <div className="card bg-base-100 shadow-xl mb-6 border border-base-300">
            <div className="card-body flex-row items-center gap-3">
              <Lock className="w-6 h-6 text-base-content/50 shrink-0" />
              <div>
                <h3 className="font-semibold">Transcripts are admin-gated</h3>
                <p className="text-sm text-base-content/70">
                  This grant shares home talk visualizations only. Transcript text
                  is visible only when an admin enables transcript access.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Transcripts — home talk only. Staff need an active parent grant PLUS the
            admin-set transcript tier (the API strips transcript text otherwise). */}
        {(isAdmin() || isParent() || isTeacher()) && !staffHomeLocked && canViewTranscripts && (
          <div className="card bg-base-100 shadow-xl mb-6">
            <div className="card-body">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
                <h2 className="card-title text-2xl flex items-center gap-2 min-w-0">
                  <FileText className="w-6 h-6 text-primary shrink-0" />
                  {showFullProfile ? "Home Talk Transcripts" : "Transcripts"}
                </h2>
                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                  <div className="text-sm text-base-content/60">
                    {viewAssessments.filter(a => a.transcript && a.transcript.trim()).length} transcript{viewAssessments.filter(a => a.transcript && a.transcript.trim()).length !== 1 ? 's' : ''} available
                  </div>
                  {viewAssessments.filter(a => a.transcript && a.transcript.trim()).length > 0 && (
                    <button
                      onClick={() => {
                        // Combine all transcripts into one file
                        const transcriptsWithDates = viewAssessments
                          .filter(a => a.transcript && a.transcript.trim())
                          .sort(compareAssessmentsNewestFirst)
                          .map((assessment) => {
                            const dateStr = new Date(assessment.date).toLocaleDateString('en-US', {
                              month: 'long',
                              day: 'numeric',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            });
                            const activityLine = assessment.activity ? `Activity: ${assessment.activity}\n` : '';
                            const locationLine = assessment.location ? `Location: ${assessment.location}\n` : '';
                            return `=== Transcript from ${dateStr} ===\n${activityLine}${locationLine}${assessment.uploadedBy ? `Uploaded by: ${assessment.uploadedBy}\n` : ''}${assessment.transcript}\n\n`;
                          });
                        
                        const allTranscriptsText = transcriptsWithDates.join('\n');
                        const blob = new Blob([allTranscriptsText], { type: 'text/plain' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `${displayChild?.name || 'child'}_home_talk_transcripts_${new Date().toISOString().split('T')[0]}.txt`;
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        URL.revokeObjectURL(url);
                        toast.success("All transcripts downloaded");
                      }}
                      className="btn btn-primary btn-sm gap-2"
                      title="Download all transcripts"
                    >
                      <Download className="w-4 h-4" />
                      Download All
                    </button>
                  )}
                </div>
              </div>

              {viewAssessments.filter(a => a.transcript && a.transcript.trim()).length === 0 ? (
                <div className="alert alert-info">
                  <FileText className="w-5 h-5" />
                  <span>
                    No home talk transcripts yet. They will appear here after home recordings are processed and accepted.
                  </span>
                </div>
              ) : (
                <TranscriptList
                  items={viewAssessments
                    .filter((a) => a.transcript && a.transcript.trim())
                    .sort(compareAssessmentsNewestFirst)}
                  emptyFilteredMessage="No transcripts in this date range."
                  renderItem={(assessment) => (
                    <TranscriptRecordCard
                      key={assessment._id}
                      id={String(assessment._id)}
                      date={assessment.date}
                      activity={assessment.activity}
                      activityContext={assessment.activityContext}
                      location={assessment.location}
                      attribution={
                        assessment.uploadedBy
                          ? `Uploaded by: ${assessment.uploadedBy}`
                          : undefined
                      }
                      durationSeconds={assessment.durationSeconds}
                      wordCount={
                        assessment.wordCount ??
                        assessment.transcript.split(/\s+/).filter((w) => w.length > 0).length
                      }
                      wordsPerMinute={assessment.wordsPerMinute}
                      categoryWPM={assessment.categoryWPM}
                      categoryWordCount={assessment.categoryWordCount}
                      transcript={assessment.transcript}
                      ragSegments={assessment.ragSegments}
                      onDelete={
                        isParent()
                          ? () => handleDeleteChildAssessment(assessment._id)
                          : undefined
                      }
                      observationNote={assessment.observationNote}
                      hidden={assessment.hidden}
                      canHide={assessment.canHide}
                      isPreviewing={isPreviewing}
                      onSaveNote={(text) => handleSaveChildNote(assessment, text)}
                      onToggleHidden={(nextHidden) =>
                        handleToggleChildHidden(assessment, nextHidden)
                      }
                    />
                  )}
                />
              )}
            </div>
          </div>
        )}

      </div>
    </AppLayout>
  );
};

export default ChildDataPage;



