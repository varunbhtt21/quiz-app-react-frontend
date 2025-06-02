import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '@/components/ui/button';
import { LogOut, User, BookOpen, Home, FileText, Trophy, GraduationCap, BarChart3, HelpCircle, Menu, X, Sparkles, ChevronDown, Bell, Settings, Users, Tag } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

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
      description: 'Overview and getting started guide',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200'
    },
    { 
      label: 'User Management', 
      path: '/admin/users', 
      icon: Users,
      description: 'Manage user accounts and system access',
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200'
    },
    { 
      label: 'Question Bank', 
      path: '/admin/mcq', 
      icon: FileText,
      description: 'Manage MCQ questions for assessments',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200'
    },
    { 
      label: 'Tag Management', 
      path: '/admin/tags', 
      icon: Tag,
      description: 'Organize questions with tags and categories',
      color: 'text-teal-600',
      bgColor: 'bg-teal-50',
      borderColor: 'border-teal-200'
    },
    { 
      label: 'Courses', 
      path: '/admin/courses', 
      icon: GraduationCap,
      description: 'Create and manage courses',
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      borderColor: 'border-indigo-200'
    },
    { 
      label: 'Quiz Contests', 
      path: '/admin/contests', 
      icon: Trophy,
      description: 'Schedule and manage quiz competitions',
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200'
    },
    { 
      label: 'Results & Analytics', 
      path: '/admin/results', 
      icon: BarChart3,
      description: 'View performance reports and export data',
      color: 'text-pink-600',
      bgColor: 'bg-pink-50',
      borderColor: 'border-pink-200'
    },
  ];

  const studentNavItems = [
    { 
      label: 'Dashboard', 
      path: '/student/dashboard', 
      icon: Home,
      description: 'View available contests and courses',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200'
    },
    { 
      label: 'My Results', 
      path: '/student/results', 
      icon: BarChart3,
      description: 'View your quiz performance and scores',
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200'
    },
  ];

  const navItems = isAdminRoute ? adminNavItems : studentNavItems;

  const handleNavigation = (path: string) => {
    navigate(path);
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30">
      {/* Enhanced Header */}
      <header className="relative bg-white/95 backdrop-blur-lg shadow-lg border-b border-white/20 z-50">
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 via-purple-600/5 to-indigo-600/5"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Enhanced Left side - Logo and brand */}
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <div className="bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-600 p-3 rounded-2xl shadow-lg transform hover:scale-105 transition-transform duration-200">
                    <BookOpen className="h-7 w-7 text-white" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse shadow-sm"></div>
                </div>
                <div className="hidden sm:block">
                  <div className="text-center">
                    <h1 className="text-2xl font-bold text-gray-900 mb-1">
                    QuizMaster
                  </h1>
                    <p className="text-sm text-jazzee-500 font-semibold">by Jazzee</p>
                  </div>
                </div>
              </div>
              
              {/* Enhanced Role badge */}
              {isAdminRoute && (
                <div className="hidden lg:flex items-center space-x-3 bg-gradient-to-r from-blue-50 to-indigo-50 px-4 py-2 rounded-xl border border-blue-100 shadow-sm">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                    <span className="text-sm font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                      Administrator
                    </span>
                  </div>
                  <div className="text-xs text-gray-600 font-medium">
                    Full System Access
                  </div>
                </div>
              )}
              {isStudentRoute && (
                <div className="hidden lg:flex items-center space-x-3 bg-gradient-to-r from-green-50 to-emerald-50 px-4 py-2 rounded-xl border border-green-100 shadow-sm">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-sm font-semibold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                      Student Portal
                    </span>
                  </div>
                  <div className="text-xs text-gray-600 font-medium">
                    Learning Dashboard
                  </div>
                </div>
              )}
            </div>
            
            {/* Enhanced Right side - Actions and user info */}
            <div className="flex items-center space-x-3">
              {/* Notifications */}
              <Button
                variant="ghost"
                size="sm"
                className="relative hidden sm:flex h-10 w-10 rounded-xl hover:bg-blue-50 hover:scale-105 transition-all duration-200"
              >
                <Bell className="h-5 w-5 text-gray-600" />
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </Button>

              {/* Mobile menu button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden h-10 w-10 rounded-xl hover:bg-blue-50 hover:scale-105 transition-all duration-200"
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>

              {/* Enhanced User info */}
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="hidden sm:flex items-center space-x-3 bg-gradient-to-r from-white to-gray-50 px-4 py-2 rounded-xl border border-gray-200 shadow-sm hover:shadow-md hover:scale-105 transition-all duration-200"
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center shadow-sm">
                    <span className="text-white font-semibold text-sm">
                      {user?.email?.charAt(0).toUpperCase() || 'U'}
                    </span>
                  </div>
                  <div className="text-left">
                    <div className="text-sm font-semibold text-gray-800">
                      {user?.email?.split('@')[0] || 'User'}
                    </div>
                    <div className="text-xs text-gray-500">
                      {isAdmin ? 'Administrator' : 'Student'}
                    </div>
                  </div>
                  <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${userMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* User dropdown menu */}
                {userMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="text-sm font-semibold text-gray-800">{user?.email}</p>
                      <p className="text-xs text-gray-500">{isAdmin ? 'System Administrator' : 'Student Account'}</p>
                    </div>
                    <button className="w-full flex items-center space-x-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                      <Settings className="h-4 w-4" />
                      <span>Settings</span>
                    </button>
                    <button 
                      onClick={handleLogout}
                      className="w-full flex items-center space-x-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Mobile user indicator */}
              <div className="sm:hidden w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center shadow-sm">
                <span className="text-white font-semibold text-sm">
                  {user?.email?.charAt(0).toUpperCase() || 'U'}
                </span>
              </div>

              {/* Quick logout for mobile */}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="sm:hidden h-10 w-10 rounded-xl hover:bg-red-50 hover:scale-105 transition-all duration-200 text-red-600"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {(isAdminRoute || isStudentRoute) && mobileMenuOpen && (
          <div className="md:hidden absolute top-20 left-0 right-0 bg-white/95 backdrop-blur-lg shadow-xl border-b border-gray-100 z-40">
            <div className="px-4 py-6">
              {/* Role badge for mobile */}
              <div className="mb-6 pb-4 border-b border-gray-100">
                {isAdminRoute && (
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-4 py-3 rounded-xl border border-blue-100">
                    <span className="text-sm font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                      Administrator Dashboard
                    </span>
                  </div>
                )}
                {isStudentRoute && (
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-4 py-3 rounded-xl border border-green-100">
                    <span className="text-sm font-semibold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                      Student Portal
                    </span>
                  </div>
                )}
              </div>
              
              {/* Mobile navigation items */}
              <div className="space-y-3">
                {navItems.map((item) => {
                  const isActive = location.pathname === item.path || 
                    (item.path !== '/admin/dashboard' && item.path !== '/student/dashboard' && location.pathname.startsWith(item.path));
                  const Icon = item.icon;
                  
                  return (
                    <button
                      key={item.path}
                      onClick={() => handleNavigation(item.path)}
                      className={`w-full flex items-center space-x-4 px-4 py-4 rounded-xl text-left transition-all duration-200 transform hover:scale-[1.02] ${
                        isActive
                          ? `${item.bgColor} ${item.color} border ${item.borderColor} shadow-sm`
                          : 'text-gray-700 hover:bg-gray-50 border border-transparent'
                      }`}
                    >
                      <div className={`p-2 rounded-lg ${isActive ? 'bg-white shadow-sm' : 'bg-gray-100'}`}>
                        <Icon className={`h-5 w-5 ${isActive ? item.color : 'text-gray-500'}`} />
                      </div>
                      <div>
                        <div className="font-semibold">{item.label}</div>
                        <div className="text-xs text-gray-500">{item.description}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Enhanced Desktop Navigation Menu */}
      {(isAdminRoute || isStudentRoute) && (
        <nav className="hidden md:block bg-white/90 backdrop-blur-lg border-b border-gray-100 shadow-sm sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex space-x-1">
              {navItems.map((item) => {
                const isActive = location.pathname === item.path || 
                  (item.path !== '/admin/dashboard' && item.path !== '/student/dashboard' && location.pathname.startsWith(item.path));
                const Icon = item.icon;
                
                return (
                  <button
                    key={item.path}
                    onClick={() => navigate(item.path)}
                    className={`group relative flex items-center space-x-3 px-6 py-4 text-sm font-medium transition-all duration-200 rounded-t-xl ${
                      isActive
                        ? `${item.color} ${item.bgColor} border-t-2 ${item.borderColor.replace('border-', 'border-t-')} shadow-sm`
                        : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                    }`}
                    title={item.description}
                  >
                    <div className={`p-1.5 rounded-lg transition-all duration-200 ${
                      isActive ? 'bg-white shadow-sm scale-110' : 'group-hover:bg-white group-hover:shadow-sm'
                    }`}>
                      <Icon className={`h-4 w-4 transition-all duration-200 ${
                        isActive ? item.color : 'text-gray-400 group-hover:text-gray-600'
                      }`} />
                    </div>
                    <span className="font-semibold">{item.label}</span>
                    {!isActive && (
                      <Sparkles className="h-3 w-3 text-gray-300 opacity-0 group-hover:opacity-100 transition-all duration-200 absolute -top-1 -right-1" />
                    )}
                    {isActive && (
                      <div className="absolute -bottom-px left-1/2 transform -translate-x-1/2 w-8 h-0.5 bg-gradient-to-r from-transparent via-current to-transparent rounded-full"></div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </nav>
      )}

      {/* Overlay for mobile menu */}
      {mobileMenuOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black/20 backdrop-blur-sm z-30 transition-all duration-200"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Overlay for user menu */}
      {userMenuOpen && (
        <div 
          className="fixed inset-0 z-30"
          onClick={() => setUserMenuOpen(false)}
        />
      )}

      {/* Main content */}
      <main className="relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
