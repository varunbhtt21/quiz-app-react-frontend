import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import Layout from '../../components/common/Layout';
import HelpTooltip from '../../components/common/HelpTooltip';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, Save, Home, ChevronRight, User, Edit, Shield, UserCheck, UserX, Lock, Eye, EyeOff } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { apiService } from '../../services/api';

interface Student {
  id: string;
  email: string;
  role: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface StudentUpdateData {
  email: string;
  role: string;
  is_active: boolean;
  password?: string;
  confirmPassword?: string;
}

const EditStudent = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { register, handleSubmit, formState: { errors, isSubmitting }, setValue, watch } = useForm<StudentUpdateData>();

  const watchedRole = watch('role');
  const watchedIsActive = watch('is_active');
  const password = watch('password');

  useEffect(() => {
    if (id) {
      loadStudent(id);
    }
  }, [id]);

  const loadStudent = async (studentId: string) => {
    try {
      setLoading(true);
      const data = await apiService.getStudent(studentId) as Student;
      setStudent(data);
      
      // Set form values
      setValue('email', data.email);
      setValue('role', data.role);
      setValue('is_active', data.is_active);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load student details",
        variant: "destructive"
      });
      navigate('/admin/students');
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: StudentUpdateData) => {
    if (!id) return;

    // Validate password confirmation if password is provided
    if (data.password && data.password !== data.confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match",
        variant: "destructive"
      });
      return;
    }

    try {
      const updateData: any = {
        email: data.email,
        role: data.role as 'admin' | 'student',
        is_active: data.is_active
      };

      // Only include password if it's provided and not empty
      if (data.password && data.password.trim()) {
        updateData.password = data.password;
      }

      await apiService.updateStudent(id, updateData);
      
      toast({
        title: "Success",
        description: data.password ? "Student updated successfully with new password!" : "Student updated successfully!"
      });
      
      navigate('/admin/students');
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update student",
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

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-96">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <span>Loading student details...</span>
          </div>
        </div>
      </Layout>
    );
  }

  if (!student) {
    return (
      <Layout>
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Student Not Found</h2>
          <Button onClick={() => navigate('/admin/students')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Students
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-8">
        {/* Header */}
        <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 rounded-2xl p-8 text-white">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <Edit className="h-8 w-8" />
                  <h1 className="text-4xl font-bold">✏️ Edit Student</h1>
                </div>
                <p className="text-blue-100 text-lg mb-4">
                  Update student account details and permissions
                </p>
                <div className="flex items-center space-x-4">
                  <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                    <User className="h-3 w-3 mr-1" />
                    Student ID: {student.id.slice(0, 8)}...
                  </Badge>
                  <Badge variant="secondary" className={`border-white/30 ${
                    student.role === 'admin' 
                      ? 'bg-red-500/20 text-red-100' 
                      : 'bg-green-500/20 text-green-100'
                  }`}>
                    <Shield className="h-3 w-3 mr-1" />
                    {student.role.charAt(0).toUpperCase() + student.role.slice(1)}
                  </Badge>
                </div>
              </div>
              <div className="hidden md:block">
                <div className="w-32 h-32 bg-white/10 rounded-full flex items-center justify-center">
                  <Edit className="h-16 w-16 text-blue-200" />
                </div>
              </div>
            </div>
          </div>
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
              <span className="text-gray-900 font-medium">Edit Student</span>
            </div>
          </CardContent>
        </Card>

        {/* Edit Form */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <User className="h-5 w-5" />
              <span>Student Information</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Email Field */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="student@example.com"
                  {...register('email', {
                    required: 'Email is required',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Invalid email address'
                    }
                  })}
                  className="h-12"
                />
                {errors.email && (
                  <p className="text-sm text-red-600">{errors.email.message}</p>
                )}
              </div>

              {/* Role Field */}
              <div className="space-y-2">
                <Label htmlFor="role" className="text-sm font-medium text-gray-700">
                  User Role
                </Label>
                <Select
                  value={watchedRole}
                  onValueChange={(value) => setValue('role', value)}
                >
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="Select user role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="student">
                      <div className="flex items-center space-x-2">
                        <UserCheck className="h-4 w-4 text-green-600" />
                        <span>Student</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="admin">
                      <div className="flex items-center space-x-2">
                        <Shield className="h-4 w-4 text-red-600" />
                        <span>Administrator</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500">
                  Administrators have full access to the admin panel, while students can only access their learning dashboard.
                </p>
              </div>

              {/* Active Status */}
              <div className="space-y-2">
                <Label htmlFor="is_active" className="text-sm font-medium text-gray-700">
                  Account Status
                </Label>
                <div className="flex items-center space-x-3">
                  <Switch
                    id="is_active"
                    checked={watchedIsActive}
                    onCheckedChange={(checked) => setValue('is_active', checked)}
                  />
                  <div className="flex items-center space-x-2">
                    {watchedIsActive ? (
                      <>
                        <UserCheck className="h-4 w-4 text-green-600" />
                        <span className="text-sm text-green-600 font-medium">Active</span>
                      </>
                    ) : (
                      <>
                        <UserX className="h-4 w-4 text-red-600" />
                        <span className="text-sm text-red-600 font-medium">Inactive</span>
                      </>
                    )}
                  </div>
                </div>
                <p className="text-xs text-gray-500">
                  Inactive users cannot log in to the platform.
                </p>
              </div>

              {/* Password Fields */}
              <div className="space-y-4">
                <div className="border-t pt-6">
                  <div className="flex items-center space-x-2 mb-4">
                    <Lock className="h-5 w-5 text-gray-500" />
                    <Label className="text-base font-semibold text-gray-900">Password Update (Optional)</Label>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">Leave empty to keep current password unchanged</p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                      New Password
                    </Label>
                    <HelpTooltip content="Password must be at least 6 characters long. Leave empty to keep current password." />
                  </div>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter new password (optional)"
                      {...register('password', {
                        minLength: {
                          value: 6,
                          message: 'Password must be at least 6 characters'
                        }
                      })}
                      className="h-12 pr-12"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-12 w-12"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  {errors.password && (
                    <p className="text-sm text-red-600 flex items-center">
                      <span className="w-1 h-1 bg-red-600 rounded-full mr-2"></span>
                      {errors.password.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
                      Confirm New Password
                    </Label>
                    <HelpTooltip content="Re-enter the new password to confirm it's correct." />
                  </div>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="Confirm new password"
                      {...register('confirmPassword', {
                        validate: value => {
                          if (password && !value) {
                            return 'Please confirm the password';
                          }
                          if (password && value !== password) {
                            return 'Passwords do not match';
                          }
                          return true;
                        }
                      })}
                      className="h-12 pr-12"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-12 w-12"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="text-sm text-red-600 flex items-center">
                      <span className="w-1 h-1 bg-red-600 rounded-full mr-2"></span>
                      {errors.confirmPassword.message}
                    </p>
                  )}
                </div>

                {password && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-sm text-blue-800 font-medium">Password Security Notice</p>
                    <p className="text-xs text-blue-700 mt-1">
                      The new password will be immediately applied. The user will need to use this new password for their next login.
                    </p>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-6 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleBack}
                  className="flex items-center space-x-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>Cancel</span>
                </Button>
                
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>Updating...</span>
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      <span>Update Student</span>
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

export default EditStudent; 