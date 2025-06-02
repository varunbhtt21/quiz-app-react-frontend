import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { User, Mail, Phone, Shield, Check } from 'lucide-react';
import { apiService } from '@/services/api';
import { useNavigate } from 'react-router-dom';

const AdminProfileCompletion: React.FC = () => {
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { user, updateUserProfile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      toast({
        title: "⚠️ Missing Information",
        description: "Please enter your full name.",
        variant: "destructive",
      });
      return;
    }

    if (!mobile.trim()) {
      toast({
        title: "⚠️ Missing Information",
        description: "Please enter your mobile number.",
        variant: "destructive",
      });
      return;
    }

    if (!mobile.match(/^[\+]?[0-9\s\-\(\)]{10,15}$/)) {
      toast({
        title: "⚠️ Invalid Mobile Number",
        description: "Please enter a valid mobile number.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Complete profile with backend
      const result = await apiService.completeAdminProfile({
        name: name.trim(),
        mobile: mobile.trim(),
      });

      // Update local user data
      updateUserProfile({
        name: name.trim(),
        mobile: mobile.trim(),
        profile_completed: true,
      });

      toast({
        title: "✨ Profile Completed!",
        description: "Your admin profile has been successfully set up.",
      });

      // Navigate to admin dashboard
      navigate('/admin/dashboard');

    } catch (error: any) {
      console.error('Admin profile completion failed:', error);
      toast({
        title: "🚫 Profile Completion Failed",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!user || user.role !== 'admin') {
    navigate('/login');
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 p-4">
      <Card className="w-full max-w-md backdrop-blur-lg bg-white/95 shadow-2xl border-0 ring-1 ring-orange-100">
        <CardHeader className="text-center pb-6 bg-gradient-to-br from-orange-50 to-red-50 border-b border-orange-100">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-gradient-to-r from-orange-500 to-red-600 p-3 rounded-2xl shadow-lg">
              <Shield className="h-8 w-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent mb-2">
            Complete Admin Profile
          </CardTitle>
          <CardDescription className="text-gray-600">
            Please provide your name and mobile number to finish setting up your administrator account.
          </CardDescription>
        </CardHeader>

        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email display */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
              <div className="flex items-center space-x-2 text-green-700">
                <Check className="h-4 w-4" />
                <span className="text-sm font-medium">Email Verified</span>
              </div>
              <p className="text-sm text-green-600 mt-1">
                {user?.email}
              </p>
            </div>

            {/* Name input */}
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium">
                Full Name *
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

            {/* Mobile input */}
            <div className="space-y-2">
              <Label htmlFor="mobile" className="text-sm font-medium">
                Mobile Number *
              </Label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="mobile"
                  type="tel"
                  placeholder="e.g., +91 9876543210"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  className="pl-10"
                  disabled={isLoading}
                  required
                />
              </div>
              <p className="text-xs text-gray-500">
                Include country code for international numbers
              </p>
            </div>

            {/* Submit button */}
            <Button
              type="submit"
              disabled={isLoading || !name.trim() || !mobile.trim()}
              className="w-full h-12 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 mt-6"
            >
              {isLoading ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Completing Profile...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <Shield className="h-5 w-5" />
                  <span>Complete Admin Profile</span>
                </div>
              )}
            </Button>
          </form>

          <div className="mt-6 pt-4 border-t border-gray-200 text-center">
            <p className="text-xs text-gray-500">
              This information helps us provide you with administrative features and support.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminProfileCompletion; 