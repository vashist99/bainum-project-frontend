import { useState } from "react";
import { useNavigate } from "react-router";
import { Trash2, ShieldAlert } from "lucide-react";
import toast from "react-hot-toast";
import axios from "../lib/axios";
import { useAuth } from "../contexts/AuthContext";
import { DELETION_CLAUSE } from "../lib/termsContent.js";
import InfoTip from "./InfoTip.jsx";

/**
 * Danger-zone panel on Settings → General for teachers and coaches.
 * Server re-verifies both inputs; this UI just mirrors the contract:
 * password + the literal text DELETE. On success the session is cleared
 * and the user is returned to the login page.
 */
const DeleteAccountPanel = () => {
    const navigate = useNavigate();
    const { logout } = useAuth();
    const [password, setPassword] = useState("");
    const [confirmation, setConfirmation] = useState("");
    const [busy, setBusy] = useState(false);

    const ready = password.length > 0 && confirmation === "DELETE";

    const handleDelete = async (e) => {
        e.preventDefault();
        if (!ready || busy) return;
        setBusy(true);
        try {
            const response = await axios.delete("/api/auth/me", {
                data: { password, confirmation },
            });
            toast.success(response.data?.message || "Your account has been deleted.");
            logout();
            navigate("/");
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to delete account");
            setBusy(false);
        }
    };

    return (
        <div className="card bg-base-100 shadow-xl mt-6 border border-error/30">
            <div className="card-body">
                <h2 className="card-title text-xl flex items-center gap-2 text-error">
                    <Trash2 className="w-5 h-5" />
                    Delete account
                    <InfoTip helpKey="control.deleteAccount" />
                </h2>

                <div className="rounded-lg border border-warning/40 bg-warning/10 p-3 flex gap-2">
                    <ShieldAlert className="w-5 h-5 text-warning shrink-0 mt-0.5" />
                    <p className="text-sm text-base-content/80">{DELETION_CLAUSE}</p>
                </div>

                <form onSubmit={handleDelete} className="mt-2 space-y-3 max-w-md">
                    <label className="form-control">
                        <span className="label-text mb-1">Your password</span>
                        <input
                            type="password"
                            className="input input-bordered"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            autoComplete="current-password"
                        />
                    </label>
                    <label className="form-control">
                        <span className="label-text mb-1">
                            Type <span className="font-mono font-bold">DELETE</span> to confirm
                        </span>
                        <input
                            type="text"
                            className="input input-bordered"
                            value={confirmation}
                            onChange={(e) => setConfirmation(e.target.value)}
                            autoComplete="off"
                        />
                    </label>
                    <button
                        type="submit"
                        className="btn btn-error"
                        disabled={!ready || busy}
                    >
                        {busy ? "Deleting…" : "Permanently delete my account"}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default DeleteAccountPanel;
