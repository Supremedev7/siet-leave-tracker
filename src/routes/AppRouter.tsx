import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import Login from "@/pages/auth/Login";
import Signup from "@/pages/auth/Signup";
import StudentDashboard from "@/pages/student/StudentDashboard";
import ApplyLeave from "@/pages/student/ApplyLeave";
import HodDashboard from "@/pages/hod/HodDashboard";
import Approvals from "@/pages/hod/Approvals";

const ProtectedRoute: React.FC<{
  children: React.ReactNode;
  allowedRole?: "student" | "hod";
}> = ({ children, allowedRole }) => {
  const { user, userData, loading } = useAuth();

  if (loading) return <div className="h-screen w-screen flex items-center justify-center">Loading...</div>;

  if (!user || !userData) {
    return <Navigate to="/login" />;
  }

  if (allowedRole && userData.role !== allowedRole) {
    return <Navigate to={`/${userData.role}/dashboard`} />;
  }

  return <>{children}</>;
};

export const AppRouter = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        
        {/* Student Routes */}
        <Route path="/student" element={<Navigate to="/student/dashboard" />} />
        <Route
          path="/student/dashboard"
          element={
            <ProtectedRoute allowedRole="student">
              <StudentDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/apply"
          element={
            <ProtectedRoute allowedRole="student">
              <ApplyLeave />
            </ProtectedRoute>
          }
        />
        
        {/* HOD Routes */}
        <Route path="/hod" element={<Navigate to="/hod/dashboard" />} />
        <Route
          path="/hod/dashboard"
          element={
            <ProtectedRoute allowedRole="hod">
              <HodDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/hod/approvals"
          element={
            <ProtectedRoute allowedRole="hod">
              <Approvals />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  );
};
