// src/components/ProtectedRoute.tsx
import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/lib/utils"; // استيراد صحيح من utils.ts

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: string[];
}

export default function ProtectedRoute({
  children,
  allowedRoles,
}: ProtectedRouteProps) {
  const { user, profile, loading } = useAuth();

  // أثناء التحميل
  if (loading) {
    return (
      <div style={{ padding: "2rem", textAlign: "center" }}>
        Loading...
      </div>
    );
  }

  // إذا لم يسجل المستخدم دخوله
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // إذا المستخدم لا يملك الدور المطلوب
  if (
    allowedRoles &&
    profile?.user_role &&
    !allowedRoles.includes(profile.user_role)
  ) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
