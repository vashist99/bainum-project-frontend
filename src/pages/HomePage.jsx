import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import AppLayout from "../components/AppLayout";
import ClassroomCard from "../components/ClassroomCard";
import ParentEnrolledClassrooms from "../components/ParentEnrolledClassrooms";
import RolePreviewEmpty from "../components/RolePreviewEmpty";
import { Sparkles, ArrowRight, Plus, School, LayoutGrid } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useViewAs } from "../contexts/ViewAsContext";
import { getPrimaryChildId } from "../utils/parentChildren.js";
import { PREVIEW_CHILD_PATH, PREVIEW_WRITE_HINT, previewWriteProps, shouldLoadLiveRoleData } from "../lib/viewAs.js";
import axios from "../lib/axios";
import CoachDashboardPage from "./CoachDashboardPage";

const HomePage = () => {
  const navigate = useNavigate();
  const { isTeacher, user } = useAuth();
  const {
    isPreviewing,
    effectiveIsAdmin,
    effectiveIsTeacher,
    effectiveIsParent,
    effectiveIsCoach,
  } = useViewAs();
  const [classrooms, setClassrooms] = useState([]);
  const [classroomsLoading, setClassroomsLoading] = useState(false);

  const breadcrumbs = [
    { label: "Dashboard", href: "/home" }
  ];

  useEffect(() => {
    if (!shouldLoadLiveRoleData(isPreviewing) || !isTeacher()) return;
    setClassroomsLoading(true);
    axios.get("/api/classrooms")
      .then((res) => setClassrooms(res.data.classrooms || []))
      .catch(() => setClassrooms([]))
      .finally(() => setClassroomsLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, isPreviewing]);

  if (effectiveIsCoach()) {
    return <CoachDashboardPage />;
  }

  const createClassroomProps = previewWriteProps(isPreviewing, {
    type: "button",
    className: "btn btn-primary btn-sm sm:btn-md gap-2 w-full sm:w-auto",
    onClick: () => navigate("/classrooms/create"),
  });

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <div className="p-4 sm:p-6">
            <div className="mb-8">
              <div className="flex items-center gap-4 mb-4">
                <div className="bg-gradient-to-br from-primary to-secondary p-3 rounded-xl">
                  <Sparkles className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-base-content">
                    Welcome, {user?.name?.split(' ')[0] || 'User'}!
                  </h1>
                  <p className="text-base-content/70 mt-1">
                    Here's what's happening in your educational platform today.
                  </p>
                </div>
              </div>
            </div>


            {effectiveIsTeacher() && (
              <div className="mb-8">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                  <h2 className="text-xl font-bold text-base-content flex items-center gap-2">
                    <School className="w-5 h-5 text-primary" />
                    My Classrooms
                  </h2>
                  <button {...createClassroomProps}>
                    <Plus className="w-4 h-4" />
                    Create Classroom
                  </button>
                </div>

                {isPreviewing ? (
                  <RolePreviewEmpty title="No classrooms yet" icon={School}>
                    Teachers see every classroom they lead or assist here. This is a general preview — create and record stay off.
                  </RolePreviewEmpty>
                ) : classroomsLoading ? (
                  <div className="flex justify-center py-12">
                    <span className="loading loading-spinner loading-lg text-primary" />
                  </div>
                ) : classrooms.length > 0 ? (
                  <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                    {classrooms.map((classroom) => (
                      <ClassroomCard key={classroom.id} classroom={classroom} />
                    ))}
                  </div>
                ) : (
                  <div className="card bg-base-100 shadow-xl border border-dashed border-base-300">
                    <div className="card-body items-center text-center py-12">
                      <div className="bg-primary/10 p-4 rounded-full mb-2">
                        <School className="w-8 h-8 text-primary" />
                      </div>
                      <h3 className="card-title">No classrooms yet</h3>
                      <p className="text-base-content/70 max-w-md">
                        Create your first classroom to start recording sessions and
                        tracking your children's language development together.
                      </p>
                      <button
                        type="button"
                        onClick={() => navigate("/classrooms/create")}
                        className="btn btn-primary gap-2 mt-3"
                      >
                        <Plus className="w-4 h-4" />
                        Create Classroom
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {effectiveIsAdmin() && (
              <div className="mb-8">
                <h2 className="text-xl font-bold text-base-content mb-4 flex items-center gap-2">
                  <School className="w-5 h-5 text-primary" />
                  Classrooms
                </h2>
                <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 max-w-3xl">
                  <button
                    onClick={() => navigate("/classrooms/create")}
                    className="card bg-base-100 shadow-xl hover:shadow-2xl hover:scale-[1.02] transition-all duration-200 text-left border border-base-200 hover:border-primary/50"
                  >
                    <div className="card-body p-6">
                      <div className="bg-primary/10 p-3 rounded-lg w-fit mb-3">
                        <Plus className="h-6 w-6 text-primary" />
                      </div>
                      <h3 className="card-title text-lg">Create Classroom</h3>
                      <p className="text-sm text-base-content/70 mt-2">
                        Set up a new classroom with a lead teacher (and optional assistant) at any center.
                      </p>
                    </div>
                  </button>
                  <button
                    onClick={() => navigate("/classrooms")}
                    className="card bg-base-100 shadow-xl hover:shadow-2xl hover:scale-[1.02] transition-all duration-200 text-left border border-base-200 hover:border-secondary/50"
                  >
                    <div className="card-body p-6">
                      <div className="bg-secondary/10 p-3 rounded-lg w-fit mb-3">
                        <LayoutGrid className="h-6 w-6 text-secondary" />
                      </div>
                      <h3 className="card-title text-lg">View All Classrooms</h3>
                      <p className="text-sm text-base-content/70 mt-2">
                        Browse every classroom across all schools.
                      </p>
                    </div>
                  </button>
                </div>
              </div>
            )}

            {effectiveIsParent() && (
              <>
                <div className="mb-8">
                  <h2 className="text-xl font-bold text-base-content mb-4 flex items-center gap-2">
                    <School className="w-5 h-5 text-primary" />
                    My Children&apos;s Classrooms
                  </h2>
                  {isPreviewing ? (
                    <RolePreviewEmpty title="No classrooms yet" icon={School}>
                      Parents see the classrooms their children are enrolled in. This is a general preview — no family&apos;s rooms are listed.
                    </RolePreviewEmpty>
                  ) : (
                    <ParentEnrolledClassrooms />
                  )}
                </div>
                {(isPreviewing || getPrimaryChildId(user)) && (
                  <div className="max-w-md">
                    <a
                      href={isPreviewing ? PREVIEW_CHILD_PATH : `/data/child/${getPrimaryChildId(user)}`}
                      className="card bg-base-100 shadow-xl hover:shadow-2xl hover:scale-[1.02] transition-all duration-200 border border-base-200 hover:border-secondary/50"
                    >
                      <div className="card-body p-6">
                        <div className="bg-secondary/10 p-3 rounded-lg w-fit mb-3">
                          <ArrowRight className="h-6 w-6 text-secondary" />
                        </div>
                        <h3 className="card-title text-lg">View My Child&apos;s Data</h3>
                        <p className="text-sm text-base-content/70 mt-2">
                          {isPreviewing
                            ? "Open the general parent child-data screens. No live recordings are loaded."
                            : "See assessments, transcripts, and WPM progress."}
                        </p>
                      </div>
                    </a>
                  </div>
                )}
                {isPreviewing && (
                  <p className="text-xs text-base-content/50 mt-3">{PREVIEW_WRITE_HINT}.</p>
                )}
              </>
            )}
          </div>
    </AppLayout>
  );
};

export default HomePage;
