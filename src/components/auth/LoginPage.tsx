import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { BookOpen, Lock, Mail, Eye, EyeOff, Shield, Users, Award, ArrowRight, Sparkles, ArrowLeft, GraduationCap, Trophy, BarChart3, Zap } from 'lucide-react';
import OTPLESSLogin from './OTPLESSLogin';
import ProfileCompletion from './ProfileCompletion';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [currentFeature, setCurrentFeature] = useState(0);
  const [showTraditionalLogin, setShowTraditionalLogin] = useState(false);
  const [showProfileCompletion, setShowProfileCompletion] = useState(false);
  const [tempUserData, setTempUserData] = useState<any>(null);
  
  const { login, loginWithOTPLESS, updateUserProfile, needsProfileCompletion } = useAuth();
  const navigate = useNavigate();

  const features = [
    { 
      icon: BookOpen, 
      title: "Smart Quiz Creation", 
      description: "Create engaging quizzes with AI-powered question generation",
      color: "from-blue-500 to-cyan-500"
    },
    { 
      icon: Users, 
      title: "Student Management", 
      description: "Efficiently manage students with advanced analytics",
      color: "from-green-500 to-emerald-500"
    },
    { 
      icon: Trophy, 
      title: "Contest Management", 
      description: "Host competitive quizzes with real-time leaderboards",
      color: "from-yellow-500 to-orange-500"
    },
    { 
      icon: BarChart3, 
      title: "Analytics Dashboard", 
      description: "Deep insights into student performance and progress",
      color: "from-purple-500 to-pink-500"
    }
  ];

  const stats = [
    { number: "10K+", label: "Questions" },
    { number: "500+", label: "Educators" },
    { number: "50K+", label: "Students" },
    { number: "99.9%", label: "Uptime" }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentFeature((prev) => (prev + 1) % features.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleTraditionalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await login(email, password);
      toast({
        title: "Welcome back! 🎉",
        description: "Login successful. Redirecting to dashboard...",
      });
      navigate('/');
    } catch (error) {
      toast({
        title: "Login failed",
        description: "Please check your credentials and try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleOTPLESSSuccess = async (token: string, userData: any) => {
    try {
      await loginWithOTPLESS(token, userData);
      
      // Check if user needs to complete profile
      if (!userData.profile_completed) {
        setTempUserData(userData);
        setShowProfileCompletion(true);
        return;
      }

      toast({
        title: "Welcome to QuizMaster! 🎉",
        description: "Login successful. Redirecting to dashboard...",
      });
      
      // Add a small delay to ensure auth state is fully updated before navigation
      setTimeout(() => {
        navigate('/');
      }, 200);
      
    } catch (error: any) {
      toast({
        title: "Login Setup Failed",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleProfileComplete = (updatedUser: any) => {
    updateUserProfile(updatedUser);
    setShowProfileCompletion(false);
    
    toast({
      title: "Welcome to QuizMaster! 🎉",
      description: "Your account is ready! Redirecting to dashboard...",
    });
    navigate('/');
  };

  if (showProfileCompletion && tempUserData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 relative overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-gradient-to-r from-blue-400/20 to-purple-400/20 rounded-full filter blur-3xl animate-pulse"></div>
          <div className="absolute top-3/4 right-1/4 w-72 h-72 bg-gradient-to-r from-green-400/20 to-blue-400/20 rounded-full filter blur-3xl animate-pulse delay-1000"></div>
        </div>

        <div className="relative z-10 min-h-screen flex items-center justify-center px-4 py-8">
          <ProfileCompletion />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-gradient-to-r from-blue-400/10 to-purple-400/10 rounded-full filter blur-3xl animate-pulse"></div>
        <div className="absolute top-3/4 right-1/4 w-72 h-72 bg-gradient-to-r from-green-400/10 to-blue-400/10 rounded-full filter blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-indigo-400/5 to-purple-400/5 rounded-full filter blur-3xl animate-pulse delay-2000"></div>
      </div>

      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGRlZnM+CjxwYXR0ZXJuIGlkPSJncmlkIiB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHBhdHRlcm5Vbml0cz0idXNlclNwYWNlT25Vc2UiPgo8cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJyZ2JhKDUkLCEwNSw5NSx5LjAyKSIgc3Ryb2tlLXdpZHRoPSIxIi8+CjwvcGF0dGVybj4KPC9kZWZzPgo8cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+Cjwvc3ZnPgo=')] opacity-30"></div>

      <div className="relative z-10 min-h-screen">
        {/* Header */}
        <header className="px-4 py-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between">
              {/* Logo */}
              <div className="flex items-center space-x-3">
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-3 rounded-2xl shadow-lg">
                  <BookOpen className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">QuizMaster</h1>
                  <p className="text-blue-600 text-sm font-medium">by Jazzee</p>
                </div>
              </div>

              {/* Stats - Hidden on mobile */}
              <div className="hidden lg:flex items-center space-x-8">
                {stats.map((stat, index) => (
                  <div key={index} className="text-center">
                    <div className="text-2xl font-bold text-gray-900">{stat.number}</div>
                    <div className="text-sm text-gray-600">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="px-4 py-8 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-12 items-center min-h-[calc(100vh-200px)]">
              
              {/* Left Panel - Hero Content */}
              <div className="space-y-8 text-center lg:text-left">
                {/* Main Heading */}
                <div className="space-y-6">
                  <div className="space-y-4">
                    <Badge className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-2">
                      <Sparkles className="h-4 w-4 mr-2" />
                      Trusted by 500+ Educators
                    </Badge>
                    
                    <h2 className="text-4xl lg:text-5xl xl:text-6xl font-bold leading-tight">
                      Transform Your
                      <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent block mt-2">
                        Teaching Experience
                      </span>
                    </h2>
                  </div>
                  
                  <p className="text-xl text-gray-600 leading-relaxed max-w-2xl">
                    Create engaging quizzes, manage students effortlessly, and track performance with our comprehensive educational platform.
                  </p>
                </div>

                {/* Feature Cards */}
                <div className="space-y-4">
                  {features.map((feature, index) => {
                    const Icon = feature.icon;
                    const isActive = currentFeature === index;
                    
                    return (
                      <div
                        key={index}
                        className={`flex items-center space-x-4 p-4 lg:p-6 rounded-2xl transition-all duration-700 ${
                          isActive 
                            ? 'bg-white/80 backdrop-blur-sm shadow-xl border border-white/20 scale-105' 
                            : 'bg-white/40 backdrop-blur-sm border border-white/10 hover:bg-white/60'
                        }`}
                      >
                        <div className={`p-3 lg:p-4 rounded-xl transition-all duration-700 ${
                          isActive 
                            ? `bg-gradient-to-r ${feature.color} shadow-lg scale-110` 
                            : 'bg-white/50'
                        }`}>
                          <Icon className={`h-6 w-6 lg:h-7 lg:w-7 ${isActive ? 'text-white' : 'text-gray-600'}`} />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-gray-900">{feature.title}</h3>
                          <p className="text-gray-600 text-sm lg:text-base">{feature.description}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Mobile Stats */}
                <div className="lg:hidden grid grid-cols-2 gap-4">
                  {stats.map((stat, index) => (
                    <div key={index} className="bg-white/60 backdrop-blur-sm rounded-xl p-4 text-center border border-white/20">
                      <div className="text-2xl font-bold text-gray-900">{stat.number}</div>
                      <div className="text-sm text-gray-600">{stat.label}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Panel - Login Form */}
              <div className="flex justify-center lg:justify-end">
                <div className="w-full max-w-md">
                  {!showTraditionalLogin ? (
                    // OTPless Login (Primary)
                    <OTPLESSLogin 
                      onLoginSuccess={handleOTPLESSSuccess}
                      onShowTraditionalLogin={() => setShowTraditionalLogin(true)}
                    />
                  ) : (
                    // Traditional Login (Admin)
                    <Card className="overflow-hidden border-0 shadow-2xl bg-white/95 backdrop-blur-lg">
                      <CardHeader className="bg-gradient-to-br from-orange-50 via-red-50 to-pink-50 text-center pb-6">
                        <div className="flex justify-center mb-4">
                          <Badge className="bg-gradient-to-r from-orange-600 to-red-600 text-white px-4 py-2">
                            <Shield className="h-4 w-4 mr-2" />
                            Administrator Access
                          </Badge>
                        </div>
                        
                        <CardTitle className="text-2xl lg:text-3xl font-bold mb-3">
                          <span className="bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                            Admin Login
                          </span>
                        </CardTitle>
                        
                        <CardDescription className="text-gray-600">
                          Sign in with your administrator credentials
                        </CardDescription>
                      </CardHeader>

                      <CardContent className="p-6 lg:p-8">
                        <form onSubmit={handleTraditionalSubmit} className="space-y-6">
                          <div className="space-y-2">
                            <Label htmlFor="email" className="text-gray-700 font-medium">Email Address</Label>
                            <div className="relative group">
                              <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-orange-500 transition-colors" />
                              <Input
                                id="email"
                                type="email"
                                placeholder="Enter your email address"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="pl-12 h-12 border-2 border-gray-200 focus:border-orange-500 focus:ring-orange-500/20 rounded-xl transition-all duration-300"
                                required
                              />
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="password" className="text-gray-700 font-medium">Password</Label>
                            <div className="relative group">
                              <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-orange-500 transition-colors" />
                              <Input
                                id="password"
                                type={showPassword ? "text" : "password"}
                                placeholder="Enter your password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="pl-12 pr-12 h-12 border-2 border-gray-200 focus:border-orange-500 focus:ring-orange-500/20 rounded-xl transition-all duration-300"
                                required
                              />
                              <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                              >
                                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                              </button>
                            </div>
                          </div>

                          <Button 
                            type="submit" 
                            disabled={isLoading}
                            className="w-full h-14 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white font-semibold text-lg rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]"
                          >
                            {isLoading ? (
                              <div className="flex items-center space-x-2">
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                <span>Signing In...</span>
                              </div>
                            ) : (
                              <div className="flex items-center space-x-2">
                                <Shield className="h-6 w-6" />
                                <span>Sign In as Admin</span>
                                <ArrowRight className="h-5 w-5" />
                              </div>
                            )}
                          </Button>
                        </form>

                        {/* Back to OTPless */}
                        <div className="pt-6 border-t border-gray-200 mt-6">
                          <div className="text-center">
                            <p className="text-gray-600 text-sm mb-4">Are you a student?</p>
                            <Button
                              variant="outline"
                              onClick={() => setShowTraditionalLogin(false)}
                              className="w-full border-2 border-gray-300 hover:border-blue-500 hover:bg-blue-50 transition-all duration-300 group"
                            >
                              <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                              Back to Mobile Login
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default LoginPage;
