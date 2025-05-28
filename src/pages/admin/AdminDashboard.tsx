
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookOpen, Users, Trophy, FileText, Plus, BarChart3 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/common/Layout';

const AdminDashboard = () => {
  const navigate = useNavigate();

  const stats = [
    { title: 'Total Courses', value: '12', icon: BookOpen, color: 'text-blue-600' },
    { title: 'Active Students', value: '248', icon: Users, color: 'text-green-600' },
    { title: 'Total Contests', value: '35', icon: Trophy, color: 'text-purple-600' },
    { title: 'MCQ Questions', value: '156', icon: FileText, color: 'text-orange-600' },
  ];

  const quickActions = [
    { title: 'Create MCQ', description: 'Add new questions to the question bank', action: () => navigate('/admin/mcq/create'), color: 'bg-blue-600 hover:bg-blue-700' },
    { title: 'New Contest', description: 'Set up a new quiz contest', action: () => navigate('/admin/contests/create'), color: 'bg-green-600 hover:bg-green-700' },
    { title: 'Add Course', description: 'Create a new course', action: () => navigate('/admin/courses/create'), color: 'bg-purple-600 hover:bg-purple-700' },
    { title: 'View Results', description: 'Check contest results and analytics', action: () => navigate('/admin/results'), color: 'bg-orange-600 hover:bg-orange-700' },
  ];

  const recentActivity = [
    { action: 'New submission', details: 'John Doe completed "JavaScript Basics Quiz"', time: '2 minutes ago' },
    { action: 'Contest created', details: 'React Components Quiz scheduled for tomorrow', time: '1 hour ago' },
    { action: 'Student enrolled', details: 'Sarah Smith joined Web Development course', time: '3 hours ago' },
    { action: 'MCQ added', details: '5 new questions added to CSS category', time: '5 hours ago' },
  ];

  return (
    <Layout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600">Manage courses, contests, and track student performance</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Plus className="h-5 w-5" />
              <span>Quick Actions</span>
            </CardTitle>
            <CardDescription>
              Frequently used actions for course management
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {quickActions.map((action, index) => (
                <Button
                  key={index}
                  onClick={action.action}
                  className={`h-auto p-4 flex flex-col items-start space-y-2 ${action.color} text-white`}
                >
                  <div className="font-semibold">{action.title}</div>
                  <div className="text-xs opacity-90 text-left">{action.description}</div>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity & Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest updates from your courses</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {recentActivity.map((activity, index) => (
                <div key={index} className="flex justify-between items-start">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">{activity.action}</p>
                    <p className="text-xs text-gray-600">{activity.details}</p>
                  </div>
                  <span className="text-xs text-gray-400">{activity.time}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BarChart3 className="h-5 w-5" />
                <span>Analytics Overview</span>
              </CardTitle>
              <CardDescription>Performance insights at a glance</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Contest Participation</span>
                  <span className="font-medium">87%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-blue-600 h-2 rounded-full" style={{ width: '87%' }}></div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Average Score</span>
                  <span className="font-medium">78%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-green-600 h-2 rounded-full" style={{ width: '78%' }}></div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Course Completion</span>
                  <span className="font-medium">64%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-purple-600 h-2 rounded-full" style={{ width: '64%' }}></div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default AdminDashboard;
