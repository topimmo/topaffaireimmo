import { jsx as _jsx, Fragment as _Fragment } from "react/jsx-runtime";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
export default function ProtectedRoute({ children, allowedRoles, }) {
    const { user, profile, loading } = useAuth();
    const location = useLocation();
    // أثناء التحميل
    if (loading) {
        return (_jsx("div", { style: { padding: "2rem", textAlign: "center" }, children: "Loading..." }));
    }
    // إذا لم يسجل المستخدم دخوله
    if (!user) {
        // Save the current location to redirect back after login
        return _jsx(Navigate, { to: "/login", state: { from: location.pathname }, replace: true });
    }
    // إذا المستخدم لا يملك الدور المطلوب
    if (allowedRoles &&
        profile?.user_role &&
        !allowedRoles.includes(profile.user_role)) {
        return _jsx(Navigate, { to: "/", replace: true });
    }
    return _jsx(_Fragment, { children: children });
}
