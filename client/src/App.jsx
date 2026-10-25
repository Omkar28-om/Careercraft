import { BrowserRouter, Routes, Route } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";
import { AuthProvider } from "./context/AuthContext";
import CanvasCursor from "./components/CanvasCursor";

// Pages
import Coding from "./pages/Coding";
import Problem from "./pages/Problem";
import Courses from "./pages/Courses";
import CourseDetail from "./pages/CourseDetail";
import CourseLesson from "./pages/CourseLesson";
import CourseQuiz from "./pages/CourseQuiz";
import Jobs from "./pages/Jobs";
import JobDetail from "./pages/JobDetail";
import Applications from "./pages/Applications";
import SavedJobs from "./pages/SavedJobs";
import Internships from "./pages/Internships";
import Freelance from "./pages/Freelance";
import FreelanceProjectDetail from "./pages/FreelanceProjectDetail";
import FreelanceProposals from "./pages/FreelanceProposals";
import FreelanceContracts from "./pages/FreelanceContracts";
import FreelanceEarnings from "./pages/FreelanceEarnings";
import Projects from "./pages/Projects";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import Career from "./pages/Career";
import Achievements from "./pages/Achievements";
import Notifications from "./pages/Notifications";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Domains from "./pages/Domains";
import ResumeStudio from "./pages/ResumeStudio";

// Admin Pages
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminUserDetail from "./pages/admin/AdminUserDetail";
import AdminCourses from "./pages/admin/AdminCourses";
import AdminJobs from "./pages/admin/AdminJobs";
import AdminCoding from "./pages/admin/AdminCoding";
import AdminProjects from "./pages/admin/AdminProjects";
import AdminFreelance from "./pages/admin/AdminFreelance";
import AdminNotifications from "./pages/admin/AdminNotifications";
import AdminAuditLogs from "./pages/admin/AdminAuditLogs";

import Home from "./pages/Home";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <CanvasCursor />

        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/domains"
            element={
              <ProtectedRoute>
                <Domains />
              </ProtectedRoute>
            }
          />
          <Route path="/coding" element={<Coding />} />
          <Route path="/coding/problems/:slug" element={<Problem />} />
          <Route path="/coding/problems/:id" element={<Problem />} />
          <Route path="/coding/problems/two-sum" element={<Problem />} />
          <Route path="/courses" element={<Courses />} />
          <Route path="/courses/:slug/quiz" element={<CourseQuiz />} />
          <Route path="/courses/:slug" element={<CourseDetail />} />
          <Route path="/courses/:slug/lessons/:lessonSlug" element={<CourseLesson />} />
          <Route path="/jobs" element={<Jobs />} />
          <Route path="/jobs/:id" element={<JobDetail />} />
          <Route
            path="/applications"
            element={
              <ProtectedRoute>
                <Applications />
              </ProtectedRoute>
            }
          />
          <Route
            path="/jobs/saved"
            element={
              <ProtectedRoute>
                <SavedJobs />
              </ProtectedRoute>
            }
          />
          <Route path="/internships" element={<Internships />} />
          <Route path="/freelance" element={<Freelance />} />
          <Route path="/freelance/projects/:id" element={<FreelanceProjectDetail />} />
          <Route
            path="/freelance/proposals"
            element={
              <ProtectedRoute>
                <FreelanceProposals />
              </ProtectedRoute>
            }
          />
          <Route
            path="/freelance/contracts"
            element={
              <ProtectedRoute>
                <FreelanceContracts />
              </ProtectedRoute>
            }
          />
          <Route
            path="/freelance/earnings"
            element={
              <ProtectedRoute>
                <FreelanceEarnings />
              </ProtectedRoute>
            }
          />
          <Route path="/projects" element={<Projects />} />
          <Route path="/resume" element={<ResumeStudio />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/career"
            element={
              <ProtectedRoute>
                <Career />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/achievements"
            element={
              <ProtectedRoute>
                <Achievements />
              </ProtectedRoute>
            }
          />
          <Route
            path="/notifications"
            element={
              <ProtectedRoute>
                <Notifications />
              </ProtectedRoute>
            }
          />

          {/* Admin Routes */}
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <AdminRoute>
                <AdminUsers />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/users/:id"
            element={
              <AdminRoute>
                <AdminUserDetail />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/courses"
            element={
              <AdminRoute>
                <AdminCourses />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/jobs"
            element={
              <AdminRoute>
                <AdminJobs />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/coding"
            element={
              <AdminRoute>
                <AdminCoding />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/projects"
            element={
              <AdminRoute>
                <AdminProjects />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/freelance"
            element={
              <AdminRoute>
                <AdminFreelance />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/notifications"
            element={
              <AdminRoute>
                <AdminNotifications />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/audit-logs"
            element={
              <AdminRoute>
                <AdminAuditLogs />
              </AdminRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
