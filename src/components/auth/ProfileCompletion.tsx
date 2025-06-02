import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { User, Mail, Check } from 'lucide-react';
import { otplessService } from '@/services/otpless';
import { useNavigate } from 'react-router-dom';

const ProfileCompletion: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { user, updateUserProfile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim() || !email.trim()) {
      toast({
        title: "⚠️ Missing Information",
        description: "Please fill in both your name and email.",
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

    setIsLoading(true);

    try {
      // Complete profile with backend
      const result = await otplessService.completeProfile({
        name: name.trim(),
        email: email.trim(),
      });

      // Update local user data
      updateUserProfile({
        name: name.trim(),
        email: email.trim(),
        profile_completed: true,
      });

      toast({
        title: "✨ Profile Completed!",
        description: "Your profile has been successfully set up.",
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

  if (!user?.auth_provider || user.auth_provider !== 'otpless') {
    navigate('/login');
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-4">
      <Card className="w-full max-w-md backdrop-blur-lg bg-white/95 shadow-2xl border-0 ring-1 ring-blue-100">
        <CardHeader className="text-center pb-6 bg-gradient-to-br from-blue-50 to-purple-50 border-b border-blue-100">
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
            Complete Your Profile
          </CardTitle>
          <CardDescription className="text-gray-600">
            Please provide your name and email to finish setting up your account.
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
                Email Address
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  disabled={isLoading}
                  required
                />
              </div>
            </div>

            {/* Submit button */}
            <Button
              type="submit"
              disabled={isLoading || !name.trim() || !email.trim()}
              className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 mt-6"
            >
              {isLoading ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Completing Profile...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <Check className="h-5 w-5" />
                  <span>Complete Profile</span>
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