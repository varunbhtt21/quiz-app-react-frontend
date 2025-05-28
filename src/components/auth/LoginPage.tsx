import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { BookOpen, Lock, Mail, Eye, EyeOff, Shield, Users, Award, Zap, ArrowRight, Sparkles, GraduationCap, ChevronRight } from 'lucide-react';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [currentFeature, setCurrentFeature] = useState(0);
  const { login } = useAuth();
  const navigate = useNavigate();

  const features = [
    { icon: BookOpen, title: "Smart Quiz Creation", description: "Create engaging quizzes with ease" },
    { icon: Users, title: "Student Management", description: "Efficiently manage all your students" },
    { icon: Award, title: "Real-time Analytics", description: "Track performance with detailed insights" },
    { icon: Shield, title: "Secure Platform", description: "Enterprise-grade security & privacy" }
  ];

  const demoAccounts = [
    { type: "Admin", email: "admin@quiz.com", password: "admin123", icon: Shield, color: "from-blue-500 to-blue-600" },
    { type: "Student", email: "student@quiz.com", password: "password", icon: GraduationCap, color: "from-green-500 to-green-600" }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentFeature((prev) => (prev + 1) % features.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await login(email, password);
      toast({
        title: "✨ Welcome back!",
        description: "Login successful. Redirecting to dashboard...",
      });
      navigate('/');
    } catch (error) {
      toast({
        title: "🚫 Login failed",
        description: "Please check your credentials and try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = async (demoEmail: string, demoPassword: string) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    setIsLoading(true);

    try {
      await login(demoEmail, demoPassword);
      toast({
        title: "✨ Welcome to the demo!",
        description: `Logged in as ${demoEmail.includes('admin') ? 'Admin' : 'Student'}. Exploring the platform...`,
      });
      navigate('/');
    } catch (error) {
      toast({
        title: "🚫 Demo login failed",
        description: "Please try again or contact support.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full filter blur-3xl animate-pulse"></div>
        <div className="absolute top-3/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full filter blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500/5 rounded-full filter blur-3xl animate-pulse delay-2000"></div>
      </div>

      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHZpZXdCb3g9IjAgMCAyMCAyMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGRlZnM+CjxwYXR0ZXJuIGlkPSJncmlkIiB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHBhdHRlcm5Vbml0cz0idXNlclNwYWNlT25Vc2UiPgo8cGF0aCBkPSJNIDIwIDAgTCAwIDAgMCAyMCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDMpIiBzdHJva2Utd2lkdGg9IjEiLz4KPC9wYXR0ZXJuPgo8L2RlZnM+CjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz4KPHN2Zz4K')] opacity-30"></div>

      <div className="relative z-10 min-h-screen flex">
        {/* Left Panel - Feature Showcase */}
        <div className="hidden lg:flex lg:w-1/2 xl:w-3/5 flex-col justify-center px-12 xl:px-16">
          <div className="max-w-xl">
            {/* Logo and Brand */}
            <div className="flex items-center space-x-3 mb-8">
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-3 rounded-2xl shadow-lg">
                <BookOpen className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">QuizMaster</h1>
                <p className="text-blue-200 text-sm">Silicon Institute</p>
              </div>
            </div>

            {/* Main Heading */}
            <div className="mb-12">
              <h2 className="text-5xl xl:text-6xl font-bold text-white leading-tight mb-6">
                Transform
                <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent block">
                  Learning
                </span>
                Experience
              </h2>
              <p className="text-xl text-gray-300 leading-relaxed">
                Empower educators with our comprehensive quiz management platform. 
                Create, manage, and analyze assessments with intelligent insights.
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
                    className={`flex items-center space-x-4 p-4 rounded-xl transition-all duration-500 ${
                      isActive 
                        ? 'bg-white/10 border border-white/20 shadow-lg backdrop-blur-sm' 
                        : 'bg-white/5 border border-white/10'
                    }`}
                  >
                    <div className={`p-3 rounded-lg transition-all duration-500 ${
                      isActive 
                        ? 'bg-gradient-to-r from-blue-500 to-purple-600 scale-110' 
                        : 'bg-white/10'
                    }`}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-white font-semibold">{feature.title}</h3>
                      <p className="text-gray-300 text-sm">{feature.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Panel - Login Form */}
        <div className="w-full lg:w-1/2 xl:w-2/5 flex items-center justify-center px-6 py-12">
          <div className="w-full max-w-md">
            {/* Mobile Logo */}
            <div className="lg:hidden flex items-center justify-center mb-8">
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-4 rounded-3xl shadow-2xl">
                <BookOpen className="h-10 w-10 text-white" />
              </div>
            </div>

            <Card className="backdrop-blur-lg bg-white/95 shadow-2xl border-0 overflow-hidden">
              <CardHeader className="text-center pb-6 bg-gradient-to-br from-blue-50 to-purple-50">
                <div className="flex items-center justify-center mb-4">
                  <Badge className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-1">
                    <Sparkles className="h-3 w-3 mr-1" />
                    Welcome Back
                  </Badge>
                </div>
                <CardTitle className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                  Sign In
                </CardTitle>
                <CardDescription className="text-gray-600">
                  Access your dashboard and continue learning
                </CardDescription>
              </CardHeader>

              <CardContent className="p-8">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-gray-700 font-medium">Email Address</Label>
                    <div className="relative group">
                      <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="Enter your email address"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-12 h-12 border-2 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 rounded-xl transition-all duration-300"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-gray-700 font-medium">Password</Label>
                    <div className="relative group">
                      <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-12 pr-12 h-12 border-2 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 rounded-xl transition-all duration-300"
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
                    className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <div className="flex items-center space-x-2">
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        <span>Signing In...</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <span>Sign In</span>
                        <ArrowRight className="h-4 w-4" />
                      </div>
                    )}
                  </Button>
                </form>

                {/* Demo Accounts Section */}
                <div className="mt-8">
                  <div className="flex items-center justify-center mb-4">
                    <div className="h-px bg-gray-200 flex-1"></div>
                    <span className="px-4 text-sm text-gray-500 bg-white">Quick Demo Access</span>
                    <div className="h-px bg-gray-200 flex-1"></div>
                  </div>

                  <div className="grid grid-cols-1 gap-3">
                    {demoAccounts.map((account, index) => {
                      const Icon = account.icon;
                      return (
                        <button
                          key={index}
                          onClick={() => handleDemoLogin(account.email, account.password)}
                          disabled={isLoading}
                          className="flex items-center justify-between p-4 border-2 border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50/50 transition-all duration-300 group disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <div className="flex items-center space-x-3">
                            <div className={`p-2 rounded-lg bg-gradient-to-r ${account.color} shadow-lg`}>
                              <Icon className="h-5 w-5 text-white" />
                            </div>
                            <div className="text-left">
                              <div className="font-semibold text-gray-800">{account.type} Demo</div>
                              <div className="text-sm text-gray-500">{account.email}</div>
                            </div>
                          </div>
                          {isLoading ? (
                            <div className="w-5 h-5 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
                          ) : (
                            <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-blue-500 transform group-hover:translate-x-1 transition-all duration-300" />
                          )}
                        </button>
                      );
                    })}
                  </div>

                  <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <div className="flex items-center space-x-2 text-amber-800">
                      <Zap className="h-4 w-4" />
                      <span className="text-sm font-medium">One-Click Demo</span>
                    </div>
                    <p className="text-xs text-amber-700 mt-1">
                      Click any demo account above to instantly log in and explore the platform
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Footer */}
            <div className="text-center mt-6 text-gray-400 text-sm">
              <p>© 2025 Silicon Institute. All rights reserved.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
