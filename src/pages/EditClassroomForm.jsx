import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import AppLayout from "../components/AppLayout";
import { School, ArrowLeft, Save, ShieldAlert } from "lucide-react";
import axios from "../lib/axios";
import toast from "react-hot-toast";
import { useViewAs } from "../contexts/ViewAsContext";
import { previewWriteProps } from "../lib/viewAs.js";
import { CLASSROOM_AGE_GROUPS } from "../utils/classroomAgeGroups.js";

const EDIT_ROLES = new Set(["admin", "lead", "assistant", "coach"]);

const EditClassroomForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isPreviewing } = useViewAs();

  const [loading, setLoading] = useState(true);
  const [denied, setDenied] = useState(false);
  const [name, setName] = useState("");
  const [school, setSchool] = useState("");
  const [teachers, setTeachers] = useState([]);
  const [leadId, setLeadId] = useState("");
  const [assistantId, setAssistantId] = useState("");
  const [ageGroup, setAgeGroup] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`/api/classrooms/${id}`);
        const room = response.data.classroom;
        if (!room || !EDIT_ROLES.has(room.role)) {
          if (!cancelled) setDenied(true);
          return;
        }
        if (cancelled) return;
        setName(room.name || "");
        setSchool(room.center || room.school || "");
        setLeadId(String(room.teacher?.id || ""));
        setAssistantId(String(room.assistantTeacher?.id || ""));
        setAgeGroup(room.ageGroup || "");
        const center = room.center || room.school || "";
        if (center) {
          const teachersResponse = await axios.get(`/api/schools/${encodeURIComponent(center)}/teachers`);
          if (!cancelled) setTeachers(teachersResponse.data.teachers || []);
        }
      } catch (error) {
        if (!cancelled) {
          if (error.response?.status === 403 || error.response?.status === 404) {
            setDenied(true);
          } else {
            toast.error(error.response?.data?.message || "Could not load this classroom");
            setDenied(true);
          }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const assistantOptions = teachers.filter((teacher) => String(teacher._id) !== String(leadId));
  const leadOptions = teachers.some((teacher) => String(teacher._id) === String(leadId))
    ? teachers
    : leadId
      ? [{ _id: leadId, name: "Current lead teacher" }, ...teachers]
      : teachers;

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (isPreviewing) return;
    setFormError("");
    if (!name.trim()) {
      setFormError("Classroom name is required");
      return;
    }
    if (!leadId) {
      setFormError("Lead teacher is required");
      return;
    }
    setSubmitting(true);
    try {
      await axios.patch(`/api/classrooms/${id}`, {
        name: name.trim(),
        teacherId: leadId,
        assistantTeacherId: assistantId || null,
        ageGroup: ageGroup || null,
      });
      toast.success("Classroom updated");
      navigate(`/classrooms/${id}`);
    } catch (error) {
      const message = error.response?.data?.message || "Could not update this classroom";
      setFormError(message);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const breadcrumbs = [
    { label: "Dashboard", href: "/home" },
    { label: "Edit classroom", href: `/classrooms/${id}/edit` },
  ];

  if (loading) {
    return (
      <AppLayout breadcrumbs={breadcrumbs}>
        <div className="flex justify-center py-16">
          <span className="loading loading-spinner loading-lg text-primary" />
        </div>
      </AppLayout>
    );
  }

  if (denied) {
    return (
      <AppLayout breadcrumbs={breadcrumbs}>
        <div className="p-4 sm:p-6 max-w-lg mx-auto">
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body text-center">
              <div className="bg-error/10 p-4 rounded-full w-fit mx-auto mb-2">
                <ShieldAlert className="w-8 h-8 text-error" />
              </div>
              <h2 className="card-title justify-center">You cannot edit this classroom</h2>
              <p className="text-base-content/70">
                Classroom details can be changed by an admin, this room's teachers, or a coach who can open the room.
              </p>
              <div className="card-actions justify-center">
                <button type="button" className="btn btn-primary" onClick={() => navigate(`/classrooms/${id}`)}>
                  Back to classroom
                </button>
              </div>
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <div className="p-4 sm:p-6 max-w-2xl mx-auto w-full">
        <button type="button" onClick={() => navigate(`/classrooms/${id}`)} className="btn btn-ghost btn-sm gap-2 mb-4">
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body p-5 sm:p-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-primary/10 p-3 rounded-xl">
                <School className="w-7 h-7 text-primary" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold">Edit classroom</h1>
                <p className="text-sm text-base-content/70">
                  Update the name, teachers, and age group. The school stays the same.
                </p>
              </div>
            </div>
            <div className="divider my-2" />
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="form-control w-full">
                <label className="label py-1" htmlFor="classroom-name">
                  <span className="label-text font-semibold">Classroom name</span>
                </label>
                <input
                  id="classroom-name"
                  type="text"
                  className="input input-bordered input-primary w-full"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  maxLength={80}
                  required
                />
              </div>
              <div className="form-control w-full">
                <label className="label py-1" htmlFor="classroom-school">
                  <span className="label-text font-semibold">School</span>
                </label>
                <input
                  id="classroom-school"
                  type="text"
                  className="input input-bordered w-full"
                  value={school}
                  readOnly
                  disabled
                />
              </div>
              <div className="form-control w-full">
                <label className="label py-1" htmlFor="classroom-lead">
                  <span className="label-text font-semibold">Lead teacher</span>
                </label>
                <select
                  id="classroom-lead"
                  className="select select-bordered select-primary w-full"
                  value={leadId}
                  onChange={(event) => {
                    const next = event.target.value;
                    setLeadId(next);
                    if (next === assistantId) setAssistantId("");
                  }}
                  required
                >
                  <option value="">Select a teacher...</option>
                  {leadOptions.map((teacher) => (
                    <option key={teacher._id} value={teacher._id}>{teacher.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-control w-full">
                <label className="label py-1" htmlFor="classroom-assistant">
                  <span className="label-text font-semibold">Assistant teacher</span>
                  <span className="label-text-alt text-base-content/60">Optional</span>
                </label>
                <select
                  id="classroom-assistant"
                  className="select select-bordered w-full"
                  value={assistantId}
                  onChange={(event) => setAssistantId(event.target.value)}
                >
                  <option value="">No assistant</option>
                  {assistantOptions.map((teacher) => (
                    <option key={teacher._id} value={teacher._id}>{teacher.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-control w-full">
                <label className="label py-1" htmlFor="classroom-age-group">
                  <span className="label-text font-semibold">Age group</span>
                  <span className="label-text-alt text-base-content/60">Optional</span>
                </label>
                <select
                  id="classroom-age-group"
                  className="select select-bordered w-full"
                  value={ageGroup}
                  onChange={(event) => setAgeGroup(event.target.value)}
                >
                  <option value="">Not set</option>
                  {CLASSROOM_AGE_GROUPS.map((group) => (
                    <option key={group} value={group}>{group}</option>
                  ))}
                </select>
              </div>
              {formError && (
                <div className="alert alert-error py-2 text-sm">
                  <span>{formError}</span>
                </div>
              )}
              <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => navigate(`/classrooms/${id}`)}
                  className="btn btn-ghost w-full sm:w-auto"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary gap-2 w-full sm:w-auto"
                  disabled={submitting}
                  {...previewWriteProps(isPreviewing)}
                >
                  {submitting ? <span className="loading loading-spinner loading-sm" /> : <Save className="w-4 h-4" />}
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default EditClassroomForm;
