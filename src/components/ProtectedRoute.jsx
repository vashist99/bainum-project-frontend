import { useAuth } from '../contexts/AuthContext';
import { useViewAs } from '../contexts/ViewAsContext';
import { getPrimaryChildId } from '../utils/parentChildren.js';
import { Navigate, useLocation } from 'react-router';
import { parentHomeRedirect, pathAllowedDuringPreview, routeAccess } from '../lib/viewAs.js';

const ProtectedRoute = ({ children, requiredRole = null, excludeRoles = [], skipParentHomeRedirect = false }) => {
  const { user, loading } = useAuth();
  const { effectiveRole, isPreviewing, previewRole } = useViewAs();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-base-200 flex items-center justify-center">
        <div className="loading loading-spinner loading-lg"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  if (isPreviewing && !pathAllowedDuringPreview(previewRole, location.pathname)) {
    return <Navigate to="/home" replace />;
  }

  const parentRedirect = parentHomeRedirect({
    effectiveRole,
    isPreviewing,
    primaryChildId: getPrimaryChildId(user),
    skipParentHomeRedirect,
    requiredRole,
    excludeRoles,
  });
  if (parentRedirect) {
    return <Navigate to={parentRedirect} replace />;
  }

  const access = routeAccess({ effectiveRole, requiredRole, excludeRoles });
  if (access === "deny") {
    if (isPreviewing) {
      return <Navigate to="/home" replace />;
    }

    const primaryChild = getPrimaryChildId(user);
    return (
      <div className="min-h-screen bg-base-200 flex items-center justify-center">
        <div className="card bg-base-100 shadow-xl max-w-md">
          <div className="card-body text-center">
            <div className="text-6xl mb-4">🚫</div>
            <h2 className="card-title justify-center text-2xl mb-2">Access Denied</h2>
            <p className="text-base-content/70 mb-4">
              {requiredRole
                ? "You don't have permission to access this page."
                : "This page is not available for your role."}
            </p>
            {requiredRole && (
              <p className="text-sm text-base-content/50 mb-6">
                Required role:{" "}
                <span className="font-semibold capitalize">
                  {Array.isArray(requiredRole) ? requiredRole.join(" or ") : requiredRole}
                </span>
              </p>
            )}
            <div className="card-actions justify-center">
              {primaryChild && !requiredRole ? (
                <a href={`/data/child/${primaryChild}`} className="btn btn-primary">
                  Go to Child's Page
                </a>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => window.history.back()}
                    className="btn btn-primary"
                  >
                    Go Back
                  </button>
                  <a href="/home" className="btn btn-ghost">
                    Go Home
                  </a>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return children;
};

export default ProtectedRoute;
