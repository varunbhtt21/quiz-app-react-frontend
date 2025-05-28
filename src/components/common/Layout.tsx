import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '@/components/ui/button';
import { LogOut, User, BookOpen, Home, FileText, Trophy, GraduationCap, BarChart3, HelpCircle } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isAdminRoute = location.pathname.startsWith('/admin');
  const isStudentRoute = location.pathname.startsWith('/student');

  const adminNavItems = [
    { 
      label: 'Dashboard', 
      path: '/admin/dashboard', 
      icon: Home,
      description: 'Overview and getting started guide'
    },
    { 
      label: 'Students', 
      path: '/admin/students', 
      icon: User,
      description: 'Manage student accounts and profiles'
    },
    { 
      label: 'Question Bank', 
      path: '/admin/mcq', 
      icon: FileText,
      description: 'Manage MCQ questions for assessments'
    },
    { 
      label: 'Courses', 
      path: '/admin/courses', 
      icon: GraduationCap,
      description: 'Create and manage courses'
    },
    { 
      label: 'Quiz Contests', 
      path: '/admin/contests', 
      icon: Trophy,
      description: 'Schedule and manage quiz competitions'
    },
    { 
      label: 'Results & Analytics', 
      path: '/admin/results', 
      icon: BarChart3,
      description: 'View performance reports and export data'
    },
  ];

  const studentNavItems = [
    { 
      label: 'Dashboard', 
      path: '/student/dashboard', 
      icon: Home,
      description: 'View available contests and courses'
    },
    { 
      label: 'My Results', 
      path: '/student/results', 
      icon: BarChart3,
      description: 'View your quiz performance and scores'
    },
  ];

  const navItems = isAdminRoute ? adminNavItems : studentNavItems;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-2 rounded-lg">
                  <BookOpen className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    Quiz System
                  </h1>
                  <p className="text-xs text-gray-500">Online Assessment Platform</p>
                </div>
              </div>
              {isAdminRoute && (
                <div className="flex items-center space-x-2">
                  <span className="text-sm bg-blue-100 text-blue-800 px-3 py-1 rounded-full font-medium">
                    Administrator
                  </span>
                  <div className="text-xs text-gray-500">
                    Manage courses, questions & contests
                  </div>
                </div>
              )}
              {isStudentRoute && (
                <div className="flex items-center space-x-2">
                  <span className="text-sm bg-green-100 text-green-800 px-3 py-1 rounded-full font-medium">
                    Student Portal
                  </span>
                  <div className="text-xs text-gray-500">
                    Take quizzes & view results
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3 bg-gray-50 px-3 py-2 rounded-lg">
                <User className="h-4 w-4 text-gray-500" />
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-700">
                    {user?.email?.split('@')[0] || 'User'}
                  </div>
                  <div className="text-xs text-gray-500">
                    {isAdmin ? 'Administrator' : 'Student'}
                  </div>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="flex items-center space-x-2 hover:bg-red-50 hover:border-red-200 hover:text-red-600"
              >
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Menu */}
      {(isAdminRoute || isStudentRoute) && (
        <nav className="bg-white border-b shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex space-x-8">
              {navItems.map((item) => {
                const isActive = location.pathname === item.path || 
                  (item.path !== '/admin/dashboard' && item.path !== '/student/dashboard' && location.pathname.startsWith(item.path));
                const Icon = item.icon;
                
                return (
                  <button
                    key={item.path}
                    onClick={() => navigate(item.path)}
                    className={`group flex items-center space-x-2 py-4 px-1 border-b-2 text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                    title={item.description}
                  >
                    <Icon className={`h-4 w-4 transition-colors ${
                      isActive ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-600'
                    }`} />
                    <span>{item.label}</span>
                    {!isActive && (
                      <HelpCircle className="h-3 w-3 text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
          
          {/* Navigation Helper */}
          <div className="bg-blue-50 border-t border-blue-100">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
              <div className="flex items-center justify-between text-xs text-blue-700">
                <div className="flex items-center space-x-4">
                  {navItems.map((item) => {
                    const isActive = location.pathname === item.path || 
                      (item.path !== '/admin/dashboard' && item.path !== '/student/dashboard' && location.pathname.startsWith(item.path));
                    
                    if (isActive) {
                      return (
                        <div key={item.path} className="flex items-center space-x-1">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          <span className="font-medium">{item.description}</span>
                        </div>
                      );
                    }
                    return null;
                  })}
                </div>
                <div className="text-blue-600">
                  💡 Hover over navigation items for help
                </div>
              </div>
            </div>
          </div>
        </nav>
      )}
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
};

export default Layout;
