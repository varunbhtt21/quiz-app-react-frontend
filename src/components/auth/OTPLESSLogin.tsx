import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Shield, Zap, Smartphone, ArrowRight, Sparkles, CheckCircle, Users, BookOpen } from 'lucide-react';
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
  const [widgetVisible, setWidgetVisible] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    console.log("🚀 OTPLESS Login Component Mounted");
    loadOTPLESSSDK();

    return () => {
      cleanupOTPLESS();
    };
  }, []);

  const loadOTPLESSSDK = () => {
    // Remove any existing script first
    const existingScript = document.getElementById('otpless-sdk');
    if (existingScript) {
      existingScript.remove();
    }

    // Load OTPLESS SDK
    const script = document.createElement('script');
    script.id = 'otpless-sdk';
    script.type = 'text/javascript';
    script.src = 'https://otpless.com/v4/auth.js';
    script.setAttribute('data-appid', import.meta.env.VITE_OTPLESS_APP_ID || 'your_app_id_here');
    script.async = true;
    
    script.onload = () => {
      console.log("✅ OTPLESS SDK loaded successfully");
      setSdkLoaded(true);
      setupOTPLESSCallback();
      
      // Check if widget is visible after a short delay
      setTimeout(() => {
        const widget = document.querySelector('#otpless-login-page [data-otpless]') || 
                      document.querySelector('#otpless-login-page iframe') ||
                      document.querySelector('#otpless-login-page .otpless-widget');
        
        if (widget) {
          setWidgetVisible(true);
          console.log("✅ OTPless widget detected and visible");
        }
      }, 1000);
    };
    
    script.onerror = () => {
      console.error("❌ Failed to load OTPLESS SDK");
      toast({
        title: "Authentication Service Error",
        description: "Failed to load authentication service. Please refresh and try again.",
        variant: "destructive",
      });
    };
    
    document.head.appendChild(script);
  };

  const cleanupOTPLESS = () => {
    // Remove script
    const script = document.getElementById('otpless-sdk');
    if (script) {
      script.remove();
    }
    
    // Clear callback
    if (window.otpless) {
      delete window.otpless;
    }
    
    // Clear the widget container
    const container = document.getElementById('otpless-login-page');
    if (container) {
      container.innerHTML = '';
    }
  };

  const setupOTPLESSCallback = () => {
    const appId = import.meta.env.VITE_OTPLESS_APP_ID || 'your_app_id_here';
    
    if (appId === 'your_app_id_here') {
      toast({
        title: "Configuration Error", 
        description: "OTPLESS App ID not configured. Please check your environment variables.",
        variant: "destructive",
      });
      return;
    }

    console.log("🔧 Setting up OTPLESS callback with App ID:", appId);

    // Clear any existing callback
    if (window.otpless) {
      delete window.otpless;
    }

    // Set up the global callback function
    window.otpless = (otplessUser: any) => {
      console.log("🎯 OTPLESS Callback Received:", otplessUser);
      
      if (otplessUser.status === "SUCCESS" && otplessUser.token) {
        console.log("✅ Authentication successful, token received");
        
        // Clear the callback immediately after success
        if (window.otpless) {
          delete window.otpless;
        }
        
        handleAuthSuccess(otplessUser.token);
      } else {
        console.error("❌ Authentication failed:", otplessUser);
        toast({
          title: "Authentication Failed",
          description: otplessUser.errorMessage || "Please try again.",
          variant: "destructive",
        });
        setIsLoading(false);
      }
    };

    console.log("✅ OTPLESS callback setup complete");
  };

  const handleAuthSuccess = async (token: string) => {
    console.log("🚀 Processing authentication...");
    setIsLoading(true);
    
    try {
      const verificationResult = await otplessService.verifyToken(token);
      console.log("✅ Backend verification successful");
      
      toast({
        title: "Welcome to QuizMaster! 🎉",
        description: "Authentication successful. Setting up your account...",
      });

      // Small delay for state consistency
      await new Promise(resolve => setTimeout(resolve, 100));
      onLoginSuccess(verificationResult.access_token, verificationResult.user);
      
    } catch (error: any) {
      console.error('❌ Token verification failed:', error);
      setIsLoading(false);
      
      toast({
        title: "Verification Failed",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
      
      // Re-setup callback for retry
      setTimeout(() => {
        setupOTPLESSCallback();
      }, 1000);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <Card className="overflow-hidden border-0 shadow-2xl bg-white/95 backdrop-blur-lg">
        {/* Header */}
        <CardHeader className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 text-center pb-6">
          <div className="flex justify-center mb-4">
            <Badge className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 text-sm font-medium">
              <Sparkles className="h-4 w-4 mr-2" />
              Quick & Secure Login
            </Badge>
          </div>
          
          <CardTitle className="text-2xl md:text-3xl font-bold mb-3">
            <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Welcome to QuizMaster
            </span>
          </CardTitle>
          
          <CardDescription className="text-gray-600 text-base">
            Secure authentication with your mobile number
          </CardDescription>
        </CardHeader>

        <CardContent className="p-6 md:p-8">
          {/* OTPless Widget Container */}
          <div className="mb-8">
            <div 
              id="otpless-login-page"
              className={`relative transition-all duration-500 ${
                sdkLoaded && widgetVisible 
                  ? 'min-h-[300px]' 
                  : 'min-h-[200px] border-2 border-dashed border-gray-200 rounded-xl'
              }`}
            >
              {/* Loading State */}
              {!sdkLoaded && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="flex justify-center mb-4">
                      <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                    <p className="text-gray-600 font-medium">Loading Authentication</p>
                    <p className="text-gray-400 text-sm mt-1">Setting up secure login...</p>
                  </div>
                </div>
              )}

              {/* SDK Loaded but Widget Not Visible */}
              {sdkLoaded && !widgetVisible && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="flex justify-center mb-4">
                      <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                        <Shield className="h-6 w-6 text-green-600" />
                      </div>
                    </div>
                    <p className="text-green-700 font-medium">Authentication Ready</p>
                    <p className="text-gray-500 text-sm mt-2 max-w-xs">
                      If the login form doesn't appear, please refresh the page or check your connection.
                    </p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="mt-3"
                      onClick={() => window.location.reload()}
                    >
                      Refresh Page
                    </Button>
                  </div>
                </div>
              )}

              {/* Processing State */}
              {isLoading && (
                <div className="absolute inset-0 bg-white/90 backdrop-blur-sm flex items-center justify-center z-10">
                  <div className="text-center">
                    <div className="flex justify-center mb-4">
                      <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                    <p className="text-blue-700 font-medium">Verifying Authentication</p>
                    <p className="text-blue-600 text-sm mt-1">Please wait...</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Features Section */}
          <div className="space-y-4 mb-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <Shield className="h-4 w-4 text-green-600" />
                  </div>
                </div>
                <div>
                  <p className="text-green-800 font-medium text-sm">Secure</p>
                  <p className="text-green-600 text-xs">OTP-based authentication</p>
                </div>
              </div>

              <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Zap className="h-4 w-4 text-blue-600" />
                  </div>
                </div>
                <div>
                  <p className="text-blue-800 font-medium text-sm">Fast</p>
                  <p className="text-blue-600 text-xs">Login in seconds</p>
                </div>
              </div>
            </div>
          </div>

          {/* Admin Login Option */}
          <div className="pt-6 border-t border-gray-200">
            <div className="text-center">
              <p className="text-gray-600 text-sm mb-4">
                Need to access admin features?
              </p>
              <Button
                variant="outline"
                onClick={onShowTraditionalLogin}
                className="w-full border-2 border-gray-300 hover:border-orange-500 hover:bg-orange-50 transition-all duration-300 group"
              >
                <Shield className="h-4 w-4 mr-2 text-orange-500" />
                <span>Administrator Login</span>
                <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OTPLESSLogin; 