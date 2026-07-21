import { useState } from "react";
import { FileText, ShieldCheck, ShieldOff } from "lucide-react";
import toast from "react-hot-toast";
import { setHomeTranscriptAccess } from "../lib/homeAccessApi";
import { adminGrantRows } from "../utils/homeViewAccess";

/**
 * Admin-only management of the home transcript tier. Parents grant
 * visualizations-only access; each active grant here can additionally be
 * given transcript access by an admin (mirrors the coach model).
 */
const HomeTranscriptAccessPanel = ({ childId, state, onChanged }) => {
    const [busyGrantId, setBusyGrantId] = useState(null);
    const grants = adminGrantRows(state);

    if (grants.length === 0) return null;

    const toggle = async (grant) => {
        const next = !grant.transcriptAccess;
        setBusyGrantId(grant.grantId);
        try {
            const result = await setHomeTranscriptAccess(childId, grant.grantId, next);
            toast.success(
                result?.message ||
                    (next ? "Transcript access granted" : "Transcript access removed")
            );
            await onChanged?.();
        } catch (error) {
            toast.error(error.response?.data?.message || "Something went wrong");
        } finally {
            setBusyGrantId(null);
        }
    };

    return (
        <div className="card bg-base-100 shadow-xl mb-6 border border-primary/20">
            <div className="card-body">
                <h2 className="card-title text-xl flex items-center gap-2">
                    <FileText className="w-5 h-5 text-primary" />
                    Home Sharing Grants
                </h2>
                <p className="text-sm text-base-content/70">
                    Parent grants share home talk visualizations only. As an admin you decide,
                    per grant, whether the transcripts themselves are also visible.
                </p>
                <ul className="space-y-2 mt-2">
                    {grants.map((grant) => (
                        <li
                            key={grant.grantId}
                            className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-3 bg-base-200 rounded-lg"
                        >
                            <div className="min-w-0">
                                <div className="font-medium flex items-center gap-2 truncate">
                                    {grant.transcriptAccess ? (
                                        <ShieldCheck className="w-4 h-4 text-success shrink-0" />
                                    ) : (
                                        <ShieldOff className="w-4 h-4 text-base-content/50 shrink-0" />
                                    )}
                                    <span className="truncate">
                                        {grant.granteeName}
                                        {grant.granteeRole ? ` (${grant.granteeRole})` : ""}
                                    </span>
                                </div>
                                <p className="text-xs text-base-content/60">
                                    {grant.transcriptAccess
                                        ? "Visualizations and transcripts"
                                        : "Visualizations only"}
                                </p>
                            </div>
                            <button
                                type="button"
                                className={`btn btn-sm ${grant.transcriptAccess ? "btn-outline btn-error" : "btn-primary"}`}
                                disabled={busyGrantId !== null}
                                onClick={() => toggle(grant)}
                            >
                                {busyGrantId === grant.grantId
                                    ? "Saving…"
                                    : grant.transcriptAccess
                                      ? "Remove transcript access"
                                      : "Allow transcripts"}
                            </button>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

export default HomeTranscriptAccessPanel;
