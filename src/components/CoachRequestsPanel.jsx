import { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import { ClipboardList, Check, X } from "lucide-react";
import {
  fetchPendingCoachRequests,
  approveCoachGrant,
  denyCoachGrant,
} from "../lib/coachApi";

/**
 * Lead-teacher panel listing pending coach access requests for their
 * classrooms, with approve/deny actions. Renders nothing when there are
 * no pending requests. Approval grants the aggregate tier only —
 * transcript access is a separate admin-controlled grant.
 */
const CoachRequestsPanel = () => {
  const [requests, setRequests] = useState([]);
  const [actingId, setActingId] = useState(null);

  const load = useCallback(async () => {
    try {
      const data = await fetchPendingCoachRequests();
      setRequests(data.grants || []);
    } catch {
      setRequests([]);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const act = async (grantId, action) => {
    setActingId(grantId);
    try {
      if (action === "approve") {
        await approveCoachGrant(grantId);
        toast.success("Coach access approved — they can now view this classroom's talk data");
      } else {
        await denyCoachGrant(grantId);
        toast.success("Coach access request denied");
      }
      load();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update the request");
    } finally {
      setActingId(null);
    }
  };

  if (requests.length === 0) return null;

  return (
    <div className="card bg-base-100 shadow-xl border border-warning/40 mb-8">
      <div className="card-body">
        <h2 className="card-title text-lg">
          <ClipboardList className="w-5 h-5 text-warning" />
          Coach Access Requests
        </h2>
        <p className="text-sm text-base-content/70">
          A coach is asking to view classroom talk data (counts and visualizations —
          not transcripts). Transcript access is granted separately by an administrator.
        </p>
        <ul className="divide-y divide-base-200 mt-2">
          {requests.map((req) => (
            <li key={req.id} className="py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <p className="font-medium">
                  {req.coach?.name || "A coach"}{" "}
                  <span className="text-base-content/60 font-normal">
                    requests access to
                  </span>{" "}
                  {req.classroomName || "your classroom"}
                </p>
                {req.coach?.email && (
                  <p className="text-xs text-base-content/50">{req.coach.email}</p>
                )}
              </div>
              <div className="flex gap-2 shrink-0">
                <button
                  className="btn btn-success btn-sm gap-1"
                  disabled={actingId === req.id}
                  onClick={() => act(req.id, "approve")}
                >
                  <Check className="w-4 h-4" />
                  Approve
                </button>
                <button
                  className="btn btn-ghost btn-sm gap-1 text-error"
                  disabled={actingId === req.id}
                  onClick={() => act(req.id, "deny")}
                >
                  <X className="w-4 h-4" />
                  Deny
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default CoachRequestsPanel;
