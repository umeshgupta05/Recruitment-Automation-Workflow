import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Candidates from "./pages/Candidates";
import CandidateDetail from "./pages/CandidateDetail";
import Upload from "./pages/Upload";
import Workflows from "./pages/Workflows";
import JobsListing from "./pages/JobsListing";
import RecruiterJobs from "./pages/RecruiterJobs";
import JobApply from "./pages/JobApply";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Settings from "./pages/Settings";
import { ToastProvider } from "./components/Toast";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { Loader2 } from "lucide-react";
import { getLandingPath, normalizeRole } from "./utils/auth";

function AuthRoute({ children, allowedRoles, redirectTo }) {
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-surface-base">
        <Loader2 className="w-6 h-6 animate-spin text-primary-400" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const role = normalizeRole(user?.role);
  if (allowedRoles && !allowedRoles.includes(role)) {
    return <Navigate to={redirectTo || getLandingPath(role)} replace />;
  }

  return children;
}

function HomeRedirect() {
  const { user } = useAuth();
  return <Navigate to={getLandingPath(user?.role)} replace />;
}

// App content (inside AuthProvider)
function AppRoutes() {
  const { isAuthenticated, loading, user } = useAuth();
  const location = useLocation();
  const role = normalizeRole(user?.role);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-surface-base">
        <Loader2 className="w-6 h-6 animate-spin text-primary-400" />
      </div>
    );
  }

  // Redirect to dashboard if already logged in and trying to access auth pages
  if (
    isAuthenticated &&
    (location.pathname === "/login" || location.pathname === "/register")
  ) {
    return <Navigate to={getLandingPath(role)} replace />;
  }

  return (
    <Routes>
      {/* Auth Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Public candidate routes */}
      <Route path="/jobs" element={<JobsListing />} />
      <Route path="/jobs/:jobId/apply" element={<JobApply />} />

      {/* Protected Routes */}
      <Route
        path="/"
        element={
          <AuthRoute>
            <Layout />
          </AuthRoute>
        }
      >
        <Route index element={<HomeRedirect />} />
        <Route
          path="dashboard"
          element={
            <AuthRoute allowedRoles={["recruiter", "admin"]}>
              <Dashboard />
            </AuthRoute>
          }
        />
        <Route
          path="dashboard/jobs"
          element={
            <AuthRoute allowedRoles={["recruiter", "admin"]}>
              <RecruiterJobs />
            </AuthRoute>
          }
        />
        <Route
          path="jobs-management"
          element={<Navigate to="/dashboard/jobs" replace />}
        />
        <Route
          path="candidates"
          element={
            <AuthRoute allowedRoles={["recruiter", "admin"]} redirectTo="/jobs">
              <Candidates />
            </AuthRoute>
          }
        />
        <Route
          path="candidates/:id"
          element={
            <AuthRoute allowedRoles={["recruiter", "admin"]} redirectTo="/jobs">
              <CandidateDetail />
            </AuthRoute>
          }
        />
        <Route
          path="upload"
          element={
            <AuthRoute allowedRoles={["recruiter", "admin"]} redirectTo="/jobs">
              <Upload />
            </AuthRoute>
          }
        />
        <Route
          path="workflows"
          element={
            <AuthRoute allowedRoles={["recruiter", "admin"]} redirectTo="/jobs">
              <Workflows />
            </AuthRoute>
          }
        />
        <Route path="settings" element={<Settings />} />
      </Route>

      {/* Catch all - redirect to login */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </ToastProvider>
  );
}
