import { API_BASE_URL } from '../config/api';

export interface OTPLESSUserData {
  mobile: string;
  countryCode: string;
  name?: string;
  email?: string;
}

export interface OTPLESSResponse {
  status: string;
  token: string;
  userDetail?: OTPLESSUserData;
}

export interface TokenVerificationResponse {
  access_token: string;
  user: {
    id: string;
    mobile: string;
    name?: string;
    email?: string;
    role: 'admin' | 'student';
    profile_completed: boolean;
  };
}

export interface ProfileCompletionData {
  name: string;
  email: string;
  date_of_birth: string; // ISO date string (YYYY-MM-DD)
}

class OTPLESSService {
  private getHeaders(): HeadersInit {
    const token = localStorage.getItem('access_token');
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    
    return headers;
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    console.log(`🔍 Response Status: ${response.status} ${response.statusText}`);
    console.log(`🔍 Response Headers:`, Object.fromEntries(response.headers.entries()));
    
    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}`;
      let errorDetail = 'Unknown error';
      
      try {
        const errorData = await response.json();
        console.log(`❌ Error Response Data:`, errorData);
        errorDetail = errorData.detail || errorData.message || 'Unknown error';
        errorMessage = errorDetail;
      } catch (parseError) {
        console.log(`❌ Could not parse error response:`, parseError);
        const errorText = await response.text();
        console.log(`❌ Raw error response:`, errorText);
        errorDetail = errorText || `HTTP ${response.status}`;
        errorMessage = errorDetail;
      }
      
      if (response.status === 401) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
      
      throw new Error(errorMessage);
    }
    
    const responseData = await response.json();
    console.log(`✅ Success Response:`, responseData);
    return responseData;
  }

  /**
   * Verify OTPLESS token with backend and get user data
   */
  async verifyToken(token: string): Promise<TokenVerificationResponse> {
    console.log(`🔍 Verifying token with backend:`, {
      url: `${API_BASE_URL}/auth/otpless/verify`,
      tokenLength: token.length,
      tokenPreview: token.substring(0, 10) + '...'
    });
    
    const response = await fetch(`${API_BASE_URL}/auth/otpless/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    });
    
    return this.handleResponse(response);
  }

  /**
   * Check if email is pre-registered (PENDING status)
   */
  async checkEmailStatus(email: string): Promise<{
    is_pre_registered: boolean;
    status: 'invalid' | 'available' | 'pending' | 'taken';
    message?: string;
  }> {
    const response = await fetch(`${API_BASE_URL}/auth/otpless/check-email`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ email }),
    });
    
    return this.handleResponse(response);
  }

  /**
   * Complete user profile after first OTPLESS login
   */
  async completeProfile(data: ProfileCompletionData): Promise<{ success: boolean; user: any }> {
    const response = await fetch(`${API_BASE_URL}/auth/otpless/complete-profile`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });
    
    return this.handleResponse(response);
  }

  /**
   * Get current user (same as main API but for consistency)
   */
  async getCurrentUser() {
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: this.getHeaders(),
    });
    
    return this.handleResponse(response);
  }
}

export const otplessService = new OTPLESSService(); 