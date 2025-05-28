import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trophy, Clock, CheckCircle, Play, Calendar, Award } from 'lucide-react';
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
      
      // Load course names for each contest
      const contestsWithCourseNames = await Promise.all(
        contestsData.map(async (contest) => {
          try {
            const course = await apiService.getCourse(contest.course_id) as { id: string; name: string };
            return {
              ...contest,
              course_name: course.name || 'Unknown Course'
            };
          } catch (error) {
            return {
              ...contest,
              course_name: 'Unknown Course'
            };
          }
        })
      );
      
      setContests(contestsWithCourseNames);
      
      // Calculate stats (simplified for now)
      const completedContests = contestsWithCourseNames.filter(c => 
        getContestStatus(c.start_time, c.end_time) === 'ended'
      );
      
      setStats({
        contestsTaken: completedContests.length,
        averageScore: '85%', // TODO: Calculate from actual results
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
    const start = new Date(startTime);
    const end = new Date(endTime);
    
    if (now < start) return "not_started";
    if (now >= start && now <= end) return "in_progress";
    return "ended";
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const activeContests = contests.filter(c => getContestStatus(c.start_time, c.end_time) === 'in_progress');
  const upcomingContests = contests.filter(c => getContestStatus(c.start_time, c.end_time) === 'not_started');
  const completedContests = contests.filter(c => getContestStatus(c.start_time, c.end_time) === 'ended');

  const statsDisplay = [
    { title: 'Contests Taken', value: stats.contestsTaken.toString(), icon: Trophy, color: 'text-blue-600' },
    { title: 'Average Score', value: stats.averageScore, icon: Award, color: 'text-green-600' },
    { title: 'Active Courses', value: stats.activeCourses.toString(), icon: Calendar, color: 'text-purple-600' },
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
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 text-white">
          <h1 className="text-3xl font-bold">Welcome back, {user?.email?.split('@')[0] || 'Student'}!</h1>
          <p className="text-blue-100 mt-2">Ready to challenge yourself with some quizzes?</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {statsDisplay.map((stat, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  {stat.title}
                </CardTitle>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Active Contests */}
        {activeContests.length > 0 && (
          <Card className="border-green-200 bg-green-50">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-green-800">
                <Play className="h-5 w-5" />
                <span>Active Contests</span>
              </CardTitle>
              <CardDescription className="text-green-700">
                Take these contests now!
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {activeContests.map((contest) => (
                <div key={contest.id} className="bg-white p-4 rounded-lg border border-green-200">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-semibold text-lg">{contest.name}</h3>
                      <p className="text-gray-600 text-sm">{contest.description || 'No description available'}</p>
                      <p className="text-xs text-gray-500 mt-1">{contest.course_name}</p>
                    </div>
                    <StatusBadge status={getContestStatus(contest.start_time, contest.end_time)} />
                  </div>
                  <div className="flex justify-between items-center mt-4">
                    <div className="text-sm text-gray-600">
                      <span>Ends: {formatDateTime(contest.end_time)}</span>
                    </div>
                    <Button 
                      onClick={() => navigate(`/student/contest/${contest.id}`)}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      Take Contest
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Upcoming Contests */}
        {upcomingContests.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Clock className="h-5 w-5" />
                <span>Upcoming Contests</span>
              </CardTitle>
              <CardDescription>
                Scheduled contests you can participate in
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {upcomingContests.map((contest) => (
                <div key={contest.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-semibold text-lg">{contest.name}</h3>
                      <p className="text-gray-600 text-sm">{contest.description || 'No description available'}</p>
                      <p className="text-xs text-gray-500 mt-1">{contest.course_name}</p>
                    </div>
                    <StatusBadge status={getContestStatus(contest.start_time, contest.end_time)} />
                  </div>
                  <div className="grid grid-cols-2 gap-4 mt-4 text-sm">
                    <div>
                      <span className="text-gray-500">Start Time:</span>
                      <p className="font-medium">{formatDateTime(contest.start_time)}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">End Time:</span>
                      <p className="font-medium">{formatDateTime(contest.end_time)}</p>
                    </div>
                  </div>
                  <div className="flex justify-end mt-4">
                    <Button variant="outline" disabled>
                      Not Started
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Completed Contests */}
        {completedContests.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5" />
                <span>Completed Contests</span>
              </CardTitle>
              <CardDescription>
                View your results and performance
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {completedContests.map((contest) => (
                <div key={contest.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-semibold text-lg">{contest.name}</h3>
                      <p className="text-gray-600 text-sm">{contest.description || 'No description available'}</p>
                      <p className="text-xs text-gray-500 mt-1">{contest.course_name}</p>
                    </div>
                    <StatusBadge status={getContestStatus(contest.start_time, contest.end_time)} />
                  </div>
                  <div className="flex justify-between items-center mt-4">
                    <div className="text-sm text-gray-600">
                      <span>Completed: {formatDateTime(contest.end_time)}</span>
                    </div>
                    <Button 
                      variant="outline"
                      onClick={() => navigate('/student/results')}
                    >
                      View Results
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* No Contests Message */}
        {contests.length === 0 && (
          <Card>
            <CardContent className="text-center py-8">
              <Trophy className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">No Contests Available</h3>
              <p className="text-gray-500">
                There are no contests available at the moment. Check back later!
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
};

export default StudentDashboard;

