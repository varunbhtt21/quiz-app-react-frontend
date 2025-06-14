import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { User, Mail, Check, AlertCircle, Link, Calendar } from 'lucide-react';
import { otplessService } from '@/services/otpless';
import { useNavigate } from 'react-router-dom';

const ProfileCompletion: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isEmailReadonly, setIsEmailReadonly] = useState(false);
  const [emailStatus, setEmailStatus] = useState<{
    is_pre_registered: boolean;
    status: 'invalid' | 'available' | 'pending' | 'taken';
    message?: string;
  } | null>(null);
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const { user, updateUserProfile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Initialize component based on user scenario
  useEffect(() => {
    console.log('ProfileCompletion component mounted');
    console.log('User data:', user);
    console.log('User auth_provider:', user?.auth_provider);
    console.log('User profile_completed:', user?.profile_completed);
    console.log('User registration_status:', user?.registration_status);
    
    // Scenario 1: Bulk-imported user (PENDING status with pre-filled email)
    if (user?.registration_status === 'PENDING' && user?.email) {
      console.log('🔍 Detected Scenario 1: Bulk-imported user');
      setEmail(user.email);
      setIsEmailReadonly(true);
    }
    // Scenario 2: Direct OTPLESS user (ACTIVE status, no email initially)
    else if (user?.registration_status === 'ACTIVE' && !user?.email) {
      console.log('🔍 Detected Scenario 2: Direct OTPLESS user');
      setIsEmailReadonly(false);
    }
    // Fallback: Use existing email if available
    else if (user?.email) {
      setEmail(user.email);
      setIsEmailReadonly(true);
    }
  }, [user]);

  // Check email status when email changes (only for non-readonly emails)
  useEffect(() => {
    const checkEmail = async () => {
      if (isEmailReadonly || !email || !email.includes('@') || email.length < 5) {
        setEmailStatus(null);
        return;
      }

      setIsCheckingEmail(true);
      try {
        const status = await otplessService.checkEmailStatus(email);
        setEmailStatus(status);
      } catch (error) {
        console.error('Error checking email status:', error);
        setEmailStatus(null);
      } finally {
        setIsCheckingEmail(false);
      }
    };

    const timeoutId = setTimeout(checkEmail, 500); // Debounce
    return () => clearTimeout(timeoutId);
  }, [email, isEmailReadonly]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim() || !email.trim() || !dateOfBirth.trim()) {
      toast({
        title: "⚠️ Missing Information",
        description: "Please fill in your name, email, and date of birth.",
        variant: "destructive",
      });
      return;
    }

    if (!email.includes('@')) {
      toast({
        title: "⚠️ Invalid Email",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      return;
    }

    // Block submission if email is taken by another active user
    if (emailStatus?.status === 'taken') {
      toast({
        title: "⚠️ Email Already Taken",
        description: "This email is already registered by another user. Please use a different email.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Complete profile with backend
      const result = await otplessService.completeProfile({
        name: name.trim(),
        email: email.trim(),
        date_of_birth: dateOfBirth,
      });

      // Update local user data
      updateUserProfile({
        name: name.trim(),
        email: email.trim(),
        date_of_birth: dateOfBirth,
        profile_completed: true,
      });

      toast({
        title: emailStatus?.status === 'pending' ? "🔗 Account Linked!" : "✨ Profile Completed!",
        description: emailStatus?.status === 'pending' 
          ? "Your account has been linked to your pre-registered email successfully!"
          : "Your profile has been successfully set up.",
      });

      // Navigate to appropriate dashboard
      navigate(user?.role === 'admin' ? '/admin/dashboard' : '/student/dashboard');

    } catch (error: any) {
      console.error('Profile completion failed:', error);
      toast({
        title: "🚫 Profile Completion Failed",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Debug: Check authentication
  if (!user?.auth_provider || user.auth_provider !== 'otpless') {
    console.log('User not authenticated properly, redirecting to login');
    navigate('/login');
    return null;
  }

  // Add a fallback render with debug info
  console.log('Rendering ProfileCompletion component');

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-4">
      <Card className="w-full max-w-md backdrop-blur-lg bg-white/95 shadow-2xl border-0 ring-1 ring-blue-100">
        <CardHeader className="text-center pb-6 bg-gradient-to-br from-blue-50 to-purple-50 border-b border-blue-100">
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
            Complete Your Profile
          </CardTitle>
          <CardDescription className="text-gray-600">
            {isEmailReadonly 
              ? "Please provide your name and date of birth to complete your profile."
              : "Please provide your name, email, and date of birth to finish setting up your account."
            }
          </CardDescription>
        </CardHeader>

        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Mobile number display */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
              <div className="flex items-center space-x-2 text-green-700">
                <Check className="h-4 w-4" />
                <span className="text-sm font-medium">Phone Verified</span>
              </div>
              <p className="text-sm text-green-600 mt-1">
                {user?.mobile ? `+91 ${user.mobile.slice(-10)}` : 'Phone number verified'}
              </p>
            </div>

            {/* Name input */}
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium">
                Full Name
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="name"
                  type="text"
                  placeholder="Enter your full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="pl-10"
                  disabled={isLoading}
                  required
                />
              </div>
            </div>

            {/* Email input */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">
                Email Address {isEmailReadonly && <span className="text-xs text-blue-600">(Pre-filled)</span>}
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`pl-10 ${
                    isEmailReadonly ? 'bg-gray-50 border-gray-300 text-gray-700' :
                    emailStatus?.status === 'pending' ? 'border-blue-300 bg-blue-50' :
                    emailStatus?.status === 'taken' ? 'border-red-300 bg-red-50' :
                    emailStatus?.status === 'available' ? 'border-green-300 bg-green-50' : ''
                  }`}
                  disabled={isLoading || isEmailReadonly}
                  readOnly={isEmailReadonly}
                  required
                />
                {!isEmailReadonly && isCheckingEmail && (
                  <div className="absolute right-3 top-3">
                    <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
                  </div>
                )}
              </div>
              
              {/* Email status message */}
              {!isEmailReadonly && emailStatus && (
                <div className={`flex items-center space-x-2 text-sm p-2 rounded-lg ${
                  emailStatus.status === 'pending' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                  emailStatus.status === 'taken' ? 'bg-red-50 text-red-700 border border-red-200' :
                  emailStatus.status === 'available' ? 'bg-green-50 text-green-700 border border-green-200' : ''
                }`}>
                  {emailStatus.status === 'pending' && <Link className="h-4 w-4" />}
                  {emailStatus.status === 'taken' && <AlertCircle className="h-4 w-4" />}
                  {emailStatus.status === 'available' && <Check className="h-4 w-4" />}
                  <span>
                    {emailStatus.message || 
                      (emailStatus.status === 'available' ? 'Email is available' : 
                       emailStatus.status === 'pending' ? 'This email was pre-registered for you' :
                       'Email is already taken')}
                  </span>
                </div>
              )}
              
              {/* Readonly email info */}
              {isEmailReadonly && (
                <div className="flex items-center space-x-2 text-sm p-2 rounded-lg bg-blue-50 text-blue-700 border border-blue-200">
                  <Check className="h-4 w-4" />
                  <span>This email was pre-registered for you by your administrator</span>
                </div>
              )}
            </div>

            {/* Date of Birth input */}
            <div className="space-y-2">
              <Label htmlFor="dateOfBirth" className="text-sm font-medium">
                Date of Birth
              </Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="dateOfBirth"
                  type="date"
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                  className="pl-10"
                  disabled={isLoading}
                  max={new Date().toISOString().split('T')[0]} // Prevent future dates
                  required
                />
              </div>
              <p className="text-xs text-gray-500">
                This helps us provide age-appropriate content and features
              </p>
            </div>

            {/* Submit button */}
            <Button
              type="submit"
              disabled={isLoading || !name.trim() || !email.trim() || !dateOfBirth.trim() || (!isEmailReadonly && emailStatus?.status === 'taken')}
              className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 mt-6 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>
                    {emailStatus?.status === 'pending' ? 'Linking Account...' : 'Completing Profile...'}
                  </span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  {emailStatus?.status === 'pending' ? <Link className="h-5 w-5" /> : <Check className="h-5 w-5" />}
                  <span>
                    {emailStatus?.status === 'pending' ? 'Link & Complete Profile' : 'Complete Profile'}
                  </span>
                </div>
              )}
            </Button>
          </form>

          <div className="mt-6 pt-4 border-t border-gray-200 text-center">
            <p className="text-xs text-gray-500">
              This information helps us personalize your experience and send important updates.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfileCompletion; 