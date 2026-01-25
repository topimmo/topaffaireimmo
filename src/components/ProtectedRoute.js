import { jsx as _jsx, Fragment as _Fragment } from "react/jsx-runtime";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
export default function ProtectedRoute({ children, allowedRoles, }) {
    const { user, profile, loading, profileLoading } = useAuth();
    const location = useLocation();
    // Wait for both auth and profile to finish loading
    if (loading || profileLoading) {
        return (_jsx("div", { style: { padding: "2rem", textAlign: "center" }, children: "Loading..." }));
    }
    // Redirect to login if no user
    if (!user) {
        // Save the current location to redirect back after login
        return _jsx(Navigate, { to: "/login", state: { from: location.pathname }, replace: true });
    }
    // Check role only if allowedRoles is specified AND profile is loaded
    // If profile isn't loaded yet (shouldn't happen due to loading check above), 
    // but just in case, we allow access if user is authenticated
    if (allowedRoles &&
        profile?.user_role &&
        !allowedRoles.includes(profile.user_role)) {
        return _jsx(Navigate, { to: "/", replace: true });
    }
    return _jsx(_Fragment, { children: children });
}
