import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useAuth } from "./AuthContext";
import {
    canPreviewAs,
    clearStoredPreviewRole,
    readStoredPreviewRole,
    resolveEffectiveRole,
    writeStoredPreviewRole,
} from "../lib/viewAs.js";

const ViewAsContext = createContext(null);

// eslint-disable-next-line react-refresh/only-export-components
export const useViewAs = () => {
    const context = useContext(ViewAsContext);
    if (!context) {
        throw new Error("useViewAs must be used within a ViewAsProvider");
    }
    return context;
};

export const ViewAsProvider = ({ children }) => {
    const { user, loading } = useAuth();
    const [previewRole, setPreviewRoleState] = useState(null);

    useEffect(() => {
        if (loading) return;
        if (!user) {
            setPreviewRoleState(null);
            clearStoredPreviewRole();
            return;
        }
        setPreviewRoleState(readStoredPreviewRole(user.role));
    }, [loading, user]);

    const setPreviewRole = (role) => {
        if (!canPreviewAs(user?.role, role)) return false;
        setPreviewRoleState(role);
        writeStoredPreviewRole(role);
        return true;
    };

    const exitPreview = () => {
        setPreviewRoleState(null);
        clearStoredPreviewRole();
    };

    const effectiveRole = resolveEffectiveRole(user?.role, previewRole);
    const isPreviewing = previewRole != null && effectiveRole === previewRole;

    const value = useMemo(
        () => ({
            previewRole: isPreviewing ? previewRole : null,
            isPreviewing,
            effectiveRole,
            setPreviewRole,
            exitPreview,
            effectiveIsAdmin: () => effectiveRole === "admin",
            effectiveIsTeacher: () => effectiveRole === "teacher",
            effectiveIsParent: () => effectiveRole === "parent",
            effectiveIsCoach: () => effectiveRole === "coach",
        }),
        // setPreviewRole/exitPreview close over user?.role; recreate when role changes
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [previewRole, isPreviewing, effectiveRole, user?.role]
    );

    return <ViewAsContext.Provider value={value}>{children}</ViewAsContext.Provider>;
};
