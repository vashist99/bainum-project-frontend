import { useCallback, useEffect, useState } from "react";
import { Shield, Users } from "lucide-react";
import toast from "react-hot-toast";
import InfoTip from "./InfoTip.jsx";
import { useViewAs } from "../contexts/ViewAsContext";
import { previewWriteProps } from "../lib/viewAs.js";
import {
    fetchClassroomViewers,
    fetchHomeViewers,
    setClassroomChartStatus,
    setHomeChartStatus,
} from "../lib/viewerAccessApi.js";
import { canToggleViewer, listedViewers, viewerRoleLabel, wordsBadgeLabel } from "../lib/currentlyAccessing.js";

const CurrentlyAccessingButton = ({ place, targetId, className = "" }) => {
    const { isPreviewing } = useViewAs();
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [savingId, setSavingId] = useState(null);
    const [canSwitch, setCanSwitch] = useState(false);
    const [adminsAlwaysOn, setAdminsAlwaysOn] = useState(true);
    const [viewers, setViewers] = useState([]);

    const load = useCallback(async () => {
        if (!targetId) return;
        setLoading(true);
        try {
            const data =
                place === "home"
                    ? await fetchHomeViewers(targetId)
                    : await fetchClassroomViewers(targetId);
            setViewers(listedViewers(data.viewers));
            setCanSwitch(!!data.canSwitch);
            setAdminsAlwaysOn(data.adminsAlwaysOn !== false);
        } catch (error) {
            toast.error(error.response?.data?.message || "Could not load who is accessing");
            setViewers([]);
            setCanSwitch(false);
        } finally {
            setLoading(false);
        }
    }, [place, targetId]);

    useEffect(() => {
        if (open) load();
    }, [open, load]);

    const handleToggle = async (viewer, nextOn) => {
        setSavingId(String(viewer.id));
        try {
            if (place === "home") {
                await setHomeChartStatus(targetId, {
                    viewerId: viewer.id,
                    viewerRole: viewer.role,
                    charts: nextOn,
                });
            } else {
                await setClassroomChartStatus(targetId, {
                    viewerId: viewer.id,
                    viewerRole: viewer.role,
                    charts: nextOn,
                });
            }
            setViewers((rows) =>
                rows.map((row) =>
                    String(row.id) === String(viewer.id)
                        ? { ...row, charts: nextOn, transcripts: nextOn ? false : row.transcripts }
                        : row
                )
            );
            toast.success(nextOn ? "Charts turned on" : "Charts turned off");
        } catch (error) {
            toast.error(error.response?.data?.message || "Could not update access");
        } finally {
            setSavingId(null);
        }
    };

    return (
        <>
            <button
                type="button"
                className={`btn btn-outline gap-2 shrink-0 ${className}`.trim()}
                onClick={() => setOpen(true)}
            >
                <Users className="w-4 h-4" />
                Currently Accessing
            </button>

            {open && (
                <div className="modal modal-open">
                    <div className="modal-box max-w-lg">
                        <div className="flex items-start justify-between gap-3 mb-3">
                            <div>
                                <h3 className="font-bold text-lg flex items-center gap-2">
                                    Currently Accessing
                                    <InfoTip helpKey="control.currentlyAccessing" />
                                </h3>
                                <p className="text-sm text-base-content/70 mt-1">
                                    {place === "home"
                                        ? "People who can see this child's home charts. Transcript words stay admin-gated."
                                        : "People who can see this classroom's charts. Transcript words stay admin-gated."}
                                </p>
                            </div>
                        </div>

                        {adminsAlwaysOn && (
                            <div className="alert py-3 mb-3">
                                <Shield className="w-4 h-4 shrink-0" aria-hidden="true" />
                                <span className="text-sm">
                                    All administrators can view this page.
                                </span>
                            </div>
                        )}

                        {loading ? (
                            <div className="flex justify-center py-8">
                                <span className="loading loading-spinner loading-md text-primary" />
                            </div>
                        ) : viewers.length === 0 ? (
                            <p className="text-sm text-base-content/60 py-4 text-center">
                                {isPreviewing
                                    ? "This list is empty in a general preview."
                                    : adminsAlwaysOn
                                      ? "No other people have access yet."
                                      : "No viewers to show yet."}
                            </p>
                        ) : (
                            <ul className="divide-y divide-base-200">
                                {viewers.map((viewer) => {
                                    const id = String(viewer.id);
                                    const togglable = canToggleViewer({
                                        canSwitch,
                                        switchable: viewer.switchable,
                                        isPreviewing,
                                    });
                                    return (
                                        <li key={`${viewer.role}-${id}`} className="py-3 flex items-center gap-3">
                                            <div className="min-w-0 flex-1">
                                                <div className="font-medium truncate">{viewer.name || "Unnamed"}</div>
                                                <div className="text-xs text-base-content/60">
                                                    {viewerRoleLabel(viewer.role, viewer.slot)}
                                                </div>
                                            </div>
                                            <span
                                                className={`badge badge-sm ${viewer.transcripts ? "badge-warning" : "badge-ghost"}`}
                                            >
                                                {wordsBadgeLabel(viewer.transcripts)}
                                            </span>
                                            {viewer.switchable ? (
                                                <input
                                                    type="checkbox"
                                                    className="toggle toggle-success toggle-sm"
                                                    checked={!!viewer.charts}
                                                    disabled={!togglable || savingId === id}
                                                    aria-label={`Charts for ${viewer.name || viewer.role}`}
                                                    onChange={(event) => handleToggle(viewer, event.target.checked)}
                                                    {...previewWriteProps(isPreviewing)}
                                                />
                                            ) : (
                                                <span className="badge badge-success badge-sm">On</span>
                                            )}
                                        </li>
                                    );
                                })}
                            </ul>
                        )}

                        <div className="modal-action mt-2">
                            <button type="button" className="btn" onClick={() => setOpen(false)}>
                                Close
                            </button>
                        </div>
                    </div>
                    <button
                        type="button"
                        className="modal-backdrop"
                        aria-label="Close"
                        onClick={() => setOpen(false)}
                    />
                </div>
            )}
        </>
    );
};

export default CurrentlyAccessingButton;
