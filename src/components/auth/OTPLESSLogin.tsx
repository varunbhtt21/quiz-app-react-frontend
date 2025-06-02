import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Shield, Zap, Smartphone, ArrowRight, Sparkles } from 'lucide-react';
import { otplessService } from '@/services/otpless';

interface OTPLESSLoginProps {
  onLoginSuccess: (token: string, userData: any) => void;
  onShowTraditionalLogin: () => void;
}

// Extend Window interface for OTPLESS
declare global {
  interface Window {
    otpless: (otplessUser: any) => void;
  }
}

const OTPLESSLogin: React.FC<OTPLESSLoginProps> = ({ onLoginSuccess, onShowTraditionalLogin }) => {
  const [sdkLoaded, setSdkLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    console.log("🚀 OTPLESS Login Component Mounted");
    
    // Load OTPLESS SDK following official documentation
    const script = document.createElement('script');
    script.id = 'otpless-sdk';
    script.type = 'text/javascript';
    script.src = 'https://otpless.com/v4/auth.js';  // Correct SDK URL per docs
    script.setAttribute('data-appid', import.meta.env.VITE_OTPLESS_APP_ID || 'your_app_id_here');
    script.async = true;
    
    script.onload = () => {
      console.log("✅ OTPLESS SDK loaded successfully");
      setSdkLoaded(true);
      setupOTPLESSCallback();
    };
    
    script.onerror = () => {
      console.error("❌ Failed to load OTPLESS SDK");
      toast({
        title: "🚫 SDK Loading Failed",
        description: "Failed to load OTPLESS SDK. Please refresh and try again.",
        variant: "destructive",
      });
    };
    
    document.head.appendChild(script);

    return () => {
      // Cleanup script and callback
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
      // Remove the global callback
      if (window.otpless) {
        delete window.otpless;
      }
    };
  }, []);

  const setupOTPLESSCallback = () => {
    const appId = import.meta.env.VITE_OTPLESS_APP_ID || 'your_app_id_here';
    
    if (appId === 'your_app_id_here') {
      toast({
        title: "⚠️ Configuration Error", 
        description: "OTPLESS App ID not configured. Please check your environment variables.",
        variant: "destructive",
      });
      return;
    }

    console.log("🔧 Setting up OTPLESS callback with App ID:", appId);

    // Set up the global callback function as per official documentation
    window.otpless = (otplessUser: any) => {
      console.log("🎯 OTPLESS Callback Received:", otplessUser);
      
      if (otplessUser.status === "SUCCESS" && otplessUser.token) {
        console.log("✅ Authentication successful, token received:", otplessUser.token);
        handleAuthSuccess(otplessUser.token);
      } else {
        console.error("❌ Authentication failed:", otplessUser);
        toast({
          title: "🚫 Authentication Failed",
          description: otplessUser.errorMessage || "Please try again.",
          variant: "destructive",
        });
        setIsLoading(false);
      }
    };

    console.log("✅ OTPLESS callback setup complete");
  };

  const handleAuthSuccess = async (token: string) => {
    console.log("🚀 handleAuthSuccess called with token:", token);
    setIsLoading(true);
    
    try {
      console.log("📡 Calling backend to verify token...");
      
      // Verify token with backend
      const verificationResult = await otplessService.verifyToken(token);
      console.log("✅ Backend verification successful:", verificationResult);
      
      toast({
        title: "✨ Authentication Successful!",
        description: "Welcome! Setting up your account...",
      });

      console.log("🔄 Calling onLoginSuccess with:", {
        access_token: verificationResult.access_token,
        user: verificationResult.user
      });

      // Pass the result to parent component
      onLoginSuccess(verificationResult.access_token, verificationResult.user);
    } catch (error: any) {
      console.error('❌ Token verification failed:', error);
      toast({
        title: "🚫 Verification Failed",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      console.log("🏁 Setting isLoading to false");
      setIsLoading(false);
    }
  };

  return (
    <Card className="backdrop-blur-lg bg-white/95 shadow-2xl border-0 overflow-hidden ring-1 ring-blue-100">
      <CardHeader className="text-center pb-6 bg-gradient-to-br from-blue-50 to-purple-50 border-b border-blue-100">
        <div className="flex items-center justify-center mb-4">
          <Badge className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-1">
            <Sparkles className="h-3 w-3 mr-1" />
            Quick & Secure
          </Badge>
        </div>
        <CardTitle className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
          Welcome to QuizMaster
        </CardTitle>
        <CardDescription className="text-gray-600">
          Login with your mobile number - no passwords needed!
        </CardDescription>
      </CardHeader>

      <CardContent className="p-8 space-y-6">
        {/* Debug Info - Remove in production */}
        {import.meta.env.VITE_NODE_ENV === 'development' && (
          <div className="bg-gray-100 p-3 rounded text-xs">
            <strong>Debug:</strong> sdkLoaded: {sdkLoaded.toString()}, 
            isLoading: {isLoading.toString()}
          </div>
        )}

        {/* OTPLESS Login UI Container - This is where the OTPLESS Pre-Built UI will appear */}
        <div className="space-y-4">
          <div 
            id="otpless-login-page" 
            className="min-h-[200px] flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg"
          >
            {!sdkLoaded ? (
              <div className="text-center text-sm text-gray-500">
                <div className="flex items-center justify-center space-x-2 mb-2">
                  <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                  <span>Loading authentication service...</span>
                </div>
                <p className="text-xs text-gray-400">Setting up secure login...</p>
              </div>
            ) : (
              <div className="text-center text-sm text-gray-500">
                <div className="flex items-center justify-center space-x-2 mb-2">
                  <Shield className="h-5 w-5 text-green-500" />
                  <span className="text-green-600 font-medium">Authentication Ready</span>
                </div>
                <p className="text-xs text-gray-400">
                  OTPLESS login widget should appear here.
                  <br />
                  If not visible, check console for errors.
                </p>
              </div>
            )}
          </div>

          {/* Loading indicator when processing authentication */}
          {isLoading && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <div>
                  <p className="text-blue-800 font-medium">Processing Authentication...</p>
                  <p className="text-blue-600 text-sm">Please wait while we verify your account.</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Features List */}
        <div className="space-y-4 pt-4">
          <div className="flex items-center space-x-3 text-gray-700">
            <div className="bg-green-100 p-2 rounded-lg">
              <Shield className="h-4 w-4 text-green-600" />
            </div>
            <div>
              <p className="font-medium text-sm">Secure Authentication</p>
              <p className="text-xs text-gray-500">OTP-based login ensures your account security</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3 text-gray-700">
            <div className="bg-blue-100 p-2 rounded-lg">
              <Zap className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <p className="font-medium text-sm">Lightning Fast</p>
              <p className="text-xs text-gray-500">Get started in seconds with mobile verification</p>
            </div>
          </div>
        </div>

        {/* Alternative Login Option */}
        <div className="pt-6 border-t border-gray-200">
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-3">Are you an administrator?</p>
            <Button
              variant="outline"
              onClick={onShowTraditionalLogin}
              className="w-full border-2 border-gray-300 hover:border-blue-500 hover:bg-blue-50 transition-all duration-300"
            >
              Login with Email & Password
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default OTPLESSLogin; 