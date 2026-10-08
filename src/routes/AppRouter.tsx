import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import SIETLoadingScreen from "@/components/ui/LoadingScreen";
import Login from "@/pages/auth/Login";
import Signup from "@/pages/auth/Signup";
import StudentDashboard from "@/pages/student/StudentDashboard";
import ApplyLeave from "@/pages/student/ApplyLeave";
import MyLeaves from "@/pages/student/MyLeaves";
import StudentProfile from "@/pages/student/Profile";
import HodDashboard from "@/pages/hod/HodDashboard";
import Approvals from "@/pages/hod/Approvals";
import AllRequests from "@/pages/hod/AllRequests";
import HodProfile from "@/pages/hod/Profile";
import PageTransition from "@/components/ui/PageTransition";
import Landing from "@/pages/Landing";

const ProtectedRoute: React.FC<{
  children: React.ReactNode;
  allowedRole?: "student" | "hod";
}> = ({ children, allowedRole }) => {
  const { user, userData, loading } = useAuth();

  if (loading) return <SIETLoadingScreen />;

  if (!user || !userData) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRole && userData.role !== allowedRole) {
    return <Navigate to={`/${userData.role}/dashboard`} replace />;
  }

  return <>{children}</>;
};

export const AppRouter = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Landing Page */}
        <Route path="/" element={<PageTransition><Landing /></PageTransition>} />
        <Route path="/landing" element={<PageTransition><Landing /></PageTransition>} />

        {/* Auth */}
        <Route path="/login"  element={<PageTransition><Login /></PageTransition>} />
        <Route path="/signup" element={<PageTransition><Signup /></PageTransition>} />

        {/* ── Student Routes ── */}
        <Route path="/student" element={<Navigate to="/student/dashboard" replace />} />
        <Route
          path="/student/dashboard"
          element={
            <ProtectedRoute allowedRole="student">
              <PageTransition>
                <StudentDashboard />
              </PageTransition>
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/apply"
          element={
            <ProtectedRoute allowedRole="student">
              <PageTransition>
                <ApplyLeave />
              </PageTransition>
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/leaves"
          element={
            <ProtectedRoute allowedRole="student">
              <PageTransition>
                <MyLeaves />
              </PageTransition>
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/profile"
          element={
            <ProtectedRoute allowedRole="student">
              <PageTransition>
                <StudentProfile />
              </PageTransition>
            </ProtectedRoute>
          }
        />

        {/* ── HOD Routes ── */}
        <Route path="/hod" element={<Navigate to="/hod/dashboard" replace />} />
        <Route
          path="/hod/dashboard"
          element={
            <ProtectedRoute allowedRole="hod">
              <PageTransition>
                <HodDashboard />
              </PageTransition>
            </ProtectedRoute>
          }
        />
        <Route
          path="/hod/approvals"
          element={
            <ProtectedRoute allowedRole="hod">
              <PageTransition>
                <Approvals />
              </PageTransition>
            </ProtectedRoute>
          }
        />
        <Route
          path="/hod/all-requests"
          element={
            <ProtectedRoute allowedRole="hod">
              <PageTransition>
                <AllRequests />
              </PageTransition>
            </ProtectedRoute>
          }
        />
        <Route
          path="/hod/profile"
          element={
            <ProtectedRoute allowedRole="hod">
              <PageTransition>
                <HodProfile />
              </PageTransition>
            </ProtectedRoute>
          }
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};
