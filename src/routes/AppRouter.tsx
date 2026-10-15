import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { UserRole } from "@/types/leave";
import SIETLoadingScreen from "@/components/ui/LoadingScreen";
import Login from "@/pages/auth/Login";
import Signup from "@/pages/auth/Signup";
import StudentDashboard from "@/pages/student/StudentDashboard";
import ApplyLeave from "@/pages/student/ApplyLeave";
import MyLeaves from "@/pages/student/MyLeaves";
import StudentProfile from "@/pages/student/Profile";
import FacultyDashboard from "@/pages/faculty/FacultyDashboard";
import FacultyApprovals from "@/pages/faculty/FacultyApprovals";
import FacultyHistory from "@/pages/faculty/FacultyHistory";
import FacultyProfile from "@/pages/faculty/FacultyProfile";
import FacultyApplyLeave from "@/pages/faculty/FacultyApplyLeave";
import FacultyMyLeaves from "@/pages/faculty/FacultyMyLeaves";
import HodDashboard from "@/pages/hod/HodDashboard";
import Approvals from "@/pages/hod/Approvals";
import AllRequests from "@/pages/hod/AllRequests";
import FacultyManagement from "@/pages/hod/FacultyManagement";
import HodProfile from "@/pages/hod/Profile";
import HodFacultyApprovals from "@/pages/hod/HodFacultyApprovals";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import AdminApprovals from "@/pages/admin/AdminApprovals";
import AdminStaffApprovals from "@/pages/admin/AdminStaffApprovals";
import AdminAllRequests from "@/pages/admin/AdminAllRequests";
import AdminManageUsers from "@/pages/admin/AdminManageUsers";
import AdminProfile from "@/pages/admin/AdminProfile";
import PageTransition from "@/components/ui/PageTransition";
import Landing from "@/pages/Landing";

const ProtectedRoute: React.FC<{
  children: React.ReactNode;
  allowedRole?: UserRole;
}> = ({ children, allowedRole }) => {
  const { user, userData, loading } = useAuth();

  if (loading) return <SIETLoadingScreen />;

  if (!user || !userData) {
    return <Navigate to="/login" replace />;
  }

  // Strictly enforce official institutional domain authorization (@sriniet.edu.in) for students
  if (userData.role === "student" && !user.email?.toLowerCase().endsWith("@sriniet.edu.in")) {
    signOut(auth);
    return <Navigate to="/login" replace />;
  }

  // Strictly enforce staff account approval gate
  if (
    (userData.role === "faculty" || userData.role === "hod") &&
    userData.approvalStatus &&
    userData.approvalStatus !== "approved"
  ) {
    signOut(auth);
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

        {/* ── Faculty Routes ── */}
        <Route path="/faculty" element={<Navigate to="/faculty/dashboard" replace />} />
        <Route
          path="/faculty/dashboard"
          element={
            <ProtectedRoute allowedRole="faculty">
              <PageTransition>
                <FacultyDashboard />
              </PageTransition>
            </ProtectedRoute>
          }
        />
        <Route
          path="/faculty/approvals"
          element={
            <ProtectedRoute allowedRole="faculty">
              <PageTransition>
                <FacultyApprovals />
              </PageTransition>
            </ProtectedRoute>
          }
        />
        <Route
          path="/faculty/history"
          element={
            <ProtectedRoute allowedRole="faculty">
              <PageTransition>
                <FacultyHistory />
              </PageTransition>
            </ProtectedRoute>
          }
        />
        <Route
          path="/faculty/apply-leave"
          element={
            <ProtectedRoute allowedRole="faculty">
              <PageTransition>
                <FacultyApplyLeave />
              </PageTransition>
            </ProtectedRoute>
          }
        />
        <Route
          path="/faculty/my-leaves"
          element={
            <ProtectedRoute allowedRole="faculty">
              <PageTransition>
                <FacultyMyLeaves />
              </PageTransition>
            </ProtectedRoute>
          }
        />
        <Route
          path="/faculty/profile"
          element={
            <ProtectedRoute allowedRole="faculty">
              <PageTransition>
                <FacultyProfile />
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
          path="/hod/faculty-approvals"
          element={
            <ProtectedRoute allowedRole="hod">
              <PageTransition>
                <HodFacultyApprovals />
              </PageTransition>
            </ProtectedRoute>
          }
        />
        <Route
          path="/hod/faculty"
          element={
            <ProtectedRoute allowedRole="hod">
              <PageTransition>
                <FacultyManagement />
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

        {/* ── Admin Routes ── */}
        <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute allowedRole="admin">
              <PageTransition>
                <AdminDashboard />
              </PageTransition>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/approvals"
          element={
            <ProtectedRoute allowedRole="admin">
              <PageTransition>
                <AdminApprovals />
              </PageTransition>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/staff-approvals"
          element={
            <ProtectedRoute allowedRole="admin">
              <PageTransition>
                <AdminStaffApprovals />
              </PageTransition>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/all-requests"
          element={
            <ProtectedRoute allowedRole="admin">
              <PageTransition>
                <AdminAllRequests />
              </PageTransition>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/manage-users"
          element={
            <ProtectedRoute allowedRole="admin">
              <PageTransition>
                <AdminManageUsers />
              </PageTransition>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/profile"
          element={
            <ProtectedRoute allowedRole="admin">
              <PageTransition>
                <AdminProfile />
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

export default AppRouter;
