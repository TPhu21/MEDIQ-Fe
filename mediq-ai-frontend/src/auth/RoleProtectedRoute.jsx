import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "./AuthContext";

export const RoleProtectedRoute = ({ allowedRoles, children }) => {
  const { user } = useAuth();

  if (!user || !allowedRoles.includes(user.role)) {
    if (user?.role === "PATIENT") return <Navigate to="/patient/dashboard" replace />;
    if (user?.role === "DOCTOR") return <Navigate to="/doctor/workspace" replace />;
    if (user?.role === "ADMIN") return <Navigate to="/admin/dashboard" replace />;
    return <Navigate to="/login" replace />;
  }

  return children;
};