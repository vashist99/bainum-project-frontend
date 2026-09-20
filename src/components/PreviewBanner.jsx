import { useLocation, useNavigate } from "react-router";
import { Eye, X } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useViewAs } from "../contexts/ViewAsContext";
import { roleDisplayName, shouldRedirectOnPreviewChange } from "../lib/viewAs.js";
import InfoTip from "./InfoTip.jsx";

export default function PreviewBanner() {
    const { user } = useAuth();
    const { isPreviewing, previewRole, exitPreview } = useViewAs();
    const navigate = useNavigate();
    const location = useLocation();

    if (!isPreviewing) return null;

    const handleExit = () => {
        const pathname = location.pathname;
        const actualRole = user?.role;
        exitPreview();
        if (shouldRedirectOnPreviewChange({
            pathname,
            nextPreviewRole: null,
            actualRole,
        })) {
            navigate("/home", { replace: true });
        }
    };

    return (
        <div
            role="status"
            className="alert alert-warning rounded-none shadow-none gap-3 py-2.5 px-4 min-h-0"
        >
            <Eye className="w-5 h-5 shrink-0" aria-hidden="true" />
            <div className="flex-1 min-w-0 text-sm">
                <span className="font-semibold">Viewing as {roleDisplayName(previewRole)}</span>
                <span className="hidden sm:inline">
                    {" "}
                    — a general preview, not a specific person&apos;s account.
                </span>
                <span className="sm:hidden"> — general preview.</span>
                <InfoTip helpKey="control.viewAsBanner" />
            </div>
            <button type="button" className="btn btn-sm btn-ghost gap-1" onClick={handleExit}>
                <X className="w-4 h-4" aria-hidden="true" />
                Exit
            </button>
        </div>
    );
}
