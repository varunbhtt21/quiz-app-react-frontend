
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

      {/* Student Routes */}
      <Route path="/student/dashboard" element={
        <ProtectedRoute requireStudent>
          <StudentDashboard />
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
