import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import Layout from '../../components/common/Layout';
import HelpTooltip from '../../components/common/HelpTooltip';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Save, Home, ChevronRight, User, Info, UserPlus, Mail, Lock, Shield, CheckCircle, Users, BookOpen, Trophy, UserCheck, Phone } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { apiService } from '../../services/api';

interface UserFormData {
  email: string;
  mobile?: string;
  password?: string;
  confirmPassword?: string;
}

const CreateUser = () => {
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors, isSubmitting }, watch } = useForm<UserFormData>();
  const [selectedRole, setSelectedRole] = useState<string>('student');

  const password = watch('password');

  const onSubmit = async (data: UserFormData) => {
    if (selectedRole === 'admin') {
      // Admin validation
      if (!data.password || !data.confirmPassword) {
        toast({
          title: "Error",
          description: "Password is required for admin users",
          variant: "destructive"
        });
        return;
      }
      
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
          password: data.password,
          role: selectedRole as 'admin' | 'student'
        });
        
        toast({
          title: "Success",
          description: "Administrator created successfully!"
        });
        
        navigate('/admin/students');
      } catch (error) {
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to create administrator",
          variant: "destructive"
        });
      }
    } else {
      // Student validation
      if (!data.mobile) {
        toast({
          title: "Error",
          description: "Mobile number is required for student users",
          variant: "destructive"
        });
        return;
      }

      try {
        // Create pre-registered student
        await apiService.createPreRegisteredStudent({
          email: data.email,
          mobile: data.mobile
        });
        
        toast({
          title: "Success",
          description: "Student created successfully! An invitation email has been sent."
        });
        
        navigate('/admin/students');
      } catch (error) {
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to create student",
          variant: "destructive"
        });
      }
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
                  <h1 className="text-4xl font-bold">👤 Add User</h1>
                </div>
                <p className="text-blue-100 text-lg mb-4">
                  Create a new user account and set up their access to the platform
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
              <span>User Account Overview</span>
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
              <span>User Account Details</span>
            </CardTitle>
            <p className="text-gray-600 text-sm mt-1">Enter the user information to create their account</p>
          </CardHeader>
          <CardContent className="p-8">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
              {/* Role Selection - Card Interface */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Label className="text-sm font-semibold text-gray-700">User Role *</Label>
                  <HelpTooltip content="Select whether this user should be a Student or Administrator. Students will be pre-registered and use OTPless authentication, while Administrators require immediate password setup." />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Student Card */}
                  <div 
                    className={`relative cursor-pointer rounded-xl border-2 p-6 transition-all duration-200 hover:shadow-lg ${
                      selectedRole === 'student' 
                        ? 'border-green-500 bg-green-50 shadow-md' 
                        : 'border-gray-200 bg-white hover:border-green-300'
                    }`}
                    onClick={() => setSelectedRole('student')}
                  >
                    {selectedRole === 'student' && (
                      <div className="absolute top-3 right-3">
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-green-500">
                          <CheckCircle className="h-4 w-4 text-white" />
                        </div>
                      </div>
                    )}
                    
                    <div className="flex items-start space-x-4">
                      <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${
                        selectedRole === 'student' ? 'bg-green-100' : 'bg-gray-100'
                      }`}>
                        <UserCheck className={`h-6 w-6 ${
                          selectedRole === 'student' ? 'text-green-600' : 'text-gray-600'
                        }`} />
                      </div>
                      
                      <div className="flex-1">
                        <h3 className={`text-lg font-semibold ${
                          selectedRole === 'student' ? 'text-green-900' : 'text-gray-900'
                        }`}>
                          Student
                        </h3>
                        <p className={`text-sm mt-1 ${
                          selectedRole === 'student' ? 'text-green-700' : 'text-gray-600'
                        }`}>
                          Learning platform access with course enrollment
                        </p>
                        
                        <div className="mt-3 space-y-2">
                          <div className="flex items-center space-x-2">
                            <div className={`w-2 h-2 rounded-full ${
                              selectedRole === 'student' ? 'bg-green-500' : 'bg-gray-400'
                            }`}></div>
                            <span className={`text-xs ${
                              selectedRole === 'student' ? 'text-green-700' : 'text-gray-600'
                            }`}>
                              Pre-registered with invitation email
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <div className={`w-2 h-2 rounded-full ${
                              selectedRole === 'student' ? 'bg-green-500' : 'bg-gray-400'
                            }`}></div>
                            <span className={`text-xs ${
                              selectedRole === 'student' ? 'text-green-700' : 'text-gray-600'
                            }`}>
                              OTPless authentication
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <div className={`w-2 h-2 rounded-full ${
                              selectedRole === 'student' ? 'bg-green-500' : 'bg-gray-400'
                            }`}></div>
                            <span className={`text-xs ${
                              selectedRole === 'student' ? 'text-green-700' : 'text-gray-600'
                            }`}>
                              Course participation & quiz access
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Administrator Card */}
                  <div 
                    className={`relative cursor-pointer rounded-xl border-2 p-6 transition-all duration-200 hover:shadow-lg ${
                      selectedRole === 'admin' 
                        ? 'border-red-500 bg-red-50 shadow-md' 
                        : 'border-gray-200 bg-white hover:border-red-300'
                    }`}
                    onClick={() => setSelectedRole('admin')}
                  >
                    {selectedRole === 'admin' && (
                      <div className="absolute top-3 right-3">
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-red-500">
                          <CheckCircle className="h-4 w-4 text-white" />
                        </div>
                      </div>
                    )}
                    
                    <div className="flex items-start space-x-4">
                      <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${
                        selectedRole === 'admin' ? 'bg-red-100' : 'bg-gray-100'
                      }`}>
                        <Shield className={`h-6 w-6 ${
                          selectedRole === 'admin' ? 'text-red-600' : 'text-gray-600'
                        }`} />
                      </div>
                      
                      <div className="flex-1">
                        <h3 className={`text-lg font-semibold ${
                          selectedRole === 'admin' ? 'text-red-900' : 'text-gray-900'
                        }`}>
                          Administrator
                        </h3>
                        <p className={`text-sm mt-1 ${
                          selectedRole === 'admin' ? 'text-red-700' : 'text-gray-600'
                        }`}>
                          Full platform management and administrative access
                        </p>
                        
                        <div className="mt-3 space-y-2">
                          <div className="flex items-center space-x-2">
                            <div className={`w-2 h-2 rounded-full ${
                              selectedRole === 'admin' ? 'bg-red-500' : 'bg-gray-400'
                            }`}></div>
                            <span className={`text-xs ${
                              selectedRole === 'admin' ? 'text-red-700' : 'text-gray-600'
                            }`}>
                              Immediate account activation
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <div className={`w-2 h-2 rounded-full ${
                              selectedRole === 'admin' ? 'bg-red-500' : 'bg-gray-400'
                            }`}></div>
                            <span className={`text-xs ${
                              selectedRole === 'admin' ? 'text-red-700' : 'text-gray-600'
                            }`}>
                              Email & password authentication
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <div className={`w-2 h-2 rounded-full ${
                              selectedRole === 'admin' ? 'bg-red-500' : 'bg-gray-400'
                            }`}></div>
                            <span className={`text-xs ${
                              selectedRole === 'admin' ? 'text-red-700' : 'text-gray-600'
                            }`}>
                              User, course & contest management
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <p className="text-xs text-gray-600 text-center">
                  {selectedRole === 'admin' 
                    ? '👨‍💼 Administrators require password setup and have full platform access.'
                    : '🎓 Students will be pre-registered and receive invitation emails for OTPless authentication.'
                  }
                </p>
              </div>

              {/* Email Field - Always required */}
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Label htmlFor="email" className="text-sm font-semibold text-gray-700">Email Address *</Label>
                  <HelpTooltip content={selectedRole === 'admin' ? "Administrator's email address for login and communications." : "Student's email address for invitation and communications. Must be unique in the system."} />
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
                    placeholder={selectedRole === 'admin' ? "e.g., admin@institute.com" : "e.g., student@example.com"}
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
                  {selectedRole === 'admin' 
                    ? 'This email will be used for administrator login and system communications'
                    : 'An invitation email will be sent to this address for account activation'
                  }
                </p>
              </div>

              {/* Mobile Number Field - Only for Students */}
              {selectedRole === 'student' && (
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Label htmlFor="mobile" className="text-sm font-semibold text-gray-700">Mobile Number *</Label>
                    <HelpTooltip content="Student's mobile number for OTPless authentication. Supports various formats like +91-XXXXXXXXXX, 91XXXXXXXXXX, or 10-digit numbers." />
                  </div>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      id="mobile"
                      type="tel"
                      {...register('mobile', { 
                        required: selectedRole === 'student' ? 'Mobile number is required for students' : false,
                        pattern: {
                          value: /^(\+91|91)?[6-9]\d{9}$/,
                          message: 'Invalid Indian mobile number'
                        }
                      })}
                      placeholder="e.g., +91-9876543210 or 9876543210"
                      className="pl-10 h-12 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                  {errors.mobile && (
                    <p className="text-sm text-red-600 flex items-center">
                      <span className="w-1 h-1 bg-red-600 rounded-full mr-2"></span>
                      {errors.mobile.message}
                    </p>
                  )}
                  <p className="text-xs text-gray-500 flex items-center">
                    <Info className="h-3 w-3 mr-1" />
                    Mobile number will be normalized and used for OTPless authentication
                  </p>
                </div>
              )}

              {/* Password Fields - Only for Admins */}
              {selectedRole === 'admin' && (
                <>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Label htmlFor="password" className="text-sm font-semibold text-gray-700">Password *</Label>
                      <HelpTooltip content="Create a secure password for the administrator. They can change it later from their profile." />
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        id="password"
                        type="password"
                        {...register('password', { 
                          required: selectedRole === 'admin' ? 'Password is required for administrators' : false,
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
                      <Info className="h-3 w-3 mr-1" />
                      Password must be at least 6 characters long
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Label htmlFor="confirmPassword" className="text-sm font-semibold text-gray-700">Confirm Password *</Label>
                      <HelpTooltip content="Re-enter the password to confirm it matches exactly." />
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        id="confirmPassword"
                        type="password"
                        {...register('confirmPassword', { 
                          required: selectedRole === 'admin' ? 'Please confirm your password' : false,
                          validate: value => selectedRole === 'admin' && password ? (value === password || 'Passwords do not match') : true
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
                    <p className="text-xs text-gray-500 flex items-center">
                      <Info className="h-3 w-3 mr-1" />
                      Must match the password entered above
                    </p>
                  </div>
                </>
              )}

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
                    {selectedRole === 'student' ? (
                      <>
                        <div className="flex items-center space-x-4 p-3 bg-white rounded-lg border border-blue-100">
                          <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">1</div>
                          <div>
                            <p className="font-medium text-gray-900">Student Pre-Registered</p>
                            <p className="text-gray-600">Account created with PENDING status, mobile number normalized and validated</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4 p-3 bg-white rounded-lg border border-blue-100">
                          <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">2</div>
                          <div>
                            <p className="font-medium text-gray-900">Invitation Email Sent</p>
                            <p className="text-gray-600">Student receives invitation email with activation instructions</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4 p-3 bg-white rounded-lg border border-blue-100">
                          <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">3</div>
                          <div>
                            <p className="font-medium text-gray-900">Student Activation</p>
                            <p className="text-gray-600">Student uses OTPless authentication to complete registration and access platform</p>
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex items-center space-x-4 p-3 bg-white rounded-lg border border-blue-100">
                          <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">1</div>
                          <div>
                            <p className="font-medium text-gray-900">Administrator Account Created</p>
                            <p className="text-gray-600">Account will appear in the Users list with "Active" status</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4 p-3 bg-white rounded-lg border border-blue-100">
                          <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">2</div>
                          <div>
                            <p className="font-medium text-gray-900">Immediate Access</p>
                            <p className="text-gray-600">Administrator can login immediately using email and password</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4 p-3 bg-white rounded-lg border border-blue-100">
                          <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">3</div>
                          <div>
                            <p className="font-medium text-gray-900">Full Platform Access</p>
                            <p className="text-gray-600">Administrator has complete access to manage users, courses, and contests</p>
                          </div>
                        </div>
                      </>
                    )}
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
                      <span>Creating {selectedRole === 'admin' ? 'Administrator' : 'Student'}...</span>
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      <span>Create Account</span>
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

export default CreateUser; 