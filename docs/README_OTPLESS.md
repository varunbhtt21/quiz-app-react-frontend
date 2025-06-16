# OTPLESS Authentication Integration

## 📱 Overview

This React frontend now supports **OTPLESS authentication** as the primary login method for students, while maintaining traditional email/password authentication for administrators.

## 🚀 Features

- **Mobile-first Authentication**: Students login with mobile number via OTP
- **Profile Completion Flow**: New users must provide name and email after first login
- **Dual Authentication Support**: Admins can still use email/password
- **Secure Token Management**: JWT tokens with automatic refresh
- **Responsive Design**: Works seamlessly on mobile and desktop

## 🛠️ Setup Instructions

### 1. Install Dependencies

The required packages are already installed:
```bash
npm install otpless-sdk  # Already in package.json
```

### 2. Environment Configuration

Create a `.env` file in the frontend root:

```bash
cp env.example .env
```

Configure the following variables:

```env
# API Configuration
VITE_API_BASE_URL=http://localhost:8000

# OTPLESS Configuration
VITE_OTPLESS_APP_ID=your_actual_app_id_here
```

### 3. Get OTPLESS Credentials

1. Visit [OTPLESS Dashboard](https://otpless.com/dashboard)
2. Create a new app or use existing one
3. Copy your **App ID**
4. Update the `.env` file with your actual App ID

### 4. Backend Setup

Ensure your backend has OTPLESS environment variables configured:

```env
OTPLESS_APP_ID=your_app_id_here
OTPLESS_CLIENT_ID=your_client_id_here
OTPLESS_CLIENT_SECRET=your_client_secret_here
```

## 🔄 Authentication Flow

### For Students (OTPLESS)

1. **Login Page**: User sees mobile login as primary option
2. **Mobile Verification**: Enter mobile number → receive OTP
3. **Token Verification**: Frontend sends OTPLESS token to backend
4. **Profile Check**: Backend checks if profile is complete
5. **Profile Completion** (if needed): User provides name and email
6. **Dashboard Access**: User redirected to student dashboard

### For Administrators (Traditional)

1. **Login Page**: Click "Login with Email & Password"
2. **Credentials**: Enter email and password
3. **Dashboard Access**: Redirect to admin dashboard

## 📁 File Structure

```
src/
├── components/
│   └── auth/
│       ├── LoginPage.tsx          # Updated with OTPLESS integration
│       ├── OTPLESSLogin.tsx       # OTPLESS login component
│       └── ProfileCompletion.tsx  # Profile completion form
├── context/
│   └── AuthContext.tsx           # Updated with OTPLESS support
├── services/
│   ├── api.ts                    # Existing API service
│   └── otpless.ts               # New OTPLESS service
└── components/common/
    └── ProtectedRoute.tsx        # Updated with profile completion check
```

## 🔧 Configuration Options

### OTPLESS Component Props

```typescript
interface OTPLESSLoginProps {
  onLoginSuccess: (token: string, userData: any) => void;
  onShowTraditionalLogin: () => void;
}
```

### Profile Completion Props

```typescript
interface ProfileCompletionProps {
  userData: {
    mobile: string;
    name?: string;
    email?: string;
  };
  onProfileComplete: (updatedUser: any) => void;
}
```

## 🎨 UI/UX Features

### Modern Design Elements
- **Gradient backgrounds** with animated elements
- **Loading states** with spinners and skeleton screens
- **Toast notifications** for user feedback
- **Form validation** with real-time error display
- **Responsive layouts** for all screen sizes

### Accessibility
- **ARIA labels** for screen readers
- **Keyboard navigation** support
- **High contrast** color schemes
- **Focus indicators** for all interactive elements

## 🔒 Security Features

### Frontend Security
- **Environment variable protection** (VITE_ prefix)
- **Token storage** in localStorage with automatic cleanup
- **XSS protection** through React's built-in sanitization
- **Route protection** with authentication checks

### Backend Integration
- **OTPLESS token verification** via secure backend API
- **JWT token generation** with role-based claims
- **Profile completion validation** server-side
- **Rate limiting** on authentication endpoints

## 🐛 Troubleshooting

### Common Issues

#### 1. OTPLESS SDK Loading Failed
```bash
Error: Failed to load OTPLESS SDK
```
**Solution**: Check internet connection and OTPLESS service status

#### 2. Invalid App ID
```bash
Error: Invalid app configuration
```
**Solution**: Verify `VITE_OTPLESS_APP_ID` in `.env` file

#### 3. Backend Connection Failed
```bash
Error: Network request failed
```
**Solution**: Ensure backend is running and `VITE_API_BASE_URL` is correct

#### 4. Profile Completion Stuck
```bash
Error: Profile completion failed
```
**Solution**: Check backend logs and ensure all required fields are provided

### Debug Mode

Enable debug logging by adding to your `.env`:

```env
VITE_NODE_ENV=development
```

### Network Issues

If experiencing network issues:

1. Check backend server status
2. Verify CORS configuration
3. Test API endpoints directly
4. Check browser console for errors

## 📊 Testing

### Manual Testing Checklist

#### OTPLESS Flow
- [ ] Mobile login button appears
- [ ] SDK loads successfully
- [ ] OTP verification works
- [ ] Profile completion shows for new users
- [ ] Dashboard redirect works after completion

#### Traditional Login
- [ ] Admin login toggle works
- [ ] Email/password validation
- [ ] Admin dashboard access
- [ ] Error handling for invalid credentials

#### Edge Cases
- [ ] Network disconnection during login
- [ ] Invalid/expired tokens
- [ ] Profile completion with existing email
- [ ] Multiple tab behavior

### Browser Support

Tested on:
- ✅ Chrome 120+
- ✅ Firefox 115+
- ✅ Safari 16+
- ✅ Edge 120+
- ✅ Mobile Safari (iOS 15+)
- ✅ Chrome Mobile (Android 10+)

## 🚀 Deployment

### Environment Variables

Set the following in your production environment:

```env
VITE_API_BASE_URL=https://your-api-domain.com
VITE_OTPLESS_APP_ID=your_production_app_id
```

### Build Process

```bash
npm run build
```

### Production Checklist

- [ ] Update OTPLESS App ID for production
- [ ] Configure production API URL
- [ ] Test all authentication flows
- [ ] Verify SSL certificates
- [ ] Check CORS configuration
- [ ] Monitor error logs

## 📝 API Integration

### Backend Endpoints Used

```typescript
// OTPLESS Authentication
POST /api/otpless/verify-token
POST /api/otpless/complete-profile

// Traditional Authentication
POST /api/auth/login
GET /api/auth/me
```

### Request/Response Examples

#### Token Verification
```typescript
// Request
POST /api/otpless/verify-token
{
  "token": "otpless_jwt_token_here"
}

// Response
{
  "access_token": "jwt_token",
  "user": {
    "id": "user_id",
    "mobile": "+1234567890",
    "role": "student",
    "profile_completed": false
  }
}
```

#### Profile Completion
```typescript
// Request
POST /api/otpless/complete-profile
{
  "name": "John Doe",
  "email": "john@example.com"
}

// Response
{
  "success": true,
  "user": {
    "id": "user_id",
    "name": "John Doe",
    "email": "john@example.com",
    "mobile": "+1234567890",
    "profile_completed": true
  }
}
```

## 🔄 Migration Guide

### From Traditional to OTPLESS

1. **Backup existing user data**
2. **Run database migration** (already completed)
3. **Update environment variables**
4. **Test authentication flows**
5. **Deploy frontend and backend together**

### Rollback Plan

If you need to rollback:

1. **Restore backup database**
2. **Revert environment variables**
3. **Deploy previous frontend version**
4. **Verify traditional login works**

## 📞 Support

For implementation support:

- **Backend Issues**: Check `quiz-app-backend/README.md`
- **OTPLESS Integration**: Visit [OTPLESS Documentation](https://otpless.com/docs)
- **React Issues**: Check component logs and error boundaries

## 🔗 Related Documentation

- [Backend OTPLESS Setup](../quiz-app-backend/README.md)
- [Database Migration Guide](../quiz-app-backend/migrate_to_otpless.py)
- [Environment Configuration](../quiz-app-backend/otpless_env_template.txt) 