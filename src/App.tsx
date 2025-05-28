import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import LoginPage from "./components/auth/LoginPage";
import ProtectedRoute from "./components/common/ProtectedRoute";
import AdminDashboard from "./pages/admin/AdminDashboard";
import StudentDashboard from "./pages/student/StudentDashboard";

// Admin pages
import MCQList from "./pages/admin/MCQList";
import CreateMCQ from "./pages/admin/CreateMCQ";
import EditMCQ from "./pages/admin/EditMCQ";
import CourseList from "./pages/admin/CourseList";
import CreateCourse from "./pages/admin/CreateCourse";
import CourseDetails from "./pages/admin/CourseDetails";
import ContestList from "./pages/admin/ContestList";
import CreateContest from "./pages/admin/CreateContest";
import ContestDetails from "./pages/admin/ContestDetails";
import Results from "./pages/admin/Results";
import StudentList from "./pages/admin/StudentList";
import CreateStudent from "./pages/admin/CreateStudent";
import EnrollStudents from "./pages/admin/EnrollStudents";

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
      
      {/* MCQ Management Routes */}
      <Route path="/admin/mcq" element={
        <ProtectedRoute requireAdmin>
          <MCQList />
        </ProtectedRoute>
      } />
      <Route path="/admin/mcq/create" element={
        <ProtectedRoute requireAdmin>
          <CreateMCQ />
        </ProtectedRoute>
      } />
      <Route path="/admin/mcq/edit/:id" element={
        <ProtectedRoute requireAdmin>
          <EditMCQ />
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

      {/* Student Management Routes */}
      <Route path="/admin/students" element={
        <ProtectedRoute requireAdmin>
          <StudentList />
        </ProtectedRoute>
      } />
      <Route path="/admin/students/create" element={
        <ProtectedRoute requireAdmin>
          <CreateStudent />
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
