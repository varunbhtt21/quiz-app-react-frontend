import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookOpen, Users, Trophy, FileText, Plus, BarChart3, ArrowRight, CheckCircle, Circle, Info, Lightbulb, HelpCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/common/Layout';
import OnboardingModal from '../../components/common/OnboardingModal';
import { apiService } from '../../services/api';
import { toast } from '@/hooks/use-toast';

interface DashboardStats {
  totalCourses: number;
  totalStudents: number;
  totalContests: number;
  totalMCQs: number;
}

interface WorkflowStep {
  id: number;
  title: string;
  description: string;
  action: string;
  route: string;
  completed: boolean;
  icon: React.ElementType;
}

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>({
    totalCourses: 0,
    totalStudents: 0,
    totalContests: 0,
    totalMCQs: 0
  });
  const [loading, setLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    loadDashboardData();
    checkFirstTimeUser();
  }, []);

  const checkFirstTimeUser = () => {
    const hasSeenOnboarding = localStorage.getItem('quiz-system-onboarding-completed');
    if (!hasSeenOnboarding) {
      setShowOnboarding(true);
    }
  };

  const handleOnboardingComplete = () => {
    localStorage.setItem('quiz-system-onboarding-completed', 'true');
    setShowOnboarding(false);
  };

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Load all data in parallel
      const [coursesData, mcqsData, contestsData] = await Promise.all([
        apiService.getCourses(0, 1000),
        apiService.getMCQs(0, 1000),
        apiService.getContests()
      ]);

      // Calculate total students from all courses
      let totalStudents = 0;
      if (Array.isArray(coursesData)) {
        for (const course of coursesData) {
          try {
            const students = await apiService.getCourseStudents(course.id);
            totalStudents += Array.isArray(students) ? students.length : 0;
          } catch (error) {
            // Skip if course students can't be loaded
          }
        }
      }

      setStats({
        totalCourses: Array.isArray(coursesData) ? coursesData.length : 0,
        totalStudents,
        totalContests: Array.isArray(contestsData) ? contestsData.length : 0,
        totalMCQs: Array.isArray(mcqsData) ? mcqsData.length : 0
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive"
      });
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const workflowSteps: WorkflowStep[] = [
    {
      id: 1,
      title: "Create Your First Course",
      description: "Set up a course to organize students and content",
      action: "Create Course",
      route: "/admin/courses/create",
      completed: stats.totalCourses > 0,
      icon: BookOpen
    },
    {
      id: 2,
      title: "Add Questions to Question Bank",
      description: "Build your MCQ question library for assessments",
      action: "Add Questions",
      route: "/admin/mcq/create",
      completed: stats.totalMCQs > 0,
      icon: FileText
    },
    {
      id: 3,
      title: "Enroll Students in Courses",
      description: "Add students to your courses so they can participate",
      action: "Manage Students",
      route: "/admin/courses",
      completed: stats.totalStudents > 0,
      icon: Users
    },
    {
      id: 4,
      title: "Create Your First Contest",
      description: "Schedule a quiz contest for your students",
      action: "Create Contest",
      route: "/admin/contests/create",
      completed: stats.totalContests > 0,
      icon: Trophy
    }
  ];

  const quickActions = [
    { title: 'Create Course', description: 'Add a new course', action: () => navigate('/admin/courses/create'), color: 'bg-blue-600 hover:bg-blue-700', icon: BookOpen },
    { title: 'Add Questions', description: 'Build your question bank', action: () => navigate('/admin/mcq/create'), color: 'bg-green-600 hover:bg-green-700', icon: FileText },
    { title: 'Create Contest', description: 'Schedule a new quiz', action: () => navigate('/admin/contests/create'), color: 'bg-purple-600 hover:bg-purple-700', icon: Trophy },
    { title: 'View Results', description: 'Check performance analytics', action: () => navigate('/admin/results'), color: 'bg-orange-600 hover:bg-orange-700', icon: BarChart3 },
  ];

  const completedSteps = workflowSteps.filter(step => step.completed).length;
  const progressPercentage = (completedSteps / workflowSteps.length) * 100;
  const isNewUser = completedSteps === 0;

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
        {/* Welcome Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Welcome to Quiz System</h1>
              <p className="text-blue-100 text-lg">
                Create courses, build question banks, and conduct online assessments with ease
              </p>
            </div>
            {isNewUser && (
              <Button 
                onClick={() => setShowOnboarding(true)}
                variant="secondary"
                className="bg-white text-blue-600 hover:bg-blue-50"
              >
                <HelpCircle className="h-4 w-4 mr-2" />
                Take Platform Tour
              </Button>
            )}
          </div>
        </div>

        {/* Platform Overview - Show only for new users */}
        {isNewUser && (
          <Card className="border-l-4 border-l-blue-500">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Info className="h-5 w-5 text-blue-600" />
                <span>What is Quiz System?</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-2">For Educators & Administrators</h4>
                  <ul className="space-y-1 text-sm text-gray-600">
                    <li>• Create and manage courses</li>
                    <li>• Build comprehensive question banks</li>
                    <li>• Schedule timed quiz contests</li>
                    <li>• Track student performance</li>
                    <li>• Export detailed analytics</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">For Students</h4>
                  <ul className="space-y-1 text-sm text-gray-600">
                    <li>• Join courses and contests</li>
                    <li>• Take timed assessments</li>
                    <li>• View instant results</li>
                    <li>• Track progress over time</li>
                    <li>• Access performance analytics</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Setup Progress */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Lightbulb className="h-5 w-5 text-yellow-600" />
              <span>Getting Started - Setup Progress</span>
            </CardTitle>
            <CardDescription>
              Complete these steps to set up your quiz platform ({completedSteps}/{workflowSteps.length} completed)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-6">
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Setup Progress</span>
                <span>{Math.round(progressPercentage)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-blue-600 to-purple-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progressPercentage}%` }}
                ></div>
              </div>
            </div>

            <div className="space-y-4">
              {workflowSteps.map((step, index) => {
                const Icon = step.icon;
                const StatusIcon = step.completed ? CheckCircle : Circle;
                
                return (
                  <div key={step.id} className={`flex items-center space-x-4 p-4 rounded-lg border ${
                    step.completed ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
                  }`}>
                    <div className="flex-shrink-0">
                      <StatusIcon className={`h-6 w-6 ${
                        step.completed ? 'text-green-600' : 'text-gray-400'
                      }`} />
                    </div>
                    <Icon className={`h-5 w-5 ${
                      step.completed ? 'text-green-600' : 'text-gray-500'
                    }`} />
                    <div className="flex-1">
                      <h4 className={`font-medium ${
                        step.completed ? 'text-green-900' : 'text-gray-900'
                      }`}>
                        Step {step.id}: {step.title}
                      </h4>
                      <p className={`text-sm ${
                        step.completed ? 'text-green-700' : 'text-gray-600'
                      }`}>
                        {step.description}
                      </p>
                    </div>
                    {!step.completed && (
                      <Button 
                        onClick={() => navigate(step.route)}
                        size="sm"
                        className="flex items-center space-x-1"
                      >
                        <span>{step.action}</span>
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    )}
                    {step.completed && (
                      <span className="text-sm text-green-600 font-medium">Completed ✓</span>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Plus className="h-5 w-5" />
              <span>Quick Actions</span>
            </CardTitle>
            <CardDescription>
              Common tasks to manage your quiz platform
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {quickActions.map((action, index) => {
                const Icon = action.icon;
                return (
                  <Button
                    key={index}
                    onClick={action.action}
                    className={`h-auto p-6 flex flex-col items-center space-y-3 ${action.color} text-white`}
                  >
                    <Icon className="h-8 w-8" />
                    <div className="text-center">
                      <div className="font-semibold">{action.title}</div>
                      <div className="text-xs opacity-90 mt-1">{action.description}</div>
                    </div>
                  </Button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Current Statistics */}
        <Card>
          <CardHeader>
            <CardTitle>Platform Statistics</CardTitle>
            <CardDescription>Overview of your current platform data</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">{stats.totalCourses}</div>
                <div className="text-sm text-gray-600">Courses Created</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">{stats.totalMCQs}</div>
                <div className="text-sm text-gray-600">Questions Added</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600">{stats.totalContests}</div>
                <div className="text-sm text-gray-600">Contests Created</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-orange-600">{stats.totalStudents}</div>
                <div className="text-sm text-gray-600">Students Enrolled</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Help Section */}
        {completedSteps === workflowSteps.length && (
          <Card className="border-l-4 border-l-green-500">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-green-700">
                <CheckCircle className="h-5 w-5" />
                <span>Setup Complete! 🎉</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Great job! You've completed the initial setup. Your quiz platform is ready to use.
              </p>
              <div className="space-y-2 text-sm">
                <p><strong>Next steps:</strong></p>
                <ul className="list-disc list-inside space-y-1 text-gray-600">
                  <li>Add more questions to expand your question bank</li>
                  <li>Enroll more students in your courses</li>
                  <li>Create additional contests for different topics</li>
                  <li>Monitor student performance through the Results section</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Onboarding Modal */}
      <OnboardingModal 
        isOpen={showOnboarding}
        onClose={() => setShowOnboarding(false)}
        onComplete={handleOnboardingComplete}
      />
    </Layout>
  );
};

export default AdminDashboard;
