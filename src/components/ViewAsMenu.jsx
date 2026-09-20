import { useLocation, useNavigate } from "react-router";
import { Eye } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useViewAs } from "../contexts/ViewAsContext";
import {
    allowedPreviewRoles,
    roleDisplayName,
    shouldRedirectOnPreviewChange,
} from "../lib/viewAs.js";
import InfoTip from "./InfoTip.jsx";

export default function ViewAsMenu() {
    const { user } = useAuth();
    const { previewRole, isPreviewing, setPreviewRole } = useViewAs();
    const navigate = useNavigate();
    const location = useLocation();

    const options = allowedPreviewRoles(user?.role);
    if (options.length === 0) return null;

    const applyPreview = (role) => {
        const applied = setPreviewRole(role);
        if (!applied) return;
        if (shouldRedirectOnPreviewChange({
            pathname: location.pathname,
            nextPreviewRole: role,
            actualRole: user?.role,
        })) {
            navigate("/home", { replace: true });
        }
    };

    return (
        <div className="dropdown dropdown-end">
            <button
                type="button"
                tabIndex={0}
                className={`btn btn-sm gap-1.5 ${isPreviewing ? "btn-warning" : "btn-ghost"}`}
                aria-haspopup="menu"
                aria-label="View as another role"
            >
                <Eye className="w-4 h-4" aria-hidden="true" />
                <span className="hidden sm:inline">
                    {isPreviewing ? `Viewing as ${roleDisplayName(previewRole)}` : "View as"}
                </span>
            </button>
            <ul
                tabIndex={0}
                className="menu menu-sm dropdown-content mt-2 z-[1] p-2 shadow bg-base-100 rounded-box w-56 border border-base-300"
                role="menu"
                aria-label="Preview roles"
            >
                <li className="menu-title" role="none">
                    <span className="flex items-center gap-1">
                        View as
                        <InfoTip helpKey="control.viewAs" />
                    </span>
                </li>
                {options.map((role) => (
                    <li key={role} role="none">
                        <button
                            type="button"
                            role="menuitem"
                            className={previewRole === role ? "active" : ""}
                            aria-current={previewRole === role ? "true" : undefined}
                            onClick={() => applyPreview(role)}
                        >
                            {roleDisplayName(role)}
                        </button>
                    </li>
                ))}
            </ul>
        </div>
    );
}
