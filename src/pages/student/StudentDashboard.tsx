import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Trophy, Clock, CheckCircle, Play, Calendar, Award, BookOpen, Target, 
  TrendingUp, Users, Star, Timer, User, Mail, Zap, Activity, 
  GraduationCap, ChevronRight, Bell, Settings
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/common/Layout';
import StatusBadge from '../../components/common/StatusBadge';
import { useAuth } from '../../context/AuthContext';
import { apiService } from '../../services/api';
import { toast } from '@/hooks/use-toast';

interface Contest {
  id: string;
  name: string;
  description?: string;
  status: "not_started" | "in_progress" | "ended";
  start_time: string;
  end_time: string;
  course_id: string;
  course_name?: string;
  has_submitted: boolean;
}

interface StudentStats {
  contestsTaken: number;
  averageScore: string;
  activeCourses: number;
}

const StudentDashboard = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [contests, setContests] = useState<Contest[]>([]);
  const [stats, setStats] = useState<StudentStats>({
    contestsTaken: 0,
    averageScore: '0%',
    activeCourses: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Only load data when authentication is ready and user is authenticated
    if (!authLoading && isAuthenticated) {
      loadStudentData();
    } else if (!authLoading && !isAuthenticated) {
      // User is not authenticated, redirect to login
      console.log('Student dashboard: User not authenticated, redirecting to login');
      navigate('/login');
    }
  }, [authLoading, isAuthenticated, navigate]);

  const loadStudentData = async () => {
    // Double-check authentication before making API calls
    if (!isAuthenticated || !user) {
      console.error('Attempted to load data without authentication');
      toast({
        title: "Authentication Required",
        description: "Please log in to view your dashboard",
        variant: "destructive"
      });
      navigate('/login');
      return;
    }

    // Verify token exists in localStorage
    const token = localStorage.getItem('access_token');
    if (!token) {
      console.error('No access token found in localStorage');
      toast({
        title: "Session Expired",
        description: "Please log in again",
        variant: "destructive"
      });
      navigate('/login');
      return;
    }

    try {
      setLoading(true);
      console.log('Loading student data for:', user.email);
      
      // Load contests with authentication
      const contestsData = await apiService.getContests() as Contest[];
      console.log('Contests received:', contestsData.length);
      
      // Get all submissions first (single API call)
      let submissionMap = new Map<string, boolean>();
      try {
        const submissions = await apiService.getMySubmissions() as any[];
        submissions.forEach(sub => {
          submissionMap.set(sub.contest_id, true);
        });
        console.log('Loaded submissions for', submissions.length, 'contests');
      } catch (error) {
        console.log('Could not load submissions, will mark all as not submitted');
      }

      // Load course names efficiently (keeping course fetching for now, could be optimized further)
      const contestsWithCourseNames = await Promise.all(
        contestsData.map(async (contest) => {
          try {
            const course = await apiService.getCourse(contest.course_id) as { id: string; name: string };
            
            return {
              ...contest,
              course_name: course.name || 'Unknown Course',
              has_submitted: submissionMap.get(contest.id) || false
            };
          } catch (error) {
            return {
              ...contest,
              course_name: 'Unknown Course',
              has_submitted: submissionMap.get(contest.id) || false
            };
          }
        })
      );
      
      setContests(contestsWithCourseNames);
      console.log('Processed contests:', contestsWithCourseNames.length);
      
      // Calculate stats from actual submissions
      const completedContests = contestsWithCourseNames.filter(c => 
        getContestStatus(c.start_time, c.end_time) === 'ended' || c.has_submitted
      );
      
      // Get actual average score from submissions
      let averageScore = '0%';
      try {
        const submissions = await apiService.getMySubmissions() as any[];
        if (submissions.length > 0) {
          const totalPercentage = submissions.reduce((sum: number, sub: any) => sum + sub.percentage, 0);
          averageScore = `${(totalPercentage / submissions.length).toFixed(1)}%`;
        }
      } catch (error) {
        // If submissions can't be loaded, keep default
        console.log('Could not load submissions for average calculation');
      }
      
      setStats({
        contestsTaken: completedContests.length,
        averageScore: averageScore,
        activeCourses: new Set(contestsWithCourseNames.map(c => c.course_id)).size
      });
      
    } catch (error) {
      console.error('Error loading student data:', error);
      
      // Check if it's an authentication error
      if (error instanceof Error && (error.message.includes('401') || error.message.includes('Not authenticated'))) {
        toast({
          title: "Session Expired",
          description: "Please log in again to continue",
          variant: "destructive"
        });
        localStorage.removeItem('access_token');
        localStorage.removeItem('user');
        navigate('/login');
      } else {
        toast({
          title: "Error",
          description: "Failed to load dashboard data. Please refresh the page.",
          variant: "destructive"
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const getContestStatus = (startTime: string, endTime: string): "not_started" | "in_progress" | "ended" => {
    const now = new Date();
    const start = new Date(startTime.replace('Z', ''));
    const end = new Date(endTime.replace('Z', ''));
    
    if (now < start) return "not_started";
    if (now >= start && now <= end) return "in_progress";
    return "ended";
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString.replace('Z', '')).toLocaleString();
  };

  const getTimeRemaining = (endTime: string) => {
    const now = new Date();
    const end = new Date(endTime.replace('Z', ''));
    const diff = end.getTime() - now.getTime();
    
    if (diff <= 0) return 'Ended';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days}d ${hours % 24}h`;
    }
    
    return `${hours}h ${minutes}m`;
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const getDisplayName = () => {
    if (user?.name) return user.name;
    if (user?.email) {
      const emailName = user.email.split('@')[0];
      return emailName.charAt(0).toUpperCase() + emailName.slice(1);
    }
    return 'Student';
  };

  // Wait for auth loading to complete
  if (authLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-500 text-lg">Checking authentication...</p>
          </div>
        </div>
      </Layout>
    );
  }

  // User not authenticated
  if (!isAuthenticated || !user) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
              <User className="h-8 w-8 text-red-600" />
            </div>
            <p className="text-gray-500 text-lg">Authentication required</p>
            <Button onClick={() => navigate('/login')}>
              Go to Login
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  const activeContests = contests.filter(c => 
    getContestStatus(c.start_time, c.end_time) === 'in_progress' && !c.has_submitted
  );
  const upcomingContests = contests.filter(c => 
    getContestStatus(c.start_time, c.end_time) === 'not_started' && !c.has_submitted
  );
  const completedContests = contests.filter(c => 
    getContestStatus(c.start_time, c.end_time) === 'ended' || c.has_submitted
  );

  const statsDisplay = [
    { 
      title: 'Contests Completed', 
      value: stats.contestsTaken.toString(), 
      icon: Trophy, 
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
      borderColor: 'border-amber-200',
      description: 'Total completed',
      change: '+2 this week'
    },
    { 
      title: 'Average Score', 
      value: stats.averageScore, 
      icon: Target, 
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      description: 'Overall performance',
      change: '+5.2% improvement'
    },
    { 
      title: 'Active Courses', 
      value: stats.activeCourses.toString(), 
      icon: BookOpen, 
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      description: 'Enrolled courses',
      change: 'Up to date'
    },
    { 
      title: 'Available Now', 
      value: activeContests.length.toString(), 
      icon: Zap, 
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200',
      description: 'Ready to take',
      change: activeContests.length > 0 ? 'Action needed!' : 'All caught up'
    },
  ];

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-500 text-lg">Loading your dashboard...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6 pb-8">
        {/* Enhanced Personalized Welcome Section */}
        <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-indigo-700 to-purple-800 rounded-3xl">
          <div className="absolute inset-0 bg-black/10"></div>
          
          {/* Decorative Background Elements */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -translate-y-48 translate-x-48"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full translate-y-32 -translate-x-32"></div>
          <div className="absolute top-1/2 right-1/4 w-32 h-32 bg-white/10 rounded-full"></div>
          
          <div className="relative z-10 p-6 md:p-8 lg:p-10">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between space-y-6 lg:space-y-0">
              <div className="flex-1 space-y-4">
                {/* Greeting and Name */}
                <div className="space-y-2">
                  <p className="text-blue-100 text-lg font-medium">
                    {getGreeting()}, welcome back! 👋
                  </p>
                  <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white leading-tight">
                    {getDisplayName()}
                  </h1>
                </div>

                {/* Personal Info Cards */}
                <div className="flex flex-wrap gap-3">
                  <div className="flex items-center space-x-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 border border-white/30">
                    <Mail className="h-4 w-4 text-blue-100" />
                    <span className="text-blue-100 text-sm font-medium">{user?.email}</span>
                  </div>
                  <div className="flex items-center space-x-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 border border-white/30">
                    <GraduationCap className="h-4 w-4 text-blue-100" />
                    <span className="text-blue-100 text-sm font-medium">Student</span>
                  </div>
                  <div className="flex items-center space-x-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 border border-white/30">
                    <Calendar className="h-4 w-4 text-blue-100" />
                    <span className="text-blue-100 text-sm font-medium">
                      {new Date().toLocaleDateString('en-US', { 
                        weekday: 'long', 
                        month: 'short', 
                        day: 'numeric' 
                      })}
                    </span>
                  </div>
                </div>

                {/* Motivational Message */}
                <p className="text-blue-100 text-lg max-w-2xl leading-relaxed">
                  Ready to challenge yourself and expand your knowledge? Let's make today count! 🚀
                </p>

                {/* Quick Action Buttons */}
                <div className="flex flex-wrap gap-3 pt-2">
                  {activeContests.length > 0 && (
                    <Button 
                      onClick={() => navigate(`/student/contest/${activeContests[0].id}`)}
                      className="bg-white text-blue-700 hover:bg-blue-50 font-semibold px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                    >
                      <Play className="h-4 w-4 mr-2" />
                      Take Active Contest
                    </Button>
                  )}
                  <Button 
                    variant="ghost"
                    onClick={() => navigate('/student/results')}
                    className="text-white border-white/30 hover:bg-white/10 font-medium px-6 py-3 rounded-xl transition-all duration-300"
                  >
                    <TrendingUp className="h-4 w-4 mr-2" />
                    View Results
                  </Button>
                </div>
              </div>

              {/* Avatar/Icon Section */}
              <div className="hidden lg:flex flex-col items-center space-y-4">
                <div className="w-32 h-32 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center border-4 border-white/30 shadow-xl">
                  <User className="h-16 w-16 text-white" />
                </div>
                <div className="text-center">
                  <p className="text-blue-100 text-sm font-medium">Your Progress</p>
                  <div className="flex items-center space-x-2 mt-2">
                    <Star className="h-5 w-5 text-yellow-300" />
                    <span className="text-white font-bold">{stats.averageScore}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Stats Grid - Now More Responsive */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {statsDisplay.map((stat, index) => (
            <Card key={index} className={`hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-2 ${stat.borderColor} ${stat.bgColor}/50 backdrop-blur-sm`}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className={`p-3 rounded-xl ${stat.bgColor} ring-2 ring-white shadow-md`}>
                        <stat.icon className={`h-6 w-6 ${stat.color}`} />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600 mb-1">
                          {stat.title}
                        </p>
                        <p className="text-2xl md:text-3xl font-bold text-gray-900">
                          {stat.value}
                        </p>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-gray-500">
                        {stat.description}
                      </p>
                      <p className={`text-xs font-medium ${
                        stat.change.includes('+') ? 'text-green-600' : 
                        stat.change.includes('needed') ? 'text-red-600' : 'text-gray-600'
                      }`}>
                        {stat.change}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Active Contests - High Priority Alert Style */}
        {activeContests.length > 0 && (
          <Card className="border-2 border-green-300 bg-gradient-to-r from-green-50 via-emerald-50 to-green-50 shadow-xl">
            <CardHeader className="pb-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-3 sm:space-y-0">
                <div className="flex items-center space-x-3">
                  <div className="p-3 bg-green-500 rounded-xl shadow-lg">
                    <Zap className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-xl font-bold text-green-900 flex items-center">
                      🔥 Active Contests
                      <Badge className="ml-3 bg-green-600 text-white animate-pulse">
                        {activeContests.length} Available
                      </Badge>
                    </CardTitle>
                    <CardDescription className="text-green-700 font-medium">
                      Time-sensitive! Take these contests before they close.
                    </CardDescription>
                  </div>
                </div>
                <Button 
                  onClick={() => navigate(`/student/contest/${activeContests[0].id}`)}
                  className="bg-green-600 hover:bg-green-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  <Play className="h-4 w-4 mr-2" />
                  Start Now
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4">
                {activeContests.map((contest) => (
                  <div key={contest.id} className="bg-white p-6 rounded-2xl border-2 border-green-200 hover:shadow-lg transition-all duration-300 hover:border-green-300">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between space-y-4 lg:space-y-0">
                      <div className="flex-1 space-y-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-bold text-xl text-gray-900">{contest.name}</h3>
                          <StatusBadge status={getContestStatus(contest.start_time, contest.end_time)} />
                          <Badge variant="destructive" className="animate-pulse">
                            <Timer className="h-3 w-3 mr-1" />
                            {getTimeRemaining(contest.end_time)} left
                          </Badge>
                        </div>
                        <p className="text-gray-600 leading-relaxed">{contest.description || 'Test your knowledge and skills in this time-sensitive contest'}</p>
                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                          <span className="flex items-center">
                            <BookOpen className="h-4 w-4 mr-1" />
                            {contest.course_name}
                          </span>
                          <span className="flex items-center">
                            <Clock className="h-4 w-4 mr-1" />
                            Ends: {formatDateTime(contest.end_time)}
                          </span>
                        </div>
                      </div>
                      <div className="flex space-x-3">
                        <Button 
                          onClick={() => navigate(`/student/contest/${contest.id}`)}
                          className="bg-green-600 hover:bg-green-700 text-white px-6 shadow-lg hover:shadow-xl transition-all duration-300"
                        >
                          <Play className="h-4 w-4 mr-2" />
                          Start Contest
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Upcoming Contests - Enhanced Design */}
        {upcomingContests.length > 0 && (
          <Card className="shadow-lg border-0 bg-gradient-to-r from-blue-50 to-indigo-50">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-3 bg-blue-500 rounded-xl shadow-lg">
                    <Clock className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-xl font-bold text-blue-900">📅 Upcoming Contests</CardTitle>
                    <CardDescription className="text-blue-700">
                      {upcomingContests.length} contest{upcomingContests.length > 1 ? 's' : ''} scheduled ahead
                    </CardDescription>
                  </div>
                </div>
                <Badge variant="outline" className="border-blue-300 text-blue-700">
                  {upcomingContests.length} Scheduled
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4">
                {upcomingContests.slice(0, 3).map((contest) => (
                  <div key={contest.id} className="bg-white p-6 rounded-2xl border border-blue-200 hover:shadow-md transition-all duration-300 hover:border-blue-300">
                    <div className="space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between space-y-3 sm:space-y-0">
                        <div className="flex-1 space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-bold text-lg text-gray-900">{contest.name}</h3>
                            <StatusBadge status={getContestStatus(contest.start_time, contest.end_time)} />
                          </div>
                          <p className="text-gray-600">{contest.description || 'Prepare yourself for this upcoming challenge'}</p>
                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <span className="flex items-center">
                              <BookOpen className="h-4 w-4 mr-1" />
                              {contest.course_name}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-blue-50 rounded-xl border border-blue-100">
                        <div>
                          <span className="text-sm text-blue-600 font-medium block mb-1">Start Time</span>
                          <p className="font-semibold text-gray-900">{formatDateTime(contest.start_time)}</p>
                        </div>
                        <div>
                          <span className="text-sm text-blue-600 font-medium block mb-1">End Time</span>
                          <p className="font-semibold text-gray-900">{formatDateTime(contest.end_time)}</p>
                        </div>
                      </div>
                      
                      <div className="flex justify-end">
                        <Button variant="outline" disabled className="cursor-not-allowed opacity-70">
                          <Clock className="h-4 w-4 mr-2" />
                          Coming Soon
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {upcomingContests.length > 3 && (
                <div className="text-center pt-4">
                  <Button variant="ghost" className="text-blue-600 hover:text-blue-700 hover:bg-blue-100">
                    View {upcomingContests.length - 3} more upcoming contests
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Completed Contests - Enhanced Design */}
        {completedContests.length > 0 && (
          <Card className="shadow-lg border-0 bg-gradient-to-r from-purple-50 to-pink-50">
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-3 sm:space-y-0">
                <div className="flex items-center space-x-3">
                  <div className="p-3 bg-purple-500 rounded-xl shadow-lg">
                    <CheckCircle className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-xl font-bold text-purple-900">✅ Completed Contests</CardTitle>
                    <CardDescription className="text-purple-700">
                      Review your performance and celebrate achievements
                    </CardDescription>
                  </div>
                </div>
                <Button 
                  variant="outline"
                  onClick={() => navigate('/student/results')}
                  className="hover:bg-purple-50 hover:border-purple-300 border-purple-200"
                >
                  <TrendingUp className="h-4 w-4 mr-2" />
                  View All Results
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4">
                {completedContests.slice(0, 3).map((contest) => {
                  const contestStatus = getContestStatus(contest.start_time, contest.end_time);
                  const isSubmitted = contest.has_submitted;
                  
                  return (
                    <div key={contest.id} className="bg-white p-6 rounded-2xl border border-purple-200 hover:shadow-md transition-all duration-300 hover:border-purple-300">
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between space-y-4 lg:space-y-0">
                        <div className="flex-1 space-y-3">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-bold text-lg text-gray-900">{contest.name}</h3>
                            {isSubmitted ? (
                              <Badge className="bg-green-100 text-green-800 border-green-200">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Submitted
                              </Badge>
                            ) : (
                              <StatusBadge status={contestStatus} />
                            )}
                          </div>
                          <p className="text-gray-600">{contest.description || 'Contest completed successfully'}</p>
                          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                            <span className="flex items-center">
                              <BookOpen className="h-4 w-4 mr-1" />
                              {contest.course_name}
                            </span>
                            <span className="flex items-center">
                              <Calendar className="h-4 w-4 mr-1" />
                              {isSubmitted ? 'Submitted' : `Ended: ${formatDateTime(contest.end_time)}`}
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {isSubmitted && (
                            <Button 
                              variant="outline"
                              onClick={() => navigate(`/student/contest/${contest.id}`)}
                              className="hover:bg-green-50 hover:border-green-300"
                            >
                              <Activity className="h-4 w-4 mr-2" />
                              Preview Answers
                            </Button>
                          )}
                          <Button 
                            variant="outline"
                            onClick={() => navigate('/student/results')}
                            className="hover:bg-purple-50 hover:border-purple-300"
                          >
                            <TrendingUp className="h-4 w-4 mr-2" />
                            View Results
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              
              {completedContests.length > 3 && (
                <div className="text-center pt-4">
                  <Button 
                    variant="ghost" 
                    onClick={() => navigate('/student/results')}
                    className="text-purple-600 hover:text-purple-700 hover:bg-purple-100"
                  >
                    View {completedContests.length - 3} more completed contests
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Enhanced No Contests Message */}
        {contests.length === 0 && (
          <Card className="shadow-lg border-0 bg-gradient-to-r from-gray-50 to-blue-50">
            <CardContent className="text-center py-16 px-8">
              <div className="space-y-6">
                <div className="w-32 h-32 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto shadow-lg">
                  <Trophy className="h-16 w-16 text-blue-500" />
                </div>
                <div className="space-y-4">
                  <h3 className="text-2xl font-bold text-gray-800">No Contests Available Yet</h3>
                  <p className="text-gray-600 max-w-md mx-auto leading-relaxed">
                    There are no contests available at the moment. Check back later or contact your instructor for more information.
                  </p>
                </div>
                <div className="flex justify-center space-x-4">
                  <Button 
                    onClick={() => window.location.reload()} 
                    variant="outline"
                    className="hover:bg-blue-50 hover:border-blue-300"
                  >
                    <Clock className="h-4 w-4 mr-2" />
                    Refresh Page
                  </Button>
                  <Button 
                    onClick={() => navigate('/student/results')}
                    variant="outline"
                    className="hover:bg-purple-50 hover:border-purple-300"
                  >
                    <TrendingUp className="h-4 w-4 mr-2" />
                    View Past Results
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
};

export default StudentDashboard;

