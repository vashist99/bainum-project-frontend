import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router";
import toast from "react-hot-toast";
import { School, Users, Sparkles, Clock, Eye, FileText, Lock } from "lucide-react";
import AppLayout from "../components/AppLayout";
import { useAuth } from "../contexts/AuthContext";
import { useViewAs } from "../contexts/ViewAsContext";
import { shouldLoadLiveRoleData } from "../lib/viewAs.js";
import { fetchCoachOverview, requestClassroomAccess } from "../lib/coachApi";

const TIER_LABEL = {
  none: { text: "No access", badge: "badge-ghost", icon: Lock },
  requested: { text: "Requested", badge: "badge-warning", icon: Clock },
  aggregate: { text: "Talk data", badge: "badge-success", icon: Eye },
  transcripts: { text: "Talk data + transcripts", badge: "badge-success", icon: FileText },
};

const CoachDashboardPage = () => {
  const { user } = useAuth();
  const { isPreviewing } = useViewAs();
  const [teachers, setTeachers] = useState([]);
  const [classrooms, setClassrooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [requestingId, setRequestingId] = useState(null);

  const breadcrumbs = [{ label: "Dashboard", href: "/home" }];

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchCoachOverview();
      setTeachers(data.teachers || []);
      setClassrooms(data.classrooms || []);
    } catch (error) {
      console.error("Error loading coach overview:", error);
      toast.error(error.response?.data?.message || "Failed to load your dashboard");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!shouldLoadLiveRoleData(isPreviewing)) {
      setTeachers([]);
      setClassrooms([]);
      setLoading(false);
      return;
    }
    load();
  }, [load, isPreviewing]);

  const handleRequest = async (classroomId) => {
    setRequestingId(classroomId);
    try {
      await requestClassroomAccess(classroomId);
      toast.success("Access requested — the lead teacher has been notified");
      load();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to request access");
    } finally {
      setRequestingId(null);
    }
  };

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <div className="p-4 sm:p-6">
        <div className="mb-8 flex items-center gap-4">
          <div className="bg-gradient-to-br from-primary to-secondary p-3 rounded-xl">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-base-content">
              Welcome back, {user?.name?.split(" ")[0] || "Coach"}!
            </h1>
            <p className="text-base-content/70 mt-1">
              Review classroom talk data for the teachers you coach.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <span className="loading loading-spinner loading-lg text-primary" />
          </div>
        ) : (
          <>
            <div className="mb-8">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                My Teachers
              </h2>
              {teachers.length === 0 ? (
                <div className="card bg-base-100 shadow border border-dashed border-base-300">
                  <div className="card-body items-center text-center py-10">
                    <p className="text-base-content/70 max-w-md">
                      {isPreviewing
                        ? "Coaches see the teachers an administrator assigned to them. This is a general preview — no assignments are listed."
                        : "No teachers are assigned to you yet. Invite a teacher from People → Teachers, or wait for an administrator to assign one."}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {teachers.map((t) => (
                    <div key={t.id} className="badge badge-lg badge-outline py-4 gap-2">
                      {t.name}
                      {t.center && <span className="text-base-content/50">· {t.center}</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <School className="w-5 h-5 text-primary" />
                Classrooms
              </h2>
              {classrooms.length === 0 ? (
                <div className="card bg-base-100 shadow border border-dashed border-base-300">
                  <div className="card-body items-center text-center py-10">
                    <p className="text-base-content/70 max-w-md">
                      {isPreviewing
                        ? "Coaches request access to a teacher's classrooms from this list. This is a general preview — no classrooms are listed."
                        : "Your assigned teachers don't lead any classrooms yet."}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                  {classrooms.map((room) => {
                    const tier = TIER_LABEL[room.accessTier] || TIER_LABEL.none;
                    const TierIcon = tier.icon;
                    const hasAccess = room.accessTier === "aggregate" || room.accessTier === "transcripts";
                    return (
                      <div key={room.id} className="card bg-base-100 shadow-xl border border-base-200">
                        <div className="card-body">
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="card-title text-lg">{room.name}</h3>
                            <span className={`badge ${tier.badge} gap-1 whitespace-nowrap`}>
                              <TierIcon className="w-3 h-3" />
                              {tier.text}
                            </span>
                          </div>
                          <p className="text-sm text-base-content/60">{room.center}</p>
                          <p className="text-sm text-base-content/70">
                            Lead: {room.leadTeacher?.name || "—"}
                            {room.assistantTeacher?.name ? ` · Assistant: ${room.assistantTeacher.name}` : ""}
                          </p>
                          <div className="card-actions justify-end mt-2">
                            {hasAccess ? (
                              <Link to={`/classrooms/${room.id}`} className="btn btn-primary btn-sm gap-2">
                                <Eye className="w-4 h-4" />
                                View Talk Data
                              </Link>
                            ) : room.accessTier === "requested" ? (
                              <button className="btn btn-sm btn-disabled gap-2">
                                <Clock className="w-4 h-4" />
                                Awaiting approval
                              </button>
                            ) : (
                              <button
                                className="btn btn-outline btn-sm gap-2"
                                disabled={requestingId === room.id}
                                onClick={() => handleRequest(room.id)}
                              >
                                {requestingId === room.id ? (
                                  <span className="loading loading-spinner loading-xs" />
                                ) : (
                                  <Lock className="w-4 h-4" />
                                )}
                                Request access
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </AppLayout>
  );
};

export default CoachDashboardPage;
