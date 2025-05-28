import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Trophy, Clock, CheckCircle, Play, Calendar, Award, BookOpen, Target, TrendingUp, Users, Star, Timer } from 'lucide-react';
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
  const { user } = useAuth();
  const [contests, setContests] = useState<Contest[]>([]);
  const [stats, setStats] = useState<StudentStats>({
    contestsTaken: 0,
    averageScore: '0%',
    activeCourses: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStudentData();
  }, []);

  const loadStudentData = async () => {
    try {
      setLoading(true);
      
      // Load contests
      const contestsData = await apiService.getContests() as Contest[];
      
      // Load course names and submission status for each contest
      const contestsWithCourseNames = await Promise.all(
        contestsData.map(async (contest) => {
          try {
            const course = await apiService.getCourse(contest.course_id) as { id: string; name: string };
            
            // Check if student has submitted this contest
            let hasSubmitted = false;
            try {
              await apiService.getMySubmission(contest.id);
              hasSubmitted = true;
            } catch (error) {
              // No submission found
            }
            
            return {
              ...contest,
              course_name: course.name || 'Unknown Course',
              has_submitted: hasSubmitted
            };
          } catch (error) {
            return {
              ...contest,
              course_name: 'Unknown Course',
              has_submitted: false
            };
          }
        })
      );
      
      setContests(contestsWithCourseNames);
      
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
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive"
      });
      console.error('Error loading student data:', error);
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
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      description: 'Total contests finished'
    },
    { 
      title: 'Average Score', 
      value: stats.averageScore, 
      icon: Target, 
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      description: 'Your performance average'
    },
    { 
      title: 'Active Courses', 
      value: stats.activeCourses.toString(), 
      icon: BookOpen, 
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      description: 'Enrolled courses'
    },
    { 
      title: 'Active Contests', 
      value: activeContests.length.toString(), 
      icon: Timer, 
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      description: 'Available to take now'
    },
  ];

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-8">
        {/* Enhanced Welcome Section */}
        <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 rounded-2xl p-8 text-white">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold mb-2">
                  Welcome back, {user?.email?.split('@')[0] || 'Student'}! 👋
                </h1>
                <p className="text-blue-100 text-lg mb-4">
                  Ready to challenge yourself and expand your knowledge?
                </p>
                <div className="flex items-center space-x-4">
                  <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                    <Users className="h-3 w-3 mr-1" />
                    Student
                  </Badge>
                  <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                    <Calendar className="h-3 w-3 mr-1" />
                    {new Date().toLocaleDateString()}
                  </Badge>
                </div>
              </div>
              <div className="hidden md:block">
                <div className="w-32 h-32 bg-white/10 rounded-full flex items-center justify-center">
                  <Star className="h-16 w-16 text-yellow-300" />
                </div>
              </div>
            </div>
          </div>
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-32 translate-x-32"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-24 -translate-x-24"></div>
        </div>

        {/* Enhanced Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statsDisplay.map((stat, index) => (
            <Card key={index} className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-0 shadow-md">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">
                      {stat.title}
                    </p>
                    <p className="text-3xl font-bold text-gray-900 mb-1">
                      {stat.value}
                    </p>
                    <p className="text-xs text-gray-500">
                      {stat.description}
                    </p>
                  </div>
                  <div className={`p-3 rounded-xl ${stat.bgColor}`}>
                    <stat.icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Active Contests - Priority Section */}
        {activeContests.length > 0 && (
          <Card className="border-2 border-green-200 bg-gradient-to-r from-green-50 to-emerald-50 shadow-lg">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Play className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <CardTitle className="text-xl text-green-800">🔥 Active Contests</CardTitle>
                    <CardDescription className="text-green-700">
                      {activeContests.length} contest{activeContests.length > 1 ? 's' : ''} available now!
                    </CardDescription>
                  </div>
                </div>
                <Badge className="bg-green-600 hover:bg-green-700 text-white">
                  Take Now
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {activeContests.map((contest) => (
                <div key={contest.id} className="bg-white p-6 rounded-xl border border-green-200 hover:shadow-md transition-all duration-300">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="font-bold text-lg text-gray-900">{contest.name}</h3>
                        <StatusBadge status={getContestStatus(contest.start_time, contest.end_time)} />
                      </div>
                      <p className="text-gray-600 mb-2">{contest.description || 'Test your knowledge and skills'}</p>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span className="flex items-center">
                          <BookOpen className="h-4 w-4 mr-1" />
                          {contest.course_name}
                        </span>
                        <span className="flex items-center">
                          <Timer className="h-4 w-4 mr-1" />
                          Ends in {getTimeRemaining(contest.end_time)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">Deadline: </span>
                      {formatDateTime(contest.end_time)}
                    </div>
                    <Button 
                      onClick={() => navigate(`/student/contest/${contest.id}`)}
                      className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                    >
                      <Play className="h-4 w-4 mr-2" />
                      Start Contest
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Upcoming Contests */}
        {upcomingContests.length > 0 && (
          <Card className="shadow-md border-0">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Clock className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <CardTitle className="text-xl">📅 Upcoming Contests</CardTitle>
                  <CardDescription>
                    Get ready for these scheduled contests
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {upcomingContests.map((contest) => (
                <div key={contest.id} className="border rounded-xl p-6 hover:shadow-md transition-all duration-300 hover:border-blue-300">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="font-bold text-lg text-gray-900">{contest.name}</h3>
                        <StatusBadge status={getContestStatus(contest.start_time, contest.end_time)} />
                      </div>
                      <p className="text-gray-600 mb-3">{contest.description || 'Prepare yourself for this upcoming challenge'}</p>
                      <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
                        <span className="flex items-center">
                          <BookOpen className="h-4 w-4 mr-1" />
                          {contest.course_name}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                    <div>
                      <span className="text-sm text-gray-500 block">Start Time</span>
                      <p className="font-medium text-gray-900">{formatDateTime(contest.start_time)}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500 block">End Time</span>
                      <p className="font-medium text-gray-900">{formatDateTime(contest.end_time)}</p>
                    </div>
                  </div>
                  <div className="flex justify-end mt-4">
                    <Button variant="outline" disabled className="cursor-not-allowed">
                      <Clock className="h-4 w-4 mr-2" />
                      Starts Soon
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Completed Contests */}
        {completedContests.length > 0 && (
          <Card className="shadow-md border-0">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <CheckCircle className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">✅ Completed Contests</CardTitle>
                    <CardDescription>
                      Review your performance and results
                    </CardDescription>
                  </div>
                </div>
                <Button 
                  variant="outline"
                  onClick={() => navigate('/student/results')}
                  className="hover:bg-purple-50 hover:border-purple-300"
                >
                  <TrendingUp className="h-4 w-4 mr-2" />
                  View All Results
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {completedContests.slice(0, 3).map((contest) => {
                const contestStatus = getContestStatus(contest.start_time, contest.end_time);
                const isSubmitted = contest.has_submitted;
                
                return (
                  <div key={contest.id} className="border rounded-xl p-6 hover:shadow-md transition-all duration-300 hover:border-purple-300">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
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
                        <p className="text-gray-600 mb-2">{contest.description || 'Contest completed'}</p>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
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
                    </div>
                    <div className="flex justify-end">
                      {isSubmitted ? (
                        <div className="flex space-x-2">
                          <Button 
                            variant="outline"
                            onClick={() => navigate(`/student/contest/${contest.id}`)}
                            className="hover:bg-green-50 hover:border-green-300"
                          >
                            <Award className="h-4 w-4 mr-2" />
                            View Submission
                          </Button>
                          <Button 
                            variant="outline"
                            onClick={() => navigate('/student/results')}
                            className="hover:bg-purple-50 hover:border-purple-300"
                          >
                            <TrendingUp className="h-4 w-4 mr-2" />
                            All Results
                          </Button>
                        </div>
                      ) : (
                        <Button 
                          variant="outline"
                          onClick={() => navigate('/student/results')}
                          className="hover:bg-purple-50 hover:border-purple-300"
                        >
                          <Award className="h-4 w-4 mr-2" />
                          View Results
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
              {completedContests.length > 3 && (
                <div className="text-center pt-4">
                  <Button 
                    variant="ghost" 
                    onClick={() => navigate('/student/results')}
                    className="text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                  >
                    View {completedContests.length - 3} more completed contests →
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* No Contests Message */}
        {contests.length === 0 && (
          <Card className="shadow-md border-0">
            <CardContent className="text-center py-16">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Trophy className="h-12 w-12 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-600 mb-3">No Contests Available</h3>
              <p className="text-gray-500 mb-6 max-w-md mx-auto">
                There are no contests available at the moment. Check back later or contact your instructor for more information.
              </p>
              <Button 
                onClick={() => window.location.reload()} 
                variant="outline"
                className="hover:bg-blue-50 hover:border-blue-300"
              >
                <Clock className="h-4 w-4 mr-2" />
                Refresh Page
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
};

export default StudentDashboard;

