import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import Layout from '../../components/common/Layout';
import HelpTooltip from '../../components/common/HelpTooltip';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Save, Home, ChevronRight, BookOpen, Info, GraduationCap, Users, Trophy, Target, CheckCircle, Calendar, FileText, Settings } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { apiService } from '../../services/api';

interface CourseFormData {
  name: string;
  description: string;
}

const CreateCourse = () => {
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<CourseFormData>();

  const onSubmit = async (data: CourseFormData) => {
    try {
      await apiService.createCourse(data);
      
      toast({
        title: "Success",
        description: "Course created successfully! You can now add students and create contests for this course."
      });
      
      navigate('/admin/courses');
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create course",
        variant: "destructive"
      });
    }
  };

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/admin/dashboard');
    }
  };

  return (
    <Layout>
      <div className="space-y-8">
        {/* Enhanced Header */}
        <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-700 rounded-2xl p-8 text-white">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <GraduationCap className="h-8 w-8" />
                  <h1 className="text-4xl font-bold">🎓 Create New Course</h1>
                </div>
                <p className="text-indigo-100 text-lg mb-4">
                  Set up a comprehensive course to organize students and educational content
                </p>
                <div className="flex items-center space-x-4">
                  <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                    <Users className="h-3 w-3 mr-1" />
                    Student Organization
                  </Badge>
                  <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                    <Trophy className="h-3 w-3 mr-1" />
                    Contest Management
                  </Badge>
                </div>
              </div>
              <div className="hidden md:block">
                <div className="w-32 h-32 bg-white/10 rounded-full flex items-center justify-center">
                  <GraduationCap className="h-16 w-16 text-indigo-200" />
                </div>
              </div>
            </div>
          </div>
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-32 translate-x-32"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-24 -translate-x-24"></div>
        </div>

        {/* Breadcrumb Navigation */}
        <Card className="shadow-sm border-0 bg-gray-50">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => navigate('/admin/dashboard')}
                className="p-0 h-auto font-normal hover:text-indigo-600"
              >
                <Home className="h-4 w-4 mr-1" />
                Dashboard
              </Button>
              <ChevronRight className="h-4 w-4" />
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => navigate('/admin/courses')}
                className="p-0 h-auto font-normal hover:text-indigo-600"
              >
                Courses
              </Button>
              <ChevronRight className="h-4 w-4" />
              <span className="text-gray-900 font-medium">Create Course</span>
            </div>
          </CardContent>
        </Card>

        {/* Enhanced Help Information */}
        <Card className="shadow-lg border-0 border-l-4 border-l-indigo-500 bg-gradient-to-r from-indigo-50 to-purple-50">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-indigo-900">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <Info className="h-5 w-5 text-indigo-600" />
              </div>
              <span>Course Overview & Benefits</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
              <div className="space-y-3">
                <h4 className="font-semibold text-indigo-900 flex items-center">
                  <Target className="h-4 w-4 mr-2" />
                  Course Purpose
                </h4>
                <ul className="space-y-2 text-indigo-800">
                  <li className="flex items-center">
                    <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full mr-2"></div>
                    Organize students into learning groups
                  </li>
                  <li className="flex items-center">
                    <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full mr-2"></div>
                    Create subject-specific assessments
                  </li>
                  <li className="flex items-center">
                    <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full mr-2"></div>
                    Track course-level performance
                  </li>
                  <li className="flex items-center">
                    <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full mr-2"></div>
                    Manage enrollments efficiently
                  </li>
                </ul>
              </div>
              <div className="space-y-3">
                <h4 className="font-semibold text-indigo-900 flex items-center">
                  <BookOpen className="h-4 w-4 mr-2" />
                  Course Examples
                </h4>
                <ul className="space-y-2 text-indigo-800">
                  <li className="flex items-center">
                    <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full mr-2"></div>
                    "Introduction to Programming"
                  </li>
                  <li className="flex items-center">
                    <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full mr-2"></div>
                    "Advanced Mathematics"
                  </li>
                  <li className="flex items-center">
                    <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full mr-2"></div>
                    "Web Development Bootcamp"
                  </li>
                  <li className="flex items-center">
                    <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full mr-2"></div>
                    "Data Science Fundamentals"
                  </li>
                </ul>
              </div>
              <div className="space-y-3">
                <h4 className="font-semibold text-indigo-900 flex items-center">
                  <Settings className="h-4 w-4 mr-2" />
                  Management Features
                </h4>
                <ul className="space-y-2 text-indigo-800">
                  <li className="flex items-center">
                    <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full mr-2"></div>
                    Student enrollment control
                  </li>
                  <li className="flex items-center">
                    <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full mr-2"></div>
                    Contest scheduling
                  </li>
                  <li className="flex items-center">
                    <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full mr-2"></div>
                    Performance analytics
                  </li>
                  <li className="flex items-center">
                    <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full mr-2"></div>
                    Progress monitoring
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Enhanced Course Details Form */}
        <Card className="shadow-lg border-0">
          <CardHeader className="border-b bg-gray-50">
            <CardTitle className="flex items-center space-x-2 text-xl">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <BookOpen className="h-5 w-5 text-indigo-600" />
              </div>
              <span>Course Information</span>
            </CardTitle>
            <p className="text-gray-600 text-sm mt-1">Define your course details and learning objectives</p>
          </CardHeader>
          <CardContent className="p-8">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
              {/* Course Name Field */}
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Label htmlFor="name" className="text-sm font-semibold text-gray-700">Course Name *</Label>
                  <HelpTooltip content="Choose a clear, descriptive name that students will easily recognize. Examples: 'Python Programming', 'Calculus I', 'Digital Marketing'" />
                </div>
                <div className="relative">
                  <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    id="name"
                    {...register('name', { 
                      required: 'Course name is required',
                      minLength: { value: 3, message: 'Course name must be at least 3 characters' },
                      maxLength: { value: 100, message: 'Course name must be less than 100 characters' }
                    })}
                    placeholder="e.g., Introduction to Programming"
                    className="pl-10 h-12 border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>
                {errors.name && (
                  <p className="text-sm text-red-600 flex items-center">
                    <span className="w-1 h-1 bg-red-600 rounded-full mr-2"></span>
                    {errors.name.message}
                  </p>
                )}
                <p className="text-xs text-gray-500 flex items-center">
                  <Info className="h-3 w-3 mr-1" />
                  This will be displayed to students when they view available courses
                </p>
              </div>

              {/* Course Description Field */}
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Label htmlFor="description" className="text-sm font-semibold text-gray-700">Course Description *</Label>
                  <HelpTooltip content="Provide a detailed description of what this course covers. This helps students understand what they'll learn and helps you organize content." />
                </div>
                <Textarea
                  id="description"
                  {...register('description', { 
                    required: 'Description is required',
                    minLength: { value: 10, message: 'Description must be at least 10 characters' },
                    maxLength: { value: 500, message: 'Description must be less than 500 characters' }
                  })}
                  placeholder="e.g., Learn the fundamentals of programming including variables, loops, functions, and basic algorithms. Perfect for beginners with no prior coding experience."
                  rows={5}
                  className="border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 resize-none"
                />
                {errors.description && (
                  <p className="text-sm text-red-600 flex items-center">
                    <span className="w-1 h-1 bg-red-600 rounded-full mr-2"></span>
                    {errors.description.message}
                  </p>
                )}
                <p className="text-xs text-gray-500 flex items-center">
                  <BookOpen className="h-3 w-3 mr-1" />
                  Describe the course objectives, target audience, and what students will learn
                </p>
              </div>

              {/* Course Features Preview */}
              <Card className="bg-gradient-to-r from-gray-50 to-indigo-50 border border-gray-200">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center space-x-2">
                    <div className="p-2 bg-indigo-100 rounded-lg">
                      <CheckCircle className="h-5 w-5 text-indigo-600" />
                    </div>
                    <span>Course Features</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div className="space-y-3">
                      <h4 className="font-semibold text-indigo-900">Included Features:</h4>
                      <div className="space-y-2">
                        <div className="flex items-center p-3 bg-white rounded-lg border border-indigo-100">
                          <Users className="h-4 w-4 text-indigo-600 mr-3" />
                          <span className="text-gray-700">Student enrollment management</span>
                        </div>
                        <div className="flex items-center p-3 bg-white rounded-lg border border-indigo-100">
                          <Trophy className="h-4 w-4 text-indigo-600 mr-3" />
                          <span className="text-gray-700">Quiz contest creation</span>
                        </div>
                        <div className="flex items-center p-3 bg-white rounded-lg border border-indigo-100">
                          <Target className="h-4 w-4 text-indigo-600 mr-3" />
                          <span className="text-gray-700">Performance tracking</span>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <h4 className="font-semibold text-indigo-900">Course Statistics:</h4>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-indigo-100">
                          <span className="text-gray-700">Max Students:</span>
                          <Badge className="bg-indigo-100 text-indigo-800">Unlimited</Badge>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-indigo-100">
                          <span className="text-gray-700">Contest Limit:</span>
                          <Badge className="bg-indigo-100 text-indigo-800">Unlimited</Badge>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-indigo-100">
                          <span className="text-gray-700">Analytics:</span>
                          <Badge className="bg-green-100 text-green-800">Full Access</Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Enhanced Next Steps Preview */}
              <Card className="bg-gradient-to-r from-gray-50 to-purple-50 border border-gray-200">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center space-x-2">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Calendar className="h-5 w-5 text-purple-600" />
                    </div>
                    <span>Next Steps After Creation</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4 text-sm">
                    <div className="flex items-center space-x-4 p-4 bg-white rounded-lg border border-purple-100">
                      <div className="w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center text-sm font-bold">1</div>
                      <div>
                        <p className="font-medium text-gray-900">Enroll Students</p>
                        <p className="text-gray-600">Add students to this course from the course details page</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4 p-4 bg-white rounded-lg border border-purple-100">
                      <div className="w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center text-sm font-bold">2</div>
                      <div>
                        <p className="font-medium text-gray-900">Create Questions</p>
                        <p className="text-gray-600">Build MCQ questions for assessments in the Question Bank</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4 p-4 bg-white rounded-lg border border-purple-100">
                      <div className="w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center text-sm font-bold">3</div>
                      <div>
                        <p className="font-medium text-gray-900">Schedule Contests</p>
                        <p className="text-gray-600">Create and schedule quiz contests for this course using your questions</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Enhanced Action Buttons */}
              <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={handleBack}
                  disabled={isSubmitting}
                  className="px-6 hover:bg-gray-50"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  className="px-8 bg-indigo-600 hover:bg-indigo-700 flex items-center space-x-2"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Creating Course...</span>
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      <span>Create Course</span>
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default CreateCourse;
