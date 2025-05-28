
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trophy, Clock, CheckCircle, Play, Calendar, Award } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/common/Layout';
import StatusBadge from '../../components/common/StatusBadge';
import { useAuth } from '../../context/AuthContext';

const StudentDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const contests = [
    {
      id: '1',
      name: 'JavaScript Fundamentals',
      description: 'Basic concepts of JavaScript programming',
      status: 'in_progress' as const,
      startTime: '2024-01-15T10:00:00Z',
      endTime: '2024-01-15T12:00:00Z',
      totalQuestions: 20,
      totalMarks: 100,
      course: 'Web Development'
    },
    {
      id: '2',
      name: 'React Components Quiz',
      description: 'Understanding React components and props',
      status: 'not_started' as const,
      startTime: '2024-01-16T14:00:00Z',
      endTime: '2024-01-16T15:30:00Z',
      totalQuestions: 15,
      totalMarks: 75,
      course: 'React Development'
    },
    {
      id: '3',
      name: 'HTML & CSS Basics',
      description: 'Fundamental web technologies assessment',
      status: 'ended' as const,
      startTime: '2024-01-10T09:00:00Z',
      endTime: '2024-01-10T10:30:00Z',
      totalQuestions: 25,
      totalMarks: 125,
      course: 'Web Development',
      myScore: 98,
      myPercentage: 78.4
    }
  ];

  const stats = [
    { title: 'Contests Taken', value: '12', icon: Trophy, color: 'text-blue-600' },
    { title: 'Average Score', value: '85%', icon: Award, color: 'text-green-600' },
    { title: 'Active Courses', value: '3', icon: Calendar, color: 'text-purple-600' },
  ];

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const activeContests = contests.filter(c => c.status === 'in_progress');
  const upcomingContests = contests.filter(c => c.status === 'not_started');
  const completedContests = contests.filter(c => c.status === 'ended');

  return (
    <Layout>
      <div className="space-y-8">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 text-white">
          <h1 className="text-3xl font-bold">Welcome back, {user?.first_name}!</h1>
          <p className="text-blue-100 mt-2">Ready to challenge yourself with some quizzes?</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {stats.map((stat, index) => (
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
                      <p className="text-gray-600 text-sm">{contest.description}</p>
                      <p className="text-xs text-gray-500 mt-1">{contest.course}</p>
                    </div>
                    <StatusBadge status={contest.status} />
                  </div>
                  <div className="flex justify-between items-center mt-4">
                    <div className="text-sm text-gray-600">
                      <span>{contest.totalQuestions} questions</span> • 
                      <span className="ml-1">{contest.totalMarks} marks</span>
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
                      <p className="text-gray-600 text-sm">{contest.description}</p>
                      <p className="text-xs text-gray-500 mt-1">{contest.course}</p>
                    </div>
                    <StatusBadge status={contest.status} />
                  </div>
                  <div className="grid grid-cols-2 gap-4 mt-4 text-sm">
                    <div>
                      <span className="text-gray-500">Start Time:</span>
                      <p className="font-medium">{formatDateTime(contest.startTime)}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">End Time:</span>
                      <p className="font-medium">{formatDateTime(contest.endTime)}</p>
                    </div>
                  </div>
                  <div className="flex justify-between items-center mt-4">
                    <div className="text-sm text-gray-600">
                      <span>{contest.totalQuestions} questions</span> • 
                      <span className="ml-1">{contest.totalMarks} marks</span>
                    </div>
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
                      <p className="text-gray-600 text-sm">{contest.description}</p>
                      <p className="text-xs text-gray-500 mt-1">{contest.course}</p>
                    </div>
                    <StatusBadge status={contest.status} />
                  </div>
                  {contest.myScore !== undefined && (
                    <div className="bg-gray-50 p-3 rounded-lg mt-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Your Score:</span>
                        <span className="font-bold text-lg text-green-600">
                          {contest.myScore}/{contest.totalMarks} ({contest.myPercentage}%)
                        </span>
                      </div>
                    </div>
                  )}
                  <div className="flex justify-between items-center mt-4">
                    <div className="text-sm text-gray-600">
                      <span>{contest.totalQuestions} questions</span> • 
                      <span className="ml-1">{contest.totalMarks} marks</span>
                    </div>
                    <Button 
                      variant="outline"
                      onClick={() => navigate(`/student/results/${contest.id}`)}
                    >
                      View Details
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
};

export default StudentDashboard;
