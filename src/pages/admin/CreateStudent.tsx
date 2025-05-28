import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import Layout from '../../components/common/Layout';
import HelpTooltip from '../../components/common/HelpTooltip';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Save, Home, ChevronRight, User, Info } from 'lucide-react';
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
      <div className="space-y-6">
        {/* Breadcrumb Navigation */}
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate('/admin/dashboard')}
            className="p-0 h-auto font-normal"
          >
            <Home className="h-4 w-4 mr-1" />
            Dashboard
          </Button>
          <ChevronRight className="h-4 w-4" />
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate('/admin/students')}
            className="p-0 h-auto font-normal"
          >
            Students
          </Button>
          <ChevronRight className="h-4 w-4" />
          <span className="text-gray-900 font-medium">Create Student</span>
        </div>

        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Create New Student</h1>
            <p className="text-gray-600">Add a new student account to the system</p>
          </div>
        </div>

        {/* Help Information */}
        <Card className="border-l-4 border-l-blue-500 bg-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-blue-900">
              <Info className="h-5 w-5" />
              <span>About Student Accounts</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <h4 className="font-semibold text-blue-900 mb-2">Student Account Features:</h4>
                <ul className="space-y-1 text-blue-800">
                  <li>• Can be enrolled in multiple courses</li>
                  <li>• Access to course-specific contests</li>
                  <li>• View their own results and progress</li>
                  <li>• Secure login with email and password</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-blue-900 mb-2">After Creating:</h4>
                <ul className="space-y-1 text-blue-800">
                  <li>• Student will appear in the Students list</li>
                  <li>• Can be enrolled in courses from course details</li>
                  <li>• Student can login and access their dashboard</li>
                  <li>• Account can be activated/deactivated as needed</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <User className="h-5 w-5 text-blue-600" />
              <span>Student Details</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Label htmlFor="email">Email Address *</Label>
                  <HelpTooltip content="Student's email address will be used for login. Must be unique in the system." />
                </div>
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
                />
                {errors.email && (
                  <p className="text-sm text-red-600">{errors.email.message}</p>
                )}
                <p className="text-xs text-gray-500">
                  This email will be used for student login and communications
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Label htmlFor="password">Password *</Label>
                  <HelpTooltip content="Create a secure password for the student. They can change it later from their profile." />
                </div>
                <Input
                  id="password"
                  type="password"
                  {...register('password', { 
                    required: 'Password is required',
                    minLength: { value: 6, message: 'Password must be at least 6 characters' }
                  })}
                  placeholder="Enter password"
                />
                {errors.password && (
                  <p className="text-sm text-red-600">{errors.password.message}</p>
                )}
                <p className="text-xs text-gray-500">
                  Minimum 6 characters. Student can change this later.
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Label htmlFor="confirmPassword">Confirm Password *</Label>
                  <HelpTooltip content="Re-enter the password to confirm it's correct." />
                </div>
                <Input
                  id="confirmPassword"
                  type="password"
                  {...register('confirmPassword', { 
                    required: 'Please confirm the password',
                    validate: value => value === password || 'Passwords do not match'
                  })}
                  placeholder="Confirm password"
                />
                {errors.confirmPassword && (
                  <p className="text-sm text-red-600">{errors.confirmPassword.message}</p>
                )}
              </div>

              {/* Next Steps Preview */}
              <Card className="bg-gray-50">
                <CardHeader>
                  <CardTitle className="text-lg">After Creating This Student</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center space-x-3">
                      <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">1</div>
                      <span>Student will appear in the Students list with "Active" status</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">2</div>
                      <span>Enroll student in courses from the course details pages</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">3</div>
                      <span>Student can login and participate in course contests</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-end space-x-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={handleBack}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  className="flex items-center space-x-2"
                  disabled={isSubmitting}
                >
                  <Save className="h-4 w-4" />
                  <span>{isSubmitting ? 'Creating Student...' : 'Create Student'}</span>
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