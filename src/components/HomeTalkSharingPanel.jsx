import { useState } from "react";
import { Share2, ShieldCheck, ShieldOff } from "lucide-react";
import toast from "react-hot-toast";
import { grantHomeAccess, revokeHomeAccess } from "../lib/homeAccessApi";
import InfoTip from "./InfoTip.jsx";
import { allStaffGrantActive } from "../utils/homeViewAccess";

/**
 * Parent home sharing: keep the optional all-staff grant, and open
 * per-person switches in Currently accessing.
 */
const HomeTalkSharingPanel = ({ childId, state, loading, onChanged }) => {
    const [busy, setBusy] = useState(false);

    const run = async (action, successMessage) => {
        setBusy(true);
        try {
            const result = await action();
            toast.success(result?.message || successMessage);
            await onChanged?.();
        } catch (error) {
            toast.error(error.response?.data?.message || "Something went wrong");
        } finally {
            setBusy(false);
        }
    };

    const masterActive = allStaffGrantActive(state);

    return (
        <div className="card bg-base-100 shadow-xl mb-6 border border-primary/20">
            <div className="card-body">
                <h2 className="card-title text-xl flex items-center gap-2">
                    <Share2 className="w-5 h-5 text-primary" />
                    Home Talk Sharing
                    <InfoTip helpKey="control.homeSharing" />
                </h2>
                <p className="text-sm text-base-content/70">
                    Classroom teachers and coaches see home charts automatically. Use Currently
                    accessing above to turn a person off. The all-staff grant below is optional.
                </p>

                {loading ? (
                    <div className="py-4 flex justify-center">
                        <span className="loading loading-spinner loading-md text-primary" />
                    </div>
                ) : (
                    <>
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-3 bg-base-200 rounded-lg mt-2">
                            <div>
                                <div className="font-semibold flex items-center gap-2">
                                    {masterActive ? (
                                        <ShieldCheck className="w-4 h-4 text-success" />
                                    ) : (
                                        <ShieldOff className="w-4 h-4 text-base-content/50" />
                                    )}
                                    All teachers and admins
                                </div>
                                <p className="text-xs text-base-content/60">
                                    {masterActive
                                        ? "Every teacher and admin can currently view this child's home talk visualizations."
                                        : "Optional extra grant for every teacher and admin, including people who do not share a classroom."}
                                </p>
                                {masterActive && (
                                    <span
                                        className={`badge badge-sm mt-1 ${state?.allStaff?.transcriptAccess ? "badge-warning" : "badge-ghost"}`}
                                        title="Transcript access is controlled by admins"
                                    >
                                        {state?.allStaff?.transcriptAccess
                                            ? "Transcripts: shared (admin-approved)"
                                            : "Transcripts: not shared"}
                                    </span>
                                )}
                            </div>
                            {masterActive ? (
                                <button
                                    type="button"
                                    className="btn btn-outline btn-error btn-sm"
                                    disabled={busy}
                                    onClick={() =>
                                        run(
                                            () => revokeHomeAccess(childId, { scope: "all-staff" }),
                                            "Access revoked"
                                        )
                                    }
                                >
                                    {busy ? "Revoking…" : "Revoke access"}
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    className="btn btn-primary btn-sm"
                                    disabled={busy}
                                    onClick={() =>
                                        run(
                                            () => grantHomeAccess(childId, { scope: "all-staff" }),
                                            "Access granted"
                                        )
                                    }
                                >
                                    {busy ? "Granting…" : "Grant access to all"}
                                </button>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default HomeTalkSharingPanel;
