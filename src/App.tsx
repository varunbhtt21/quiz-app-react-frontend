import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import LoginPage from "./components/auth/LoginPage";
import ProfileCompletion from "./components/auth/ProfileCompletion";
import AdminProfileCompletion from "./components/auth/AdminProfileCompletion";
import ProtectedRoute from "./components/common/ProtectedRoute";
import AdminDashboard from "./pages/admin/AdminDashboard";
import StudentDashboard from "./pages/student/StudentDashboard";

// Admin pages
import MCQList from "./pages/admin/MCQList";
import CreateMCQ from "./pages/admin/CreateMCQ";
import EditMCQ from "./pages/admin/EditMCQ";
import QuestionList from "./pages/admin/QuestionList";
import CreateQuestion from "./pages/admin/CreateQuestion";
import EditQuestion from "./pages/admin/EditQuestion";
import TagManagement from "./pages/admin/TagManagement";
import CourseList from "./pages/admin/CourseList";
import CreateCourse from "./pages/admin/CreateCourse";
import CourseDetails from "./pages/admin/CourseDetails";
import ContestList from "./pages/admin/ContestList";
import CreateContest from "./pages/admin/CreateContest";
import EditContest from "./pages/admin/EditContest";
import ContestDetails from "./pages/admin/ContestDetails";
import Results from "./pages/admin/Results";
import UserList from "./pages/admin/StudentList";
import CreateUser from "./pages/admin/CreateStudent";
import EditUser from "./pages/admin/EditStudent";
import EnrollStudents from "./pages/admin/EnrollStudents";
import EmailManagement from "./pages/admin/EmailManagement";

// Student pages
import ContestTaking from "./pages/student/ContestTaking";
import StudentResults from "./pages/student/StudentResults";

const queryClient = new QueryClient();

const AppRoutes = () => {
  const { isAuthenticated, isAdmin, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={
        isAuthenticated ? (
          <Navigate to={isAdmin ? "/admin/dashboard" : "/student/dashboard"} replace />
        ) : (
          <LoginPage />
        )
      } />
      
      {/* Profile completion routes - no protection needed as they're for authenticated users */}
      <Route path="/complete-profile" element={<ProfileCompletion />} />
      <Route path="/admin/complete-profile" element={<AdminProfileCompletion />} />
      
      {/* Default redirect */}
      <Route path="/" element={
        <Navigate to={isAuthenticated ? (isAdmin ? "/admin/dashboard" : "/student/dashboard") : "/login"} replace />
      } />

      {/* Admin Routes */}
      <Route path="/admin/dashboard" element={
        <ProtectedRoute requireAdmin>
          <AdminDashboard />
        </ProtectedRoute>
      } />
      
      {/* Question Management Routes */}
      <Route path="/admin/questions" element={
        <ProtectedRoute requireAdmin>
          <QuestionList />
        </ProtectedRoute>
      } />
      <Route path="/admin/questions/create" element={
        <ProtectedRoute requireAdmin>
          <CreateQuestion />
        </ProtectedRoute>
      } />
      <Route path="/admin/questions/:id/edit" element={
        <ProtectedRoute requireAdmin>
          <EditQuestion />
        </ProtectedRoute>
      } />

      {/* Legacy MCQ Management Routes (redirect to questions) */}
      <Route path="/admin/mcq" element={
        <ProtectedRoute requireAdmin>
          <QuestionList />
        </ProtectedRoute>
      } />
      <Route path="/admin/mcq/create" element={
        <ProtectedRoute requireAdmin>
          <CreateQuestion />
        </ProtectedRoute>
      } />
      <Route path="/admin/mcq/edit/:id" element={
        <ProtectedRoute requireAdmin>
          <EditMCQ />
        </ProtectedRoute>
      } />

      {/* Tag Management Routes */}
      <Route path="/admin/tags" element={
        <ProtectedRoute requireAdmin>
          <TagManagement />
        </ProtectedRoute>
      } />

      {/* Course Management Routes */}
      <Route path="/admin/courses" element={
        <ProtectedRoute requireAdmin>
          <CourseList />
        </ProtectedRoute>
      } />
      <Route path="/admin/courses/create" element={
        <ProtectedRoute requireAdmin>
          <CreateCourse />
        </ProtectedRoute>
      } />
      <Route path="/admin/courses/:id" element={
        <ProtectedRoute requireAdmin>
          <CourseDetails />
        </ProtectedRoute>
      } />
      <Route path="/admin/courses/:id/enroll" element={
        <ProtectedRoute requireAdmin>
          <EnrollStudents />
        </ProtectedRoute>
      } />

      {/* User Management Routes (includes both students and admins) */}
      <Route path="/admin/users" element={
        <ProtectedRoute requireAdmin>
          <UserList />
        </ProtectedRoute>
      } />
      <Route path="/admin/users/create" element={
        <ProtectedRoute requireAdmin>
          <CreateUser />
        </ProtectedRoute>
      } />
      <Route path="/admin/users/:id/edit" element={
        <ProtectedRoute requireAdmin>
          <EditUser />
        </ProtectedRoute>
      } />

      {/* Student Management Routes (legacy - redirects to users) */}
      <Route path="/admin/students" element={
        <ProtectedRoute requireAdmin>
          <UserList />
        </ProtectedRoute>
      } />
      <Route path="/admin/students/create" element={
        <ProtectedRoute requireAdmin>
          <CreateUser />
        </ProtectedRoute>
      } />
      <Route path="/admin/students/:id/edit" element={
        <ProtectedRoute requireAdmin>
          <EditUser />
        </ProtectedRoute>
      } />

      {/* Contest Management Routes */}
      <Route path="/admin/contests" element={
        <ProtectedRoute requireAdmin>
          <ContestList />
        </ProtectedRoute>
      } />
      <Route path="/admin/contests/create" element={
        <ProtectedRoute requireAdmin>
          <CreateContest />
        </ProtectedRoute>
      } />
      <Route path="/admin/contests/edit/:id" element={
        <ProtectedRoute requireAdmin>
          <EditContest />
        </ProtectedRoute>
      } />
      <Route path="/admin/contests/:id" element={
        <ProtectedRoute requireAdmin>
          <ContestDetails />
        </ProtectedRoute>
      } />

      {/* Results Route */}
      <Route path="/admin/results" element={
        <ProtectedRoute requireAdmin>
          <Results />
        </ProtectedRoute>
      } />

      {/* Email Management Routes */}
      <Route path="/admin/email" element={
        <ProtectedRoute requireAdmin>
          <EmailManagement />
        </ProtectedRoute>
      } />

      {/* Student Routes */}
      <Route path="/student/dashboard" element={
        <ProtectedRoute requireStudent>
          <StudentDashboard />
        </ProtectedRoute>
      } />
      <Route path="/student/contest/:id" element={
        <ProtectedRoute requireStudent>
          <ContestTaking />
        </ProtectedRoute>
      } />
      <Route path="/student/results" element={
        <ProtectedRoute requireStudent>
          <StudentResults />
        </ProtectedRoute>
      } />

      {/* Catch all */}
      <Route path="*" element={
        <Navigate to={isAuthenticated ? (isAdmin ? "/admin/dashboard" : "/student/dashboard") : "/login"} replace />
      } />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
