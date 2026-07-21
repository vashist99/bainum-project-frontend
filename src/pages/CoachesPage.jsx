import { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import {
  ClipboardList, Mail, Plus, UserPlus, UserMinus, X,
  ShieldCheck, ShieldOff, Users, School,
} from "lucide-react";
import AppLayout from "../components/AppLayout";
import axios from "../lib/axios";
import {
  fetchCoaches,
  sendCoachInvitation,
  fetchCoachInvitations,
  assignTeacher,
  unassignTeacher,
  revokeCoachGrant,
  setCoachTranscriptAccess,
} from "../lib/coachApi";

const GRANT_STATUS_BADGE = {
  pending: "badge-warning",
  active: "badge-success",
  revoked: "badge-ghost",
};

const CoachesPage = () => {
  const [coaches, setCoaches] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteForm, setInviteForm] = useState({ email: "", firstName: "", lastName: "" });
  const [inviteSending, setInviteSending] = useState(false);
  const [assigningCoachId, setAssigningCoachId] = useState(null);
  const [selectedTeacherId, setSelectedTeacherId] = useState("");

  const breadcrumbs = [
    { label: "Dashboard", href: "/home" },
    { label: "Coaches", href: "/coaches" },
  ];

  const loadAll = useCallback(async () => {
    try {
      setLoading(true);
      const [coachData, inviteData, teacherRes] = await Promise.all([
        fetchCoaches(),
        fetchCoachInvitations(),
        axios.get("/api/teachers"),
      ]);
      setCoaches(coachData.coaches || []);
      setInvitations(inviteData.invitations || []);
      setTeachers(teacherRes.data.teachers || []);
    } catch (error) {
      console.error("Error loading coaches:", error);
      toast.error(error.response?.data?.message || "Failed to load coaches");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const handleInvite = async (e) => {
    e.preventDefault();
    if (!inviteForm.email || !inviteForm.firstName || !inviteForm.lastName) {
      toast.error("Please fill in all fields");
      return;
    }
    setInviteSending(true);
    try {
      const result = await sendCoachInvitation(inviteForm);
      if (result.warning) {
        toast(`Invitation created. Share this link manually: ${result.invitation.invitationLink}`, { duration: 12000 });
      } else {
        toast.success("Coach invitation sent");
      }
      setInviteForm({ email: "", firstName: "", lastName: "" });
      setShowInviteForm(false);
      loadAll();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to send invitation");
    } finally {
      setInviteSending(false);
    }
  };

  const handleAssign = async (coachId) => {
    if (!selectedTeacherId) {
      toast.error("Select a teacher to assign");
      return;
    }
    try {
      await assignTeacher(coachId, selectedTeacherId);
      toast.success("Teacher assigned");
      setAssigningCoachId(null);
      setSelectedTeacherId("");
      loadAll();
    } catch (error) {
      if (error.response?.status === 409 && error.response?.data?.requiresConfirmation) {
        if (window.confirm("This teacher already has a coach. Reassign to this coach? Their previous coach may lose classroom access.")) {
          try {
            await assignTeacher(coachId, selectedTeacherId, { confirmReassign: true });
            toast.success("Teacher reassigned");
            setAssigningCoachId(null);
            setSelectedTeacherId("");
            loadAll();
          } catch (err2) {
            toast.error(err2.response?.data?.message || "Failed to reassign teacher");
          }
        }
        return;
      }
      toast.error(error.response?.data?.message || "Failed to assign teacher");
    }
  };

  const handleUnassign = async (coachId, teacherId, teacherName) => {
    if (!window.confirm(`Unassign ${teacherName} from this coach? Classroom access granted through this teacher will be revoked.`)) return;
    try {
      await unassignTeacher(coachId, teacherId);
      toast.success("Teacher unassigned");
      loadAll();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to unassign teacher");
    }
  };

  const handleRevokeGrant = async (grantId, classroomName) => {
    if (!window.confirm(`Revoke this coach's access to "${classroomName}"?`)) return;
    try {
      await revokeCoachGrant(grantId);
      toast.success("Access revoked");
      loadAll();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to revoke access");
    }
  };

  const handleTranscriptToggle = async (grant) => {
    const enabling = !grant.transcriptAccess;
    if (enabling && !window.confirm(`Grant this coach access to transcripts for "${grant.classroomName}"? Transcripts contain recorded classroom speech.`)) return;
    try {
      await setCoachTranscriptAccess(grant.id, enabling);
      toast.success(enabling ? "Transcript access granted" : "Transcript access revoked");
      loadAll();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update transcript access");
    }
  };

  const pendingInvitations = invitations.filter((inv) => inv.status === "pending");

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <div className="p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-primary to-secondary p-3 rounded-xl">
              <ClipboardList className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Coaches</h1>
              <p className="text-base-content/70 text-sm">
                Invite coaches, assign their teachers, and control classroom data access.
              </p>
            </div>
          </div>
          <button
            className="btn btn-primary gap-2 w-full sm:w-auto"
            onClick={() => setShowInviteForm((v) => !v)}
          >
            {showInviteForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {showInviteForm ? "Cancel" : "Invite Coach"}
          </button>
        </div>

        {showInviteForm && (
          <div className="card bg-base-100 shadow-xl border border-base-300 mb-6">
            <div className="card-body">
              <h2 className="card-title text-lg">
                <Mail className="w-5 h-5 text-primary" />
                Invite a Coach
              </h2>
              <form onSubmit={handleInvite} className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                <div className="form-control">
                  <label className="label"><span className="label-text">First name</span></label>
                  <input
                    type="text"
                    className="input input-bordered w-full"
                    value={inviteForm.firstName}
                    onChange={(e) => setInviteForm({ ...inviteForm, firstName: e.target.value })}
                    required
                  />
                </div>
                <div className="form-control">
                  <label className="label"><span className="label-text">Last name</span></label>
                  <input
                    type="text"
                    className="input input-bordered w-full"
                    value={inviteForm.lastName}
                    onChange={(e) => setInviteForm({ ...inviteForm, lastName: e.target.value })}
                    required
                  />
                </div>
                <div className="form-control">
                  <label className="label"><span className="label-text">Email</span></label>
                  <input
                    type="email"
                    className="input input-bordered w-full"
                    value={inviteForm.email}
                    onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                    required
                  />
                </div>
                <div className="sm:col-span-3">
                  <button type="submit" className="btn btn-primary" disabled={inviteSending}>
                    {inviteSending ? <span className="loading loading-spinner loading-sm" /> : <Mail className="w-4 h-4" />}
                    Send Invitation
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {pendingInvitations.length > 0 && (
          <div className="card bg-base-100 shadow border border-base-300 mb-6">
            <div className="card-body py-4">
              <h3 className="font-semibold text-sm text-base-content/70 uppercase tracking-wide">Pending invitations</h3>
              <div className="flex flex-wrap gap-2 mt-1">
                {pendingInvitations.map((inv) => (
                  <div key={inv.id} className="badge badge-outline gap-1 py-3">
                    <Mail className="w-3 h-3" />
                    {inv.firstName} {inv.lastName} ({inv.email})
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-16">
            <span className="loading loading-spinner loading-lg text-primary" />
          </div>
        ) : coaches.length === 0 ? (
          <div className="card bg-base-100 shadow-xl border border-dashed border-base-300">
            <div className="card-body items-center text-center py-12">
              <div className="bg-primary/10 p-4 rounded-full mb-2">
                <ClipboardList className="w-8 h-8 text-primary" />
              </div>
              <h3 className="card-title">No coaches yet</h3>
              <p className="text-base-content/70 max-w-md">
                Invite a coach by email. Once they register, assign them the teachers they oversee.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {coaches.map((coach) => {
              const assignedIds = new Set(coach.assignedTeachers.map((t) => String(t.id)));
              const assignableTeachers = teachers.filter((t) => !assignedIds.has(String(t._id ?? t.id)));
              return (
                <div key={coach.id} className="card bg-base-100 shadow-xl border border-base-300">
                  <div className="card-body">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary text-primary-content flex items-center justify-center font-semibold">
                          {coach.name?.charAt(0) || "C"}
                        </div>
                        <div>
                          <h2 className="font-bold text-lg">{coach.name}</h2>
                          <p className="text-sm text-base-content/60">{coach.email}</p>
                        </div>
                      </div>
                      <button
                        className="btn btn-outline btn-sm gap-2"
                        onClick={() => {
                          setAssigningCoachId(assigningCoachId === coach.id ? null : coach.id);
                          setSelectedTeacherId("");
                        }}
                      >
                        <UserPlus className="w-4 h-4" />
                        Assign Teacher
                      </button>
                    </div>

                    {assigningCoachId === coach.id && (
                      <div className="flex flex-col sm:flex-row gap-2 mt-3 p-3 bg-base-200 rounded-lg">
                        <select
                          className="select select-bordered flex-1"
                          value={selectedTeacherId}
                          onChange={(e) => setSelectedTeacherId(e.target.value)}
                        >
                          <option value="">Select a teacher…</option>
                          {assignableTeachers.map((t) => (
                            <option key={t._id ?? t.id} value={t._id ?? t.id}>
                              {t.name} {t.center ? `— ${t.center}` : ""}
                            </option>
                          ))}
                        </select>
                        <button className="btn btn-primary" onClick={() => handleAssign(coach.id)}>
                          Assign
                        </button>
                      </div>
                    )}

                    <div className="mt-4">
                      <h3 className="font-semibold text-sm text-base-content/70 uppercase tracking-wide flex items-center gap-2 mb-2">
                        <Users className="w-4 h-4" />
                        Assigned Teachers ({coach.assignedTeachers.length})
                      </h3>
                      {coach.assignedTeachers.length === 0 ? (
                        <p className="text-sm text-base-content/50">No teachers assigned.</p>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {coach.assignedTeachers.map((t) => (
                            <div key={t.id} className="badge badge-lg badge-outline gap-2 py-4">
                              {t.name}
                              {t.center && <span className="text-base-content/50">· {t.center}</span>}
                              <button
                                className="hover:text-error"
                                title="Unassign teacher"
                                onClick={() => handleUnassign(coach.id, t.id, t.name)}
                              >
                                <UserMinus className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="mt-4">
                      <h3 className="font-semibold text-sm text-base-content/70 uppercase tracking-wide flex items-center gap-2 mb-2">
                        <School className="w-4 h-4" />
                        Classroom Access
                      </h3>
                      {coach.grants.length === 0 ? (
                        <p className="text-sm text-base-content/50">No classroom access requests.</p>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="table table-sm">
                            <thead>
                              <tr>
                                <th>Classroom</th>
                                <th>Status</th>
                                <th>Transcripts</th>
                                <th className="text-right">Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {coach.grants.map((grant) => (
                                <tr key={grant.id}>
                                  <td className="font-medium">{grant.classroomName || "(deleted classroom)"}</td>
                                  <td>
                                    <span className={`badge ${GRANT_STATUS_BADGE[grant.status] || "badge-ghost"}`}>
                                      {grant.status}
                                    </span>
                                  </td>
                                  <td>
                                    {grant.status === "active" ? (
                                      <button
                                        className={`btn btn-xs gap-1 ${grant.transcriptAccess ? "btn-success" : "btn-ghost"}`}
                                        onClick={() => handleTranscriptToggle(grant)}
                                        title={grant.transcriptAccess ? "Revoke transcript access" : "Grant transcript access (admin only)"}
                                      >
                                        {grant.transcriptAccess ? <ShieldCheck className="w-3 h-3" /> : <ShieldOff className="w-3 h-3" />}
                                        {grant.transcriptAccess ? "Granted" : "Not granted"}
                                      </button>
                                    ) : (
                                      <span className="text-base-content/40 text-xs">—</span>
                                    )}
                                  </td>
                                  <td className="text-right">
                                    {grant.status !== "revoked" && (
                                      <button
                                        className="btn btn-xs btn-error btn-outline"
                                        onClick={() => handleRevokeGrant(grant.id, grant.classroomName)}
                                      >
                                        Revoke
                                      </button>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default CoachesPage;
