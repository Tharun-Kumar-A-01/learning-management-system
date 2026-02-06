import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { useBranding } from './hooks/useBranding';
import Navbar from './components/layout/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';

// Dashboard pages
import LearnerDashboard from './pages/dashboard/LearnerDashboard';
import TrainerDashboard from './pages/dashboard/TrainerDashboard';
import AdminDashboard from './pages/dashboard/AdminDashboard';
import SuperAdminDashboard from './pages/dashboard/SuperAdminDashboard';

// Course pages
import CoursesListPage from './pages/courses/CoursesListPage';
import CourseDetailsPage from './pages/courses/CourseDetailsPage';
import CreateCoursePage from './pages/courses/CreateCoursePage';
import AppealsPage from './pages/courses/AppealsPage';
import AssessmentsPage from './pages/courses/AssessmentsPage';

// User pages
import UsersListPage from './pages/users/UsersListPage';
import UserDetailsPage from './pages/users/UserDetailsPage';

// Students page (for trainers)
import StudentsPage from './pages/students/StudentsPage';

// Other pages
import ProfilePage from './pages/ProfilePage';
import SettingsPage from './pages/settings/SettingsPage';
import ReportsPage from './pages/reports/ReportsPage';
import CertificatesPage from './pages/certificates/CertificatesPage';
import LearningPoliciesPage from './pages/settings/LearningPoliciesPage';
import BrandingPage from './pages/settings/BrandingPage';
import VerifyCertificatePage from './pages/VerifyCertificatePage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';

// New Feature Pages
import InboxPage from './pages/inbox/InboxPage';
import AnalyticsPage from './pages/analytics/AnalyticsPage';
import KnowledgeBasePage from './pages/knowledge/KnowledgeBasePage';
import ArticleEditorPage from './pages/knowledge/ArticleEditorPage';
import ArticleDetailsPage from './pages/knowledge/ArticleDetailsPage';

// Role-based dashboard router
const RoleBasedDashboard = () => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  switch (user.role) {
    case 'super_admin':
      return <SuperAdminDashboard />;
    case 'admin':
      return <AdminDashboard />;
    case 'trainer':
      return <TrainerDashboard />;
    case 'learner':
    default:
      return <LearnerDashboard />;
  }
};

// Protected route wrapper
const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // If specific roles are required, check them
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

// Public route - redirect to dashboard if already logged in
const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

// Landing page for non-logged in users
const LandingPage = () => {
  const { user } = useAuth();
  const { settings } = useBranding();

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-black text-white">
        {/* Hero Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-5xl font-extrabold tracking-tight sm:text-6xl">
              <span className="block text-white">Transform Your</span>
              <span className="block" style={{ color: settings.primaryColor }}>
                Learning Experience
              </span>
            </h1>
            <p className="mt-6 max-w-2xl mx-auto text-xl text-zinc-400">
              {settings.tagline}
            </p>
            <div className="mt-10 flex justify-center gap-4">
              <Link
                to="/register"
                className="px-8 py-3 text-black rounded-lg text-lg font-medium transition-colors hover:opacity-90"
                style={{ backgroundColor: settings.primaryColor }}
              >
                Get Started
              </Link>
              <Link
                to="/login"
                className="px-8 py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-lg font-medium transition-colors border border-white/10"
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bg-[#1a1a1a] rounded-xl border border-[#2a2a2a] p-6 text-center">
              <div
                className="w-12 h-12 mx-auto mb-4 bg-opacity-10 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: `${settings.primaryColor}1a` }}
              >
                <svg className="w-6 h-6" style={{ color: settings.primaryColor }} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-[#e4e4ea] mb-2">Course Management</h3>
              <p className="text-[#666] text-sm">Create and manage structured courses with modules and lessons</p>
            </div>
            <div className="bg-[#1a1a1a] rounded-xl border border-[#2a2a2a] p-6 text-center">
              <div
                className="w-12 h-12 mx-auto mb-4 bg-opacity-10 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: `${settings.primaryColor}1a` }}
              >
                <svg className="w-6 h-6" style={{ color: settings.primaryColor }} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-[#e4e4ea] mb-2">Assessments</h3>
              <p className="text-[#666] text-sm">Create quizzes and auto-evaluate learner performance</p>
            </div>
            <div className="bg-[#1a1a1a] rounded-xl border border-[#2a2a2a] p-6 text-center">
              <div
                className="w-12 h-12 mx-auto mb-4 bg-opacity-10 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: `${settings.primaryColor}1a` }}
              >
                <svg className="w-6 h-6" style={{ color: settings.primaryColor }} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M7.73 9.728a6.726 6.726 0 002.748 1.35m8.272-6.842V4.5c0 2.108-.966 3.99-2.48 5.228m2.48-5.492a46.32 46.32 0 012.916.52 6.003 6.003 0 01-5.395 4.972m0 0a6.726 6.726 0 01-2.749 1.35m0 0a6.772 6.772 0 01-3.044 0" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-[#e4e4ea] mb-2">Certifications</h3>
              <p className="text-[#666] text-sm">Auto-generate certificates on course completion</p>
            </div>
            <div className="bg-[#1a1a1a] rounded-xl border border-[#2a2a2a] p-6 text-center">
              <div
                className="w-12 h-12 mx-auto mb-4 bg-opacity-10 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: `${settings.primaryColor}1a` }}
              >
                <svg className="w-6 h-6" style={{ color: settings.primaryColor }} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-[#e4e4ea] mb-2">Analytics</h3>
              <p className="text-[#666] text-sm">Track progress and generate detailed reports</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="min-h-screen bg-black font-sans antialiased">
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/verify" element={<VerifyCertificatePage />} />
            <Route
              path="/login"
              element={
                <PublicRoute>
                  <Login />
                </PublicRoute>
              }
            />
            <Route
              path="/register"
              element={
                <PublicRoute>
                  <Register />
                </PublicRoute>
              }
            />
            <Route
              path="/forgot-password"
              element={
                <PublicRoute>
                  <ForgotPasswordPage />
                </PublicRoute>
              }
            />
            <Route
              path="/reset-password/:token"
              element={
                <PublicRoute>
                  <ResetPasswordPage />
                </PublicRoute>
              }
            />

            {/* Protected routes - Dashboard */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <RoleBasedDashboard />
                </ProtectedRoute>
              }
            />

            {/* Protected routes - Courses */}
            <Route
              path="/courses"
              element={
                <ProtectedRoute>
                  <CoursesListPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/courses/create"
              element={
                <ProtectedRoute allowedRoles={['trainer', 'admin', 'super_admin']}>
                  <CreateCoursePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/assessments"
              element={
                <ProtectedRoute allowedRoles={['learner', 'trainer', 'admin', 'super_admin']}>
                  <AssessmentsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/courses/:id"
              element={
                <ProtectedRoute>
                  <CourseDetailsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/courses/:id/edit"
              element={
                <ProtectedRoute allowedRoles={['trainer', 'admin', 'super_admin']}>
                  <CreateCoursePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/appeals"
              element={
                <ProtectedRoute>
                  <AppealsPage />
                </ProtectedRoute>
              }
            />

            {/* Protected routes - Users */}
            <Route
              path="/users"
              element={
                <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
                  <UsersListPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/users/:id"
              element={
                <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
                  <UserDetailsPage />
                </ProtectedRoute>
              }
            />

            {/* Protected routes - Students (Trainer) */}
            <Route
              path="/students"
              element={
                <ProtectedRoute allowedRoles={['trainer', 'admin', 'super_admin']}>
                  <StudentsPage />
                </ProtectedRoute>
              }
            />

            {/* Protected routes - Profile & Settings */}
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <SettingsPage />
                </ProtectedRoute>
              }
            />

            {/* Protected routes - Reports */}
            <Route
              path="/reports"
              element={
                <ProtectedRoute allowedRoles={['trainer', 'admin', 'super_admin']}>
                  <ReportsPage />
                </ProtectedRoute>
              }
            />

            {/* Protected routes - Certificates */}
            <Route
              path="/certificates"
              element={
                <ProtectedRoute>
                  <CertificatesPage />
                </ProtectedRoute>
              }
            />

            {/* Protected routes - Inbox */}
            <Route
              path="/inbox"
              element={
                <ProtectedRoute>
                  <InboxPage />
                </ProtectedRoute>
              }
            />

            {/* Protected routes - Analytics */}
            <Route
              path="/analytics"
              element={
                <ProtectedRoute>
                  <AnalyticsPage />
                </ProtectedRoute>
              }
            />

            {/* Protected routes - Knowledge Base */}
            <Route
              path="/knowledge"
              element={
                <ProtectedRoute>
                  <KnowledgeBasePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/knowledge/:id"
              element={
                <ProtectedRoute>
                  <ArticleDetailsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/knowledge/new"
              element={
                <ProtectedRoute allowedRoles={['trainer', 'admin', 'super_admin']}>
                  <ArticleEditorPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/knowledge/:id/edit"
              element={
                <ProtectedRoute allowedRoles={['trainer', 'admin', 'super_admin']}>
                  <ArticleEditorPage />
                </ProtectedRoute>
              }
            />

            {/* Protected routes - Enrollments */}
            <Route
              path="/enrollments"
              element={
                <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
                  <EnrollmentsPage />
                </ProtectedRoute>
              }
            />



            {/* Protected routes - Super Admin only */}
            <Route
              path="/organizations"
              element={
                <ProtectedRoute allowedRoles={['super_admin']}>
                  <OrganizationsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/learning-policies"
              element={
                <ProtectedRoute allowedRoles={['super_admin']}>
                  <LearningPoliciesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/branding"
              element={
                <ProtectedRoute allowedRoles={['super_admin']}>
                  <BrandingPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/system-settings"
              element={
                <ProtectedRoute allowedRoles={['super_admin']}>
                  <SystemSettingsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/audit-logs"
              element={
                <ProtectedRoute allowedRoles={['super_admin']}>
                  <AuditLogsPage />
                </ProtectedRoute>
              }
            />

            {/* Catch all - redirect to dashboard or login */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </div>
      </AuthProvider>
    </Router>
  );
}

// Simple placeholder pages for routes that need more work
function EnrollmentsPage() {
  return (
    <ProtectedRouteContent title="Enrollments" description="Manage course enrollments">
      <div className="bg-zinc-900/50 rounded-xl border border-white/10 p-12 text-center">
        <div className="text-5xl mb-4">📋</div>
        <h3 className="text-xl font-semibold text-white mb-2">Enrollment Management</h3>
        <p className="text-zinc-400">
          Enroll learners to courses and manage enrollments. This feature will allow bulk enrollment,
          enrollment reports, and deadline management.
        </p>
      </div>
    </ProtectedRouteContent>
  );
}



function OrganizationsPage() {
  return (
    <ProtectedRouteContent title="Organizations" description="Manage organizations">
      <div className="bg-zinc-900/50 rounded-xl border border-white/10 p-12 text-center">
        <div className="text-5xl mb-4">🏢</div>
        <h3 className="text-xl font-semibold text-white mb-2">Organization Management</h3>
        <p className="text-zinc-400">
          Manage multiple organizations on the platform. Configure organization profiles, branding, and learning policies.
        </p>
      </div>
    </ProtectedRouteContent>
  );
}

function SystemSettingsPage() {
  return (
    <ProtectedRouteContent title="System Settings" description="Configure system settings">
      <div className="bg-zinc-900/50 rounded-xl border border-white/10 p-12 text-center">
        <div className="text-5xl mb-4">🔧</div>
        <h3 className="text-xl font-semibold text-white mb-2">System Configuration</h3>
        <p className="text-zinc-400">
          Configure platform-wide settings including authentication, notifications, and integrations.
        </p>
      </div>
    </ProtectedRouteContent>
  );
}

function AuditLogsPage() {
  return (
    <ProtectedRouteContent title="Audit Logs" description="View system activity logs">
      <div className="bg-zinc-900/50 rounded-xl border border-white/10 p-12 text-center">
        <div className="text-5xl mb-4">📜</div>
        <h3 className="text-xl font-semibold text-white mb-2">Audit Logs</h3>
        <p className="text-zinc-400">
          View detailed logs of all system activities including user actions, login attempts, and configuration changes.
        </p>
      </div>
    </ProtectedRouteContent>
  );
}

// Helper component for placeholder pages
import DashboardLayout from './components/layout/DashboardLayout';

function ProtectedRouteContent({ title, description, children }) {
  return (
    <DashboardLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">{title}</h1>
        <p className="text-zinc-400 mt-2">{description}</p>
      </div>
      {children}
    </DashboardLayout>
  );
}
