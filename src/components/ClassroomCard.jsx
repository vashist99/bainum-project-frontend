import { useNavigate } from "react-router";
import { School, Building2, Users, Pencil } from "lucide-react";
import { classroomCardTitle } from "../utils/classroomTable.js";

/**
 * Classroom summary card: the LEAD TEACHER's name is the card title (falling
 * back to "No lead teacher"), with the classroom name and center in smaller
 * muted text below. Shows a small "Assistant" badge when the viewing teacher
 * assists (rather than leads) this classroom.
 *
 * `variant="parent"`: enrolled parents can open the read-only classroom
 * homepage; child chips still link to each child's data page.
 *
 * Designed for responsive grids (grid-cols-1 sm:grid-cols-2 lg:grid-cols-3).
 */
const ClassroomCard = ({ classroom, variant = "staff" }) => {
  const navigate = useNavigate();
  const isAssistantView = classroom?.role === "assistant";
  const isParentView = variant === "parent";

  const body = (
    <div className="card-body p-5 sm:p-6">
      <div className="flex items-start justify-between gap-2">
        <div className="bg-primary/10 p-3 rounded-lg w-fit mb-2">
          <School className="h-6 w-6 text-primary" />
        </div>
        {isAssistantView && (
          <span className="badge badge-secondary badge-outline badge-sm">Assistant</span>
        )}
      </div>
      <h3 className="card-title text-lg sm:text-xl break-words">
        {classroomCardTitle(classroom)}
      </h3>
      <div className="mt-1 space-y-1">
        <p className="text-sm text-base-content/70 flex items-center gap-2">
          <School className="w-4 h-4 shrink-0" />
          <span className="truncate">{classroom.name}</span>
        </p>
        {classroom.assistantTeacher?.name && (
          <p className="text-xs text-base-content/60 flex items-center gap-2">
            <Users className="w-4 h-4 shrink-0" />
            <span className="truncate">Assistant: {classroom.assistantTeacher.name}</span>
          </p>
        )}
        <p className="text-xs text-base-content/60 flex items-center gap-2">
          <Building2 className="w-4 h-4 shrink-0" />
          <span className="truncate">{classroom.center || "—"}</span>
        </p>
        {classroom.ageGroup && (
          <p className="text-xs text-base-content/60 truncate">{classroom.ageGroup}</p>
        )}
      </div>
      {isParentView && (
        <div className="mt-3 pt-3 border-t border-base-200">
          <p className="text-xs uppercase tracking-wide text-base-content/60 mb-1.5">
            Enrolled children
          </p>
          <div className="flex flex-wrap gap-1.5">
            {(classroom.enrolledChildren || []).map((child) => (
              <button
                key={child.id}
                onClick={() => navigate(`/data/child/${child.id}`)}
                className="badge badge-primary badge-outline hover:badge-primary hover:text-primary-content cursor-pointer transition-colors"
                title={`View ${child.name}'s data`}
              >
                {child.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  if (isParentView) {
    return (
      <button
        onClick={() => navigate(`/classrooms/${classroom.id}`)}
        className="card bg-base-100 shadow-xl hover:shadow-2xl hover:scale-[1.02] transition-all duration-200 text-left border border-base-200 hover:border-primary/50 w-full"
      >
        {body}
      </button>
    );
  }

  return (
    <div className="card bg-base-100 shadow-xl hover:shadow-2xl hover:scale-[1.02] transition-all duration-200 text-left border border-base-200 hover:border-primary/50 w-full">
      <button
        type="button"
        onClick={() => navigate(`/classrooms/${classroom.id}`)}
        className="text-left w-full"
      >
        {body}
      </button>
      <div className="card-actions justify-end px-5 pb-5 sm:px-6 sm:pb-6">
        <button
          type="button"
          className="btn btn-outline btn-sm gap-2"
          aria-label={`Edit ${classroom.name || "classroom"}`}
          onClick={() => navigate(`/classrooms/${classroom.id}/edit`)}
        >
          <Pencil className="w-4 h-4" />
          Edit
        </button>
      </div>
    </div>
  );
};

export default ClassroomCard;
