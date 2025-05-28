import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import Layout from '../../components/common/Layout';
import HelpTooltip from '../../components/common/HelpTooltip';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Save, Home, ChevronRight, User, Info, UserPlus, Mail, Lock, Shield, CheckCircle, Users, BookOpen, Trophy } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { apiService } from '../../services/api';

interface StudentFormData {
  email: string;
  password: string;
  confirmPassword: string;
}

const CreateStudent = () => {
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors, isSubmitting }, watch } = useForm<StudentFormData>();

  const password = watch('password');

  const onSubmit = async (data: StudentFormData) => {
    if (data.password !== data.confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match",
        variant: "destructive"
      });
      return;
    }

    try {
      await apiService.createStudent({
        email: data.email,
        password: data.password
      });
      
      toast({
        title: "Success",
        description: "Student created successfully! They can now be enrolled in courses."
      });
      
      navigate('/admin/students');
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create student",
        variant: "destructive"
      });
    }
  };

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/admin/students');
    }
  };

  return (
    <Layout>
      <div className="space-y-8">
        {/* Enhanced Header */}
        <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 rounded-2xl p-8 text-white">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <UserPlus className="h-8 w-8" />
                  <h1 className="text-4xl font-bold">👤 Add New Student</h1>
                </div>
                <p className="text-blue-100 text-lg mb-4">
                  Create a new student account and set up their access to the learning platform
                </p>
                <div className="flex items-center space-x-4">
                  <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                    <Shield className="h-3 w-3 mr-1" />
                    Secure Account Creation
                  </Badge>
                  <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                    <Users className="h-3 w-3 mr-1" />
                    Multi-Course Enrollment
                  </Badge>
                </div>
              </div>
              <div className="hidden md:block">
                <div className="w-32 h-32 bg-white/10 rounded-full flex items-center justify-center">
                  <UserPlus className="h-16 w-16 text-blue-200" />
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
                className="p-0 h-auto font-normal hover:text-blue-600"
              >
                <Home className="h-4 w-4 mr-1" />
                Dashboard
              </Button>
              <ChevronRight className="h-4 w-4" />
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => navigate('/admin/students')}
                className="p-0 h-auto font-normal hover:text-blue-600"
              >
                Students
              </Button>
              <ChevronRight className="h-4 w-4" />
              <span className="text-gray-900 font-medium">Create Student</span>
            </div>
          </CardContent>
        </Card>

        {/* Enhanced Help Information */}
        <Card className="shadow-lg border-0 border-l-4 border-l-blue-500 bg-gradient-to-r from-blue-50 to-indigo-50">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-blue-900">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Info className="h-5 w-5 text-blue-600" />
              </div>
              <span>Student Account Overview</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
              <div className="space-y-3">
                <h4 className="font-semibold text-blue-900 flex items-center">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Account Features
                </h4>
                <ul className="space-y-2 text-blue-800">
                  <li className="flex items-center">
                    <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mr-2"></div>
                    Multi-course enrollment capability
                  </li>
                  <li className="flex items-center">
                    <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mr-2"></div>
                    Access to course-specific contests
                  </li>
                  <li className="flex items-center">
                    <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mr-2"></div>
                    Personal progress tracking
                  </li>
                  <li className="flex items-center">
                    <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mr-2"></div>
                    Secure authentication system
                  </li>
                </ul>
              </div>
              <div className="space-y-3">
                <h4 className="font-semibold text-blue-900 flex items-center">
                  <BookOpen className="h-4 w-4 mr-2" />
                  Learning Access
                </h4>
                <ul className="space-y-2 text-blue-800">
                  <li className="flex items-center">
                    <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mr-2"></div>
                    Interactive quiz participation
                  </li>
                  <li className="flex items-center">
                    <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mr-2"></div>
                    Real-time result viewing
                  </li>
                  <li className="flex items-center">
                    <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mr-2"></div>
                    Performance analytics
                  </li>
                  <li className="flex items-center">
                    <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mr-2"></div>
                    Achievement tracking
                  </li>
                </ul>
              </div>
              <div className="space-y-3">
                <h4 className="font-semibold text-blue-900 flex items-center">
                  <Trophy className="h-4 w-4 mr-2" />
                  After Creation
                </h4>
                <ul className="space-y-2 text-blue-800">
                  <li className="flex items-center">
                    <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mr-2"></div>
                    Appears in Students list
                  </li>
                  <li className="flex items-center">
                    <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mr-2"></div>
                    Ready for course enrollment
                  </li>
                  <li className="flex items-center">
                    <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mr-2"></div>
                    Can login immediately
                  </li>
                  <li className="flex items-center">
                    <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mr-2"></div>
                    Account status management
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Enhanced Student Details Form */}
        <Card className="shadow-lg border-0">
          <CardHeader className="border-b bg-gray-50">
            <CardTitle className="flex items-center space-x-2 text-xl">
              <div className="p-2 bg-blue-100 rounded-lg">
                <User className="h-5 w-5 text-blue-600" />
              </div>
              <span>Student Account Details</span>
            </CardTitle>
            <p className="text-gray-600 text-sm mt-1">Enter the student's information to create their account</p>
          </CardHeader>
          <CardContent className="p-8">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
              {/* Email Field */}
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Label htmlFor="email" className="text-sm font-semibold text-gray-700">Email Address *</Label>
                  <HelpTooltip content="Student's email address will be used for login. Must be unique in the system." />
                </div>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    id="email"
                    type="email"
                    {...register('email', { 
                      required: 'Email is required',
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: 'Invalid email address'
                      }
                    })}
                    placeholder="e.g., student@example.com"
                    className="pl-10 h-12 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                {errors.email && (
                  <p className="text-sm text-red-600 flex items-center">
                    <span className="w-1 h-1 bg-red-600 rounded-full mr-2"></span>
                    {errors.email.message}
                  </p>
                )}
                <p className="text-xs text-gray-500 flex items-center">
                  <Info className="h-3 w-3 mr-1" />
                  This email will be used for student login and communications
                </p>
              </div>

              {/* Password Field */}
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Label htmlFor="password" className="text-sm font-semibold text-gray-700">Password *</Label>
                  <HelpTooltip content="Create a secure password for the student. They can change it later from their profile." />
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    id="password"
                    type="password"
                    {...register('password', { 
                      required: 'Password is required',
                      minLength: { value: 6, message: 'Password must be at least 6 characters' }
                    })}
                    placeholder="Enter secure password"
                    className="pl-10 h-12 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                {errors.password && (
                  <p className="text-sm text-red-600 flex items-center">
                    <span className="w-1 h-1 bg-red-600 rounded-full mr-2"></span>
                    {errors.password.message}
                  </p>
                )}
                <p className="text-xs text-gray-500 flex items-center">
                  <Shield className="h-3 w-3 mr-1" />
                  Minimum 6 characters. Student can change this later.
                </p>
              </div>

              {/* Confirm Password Field */}
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Label htmlFor="confirmPassword" className="text-sm font-semibold text-gray-700">Confirm Password *</Label>
                  <HelpTooltip content="Re-enter the password to confirm it's correct." />
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    id="confirmPassword"
                    type="password"
                    {...register('confirmPassword', { 
                      required: 'Please confirm the password',
                      validate: value => value === password || 'Passwords do not match'
                    })}
                    placeholder="Confirm password"
                    className="pl-10 h-12 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                {errors.confirmPassword && (
                  <p className="text-sm text-red-600 flex items-center">
                    <span className="w-1 h-1 bg-red-600 rounded-full mr-2"></span>
                    {errors.confirmPassword.message}
                  </p>
                )}
              </div>

              {/* Enhanced Next Steps Preview */}
              <Card className="bg-gradient-to-r from-gray-50 to-blue-50 border border-gray-200">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center space-x-2">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <CheckCircle className="h-5 w-5 text-blue-600" />
                    </div>
                    <span>What Happens Next?</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4 text-sm">
                    <div className="flex items-center space-x-4 p-3 bg-white rounded-lg border border-blue-100">
                      <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">1</div>
                      <div>
                        <p className="font-medium text-gray-900">Student Account Created</p>
                        <p className="text-gray-600">Account will appear in the Students list with "Active" status</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4 p-3 bg-white rounded-lg border border-blue-100">
                      <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">2</div>
                      <div>
                        <p className="font-medium text-gray-900">Course Enrollment</p>
                        <p className="text-gray-600">Enroll student in courses from the course details pages</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4 p-3 bg-white rounded-lg border border-blue-100">
                      <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">3</div>
                      <div>
                        <p className="font-medium text-gray-900">Student Access</p>
                        <p className="text-gray-600">Student can login and participate in course contests immediately</p>
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
                  className="px-8 bg-blue-600 hover:bg-blue-700 flex items-center space-x-2"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Creating Student...</span>
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      <span>Create Student Account</span>
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

export default CreateStudent; 