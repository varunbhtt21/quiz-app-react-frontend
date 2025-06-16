# Deployment Configuration

## API URL Configuration

The frontend now uses environment-based API configuration that works in both development and production.

### Development (Local)
- No configuration needed
- Automatically uses `http://localhost:8000`

### Production Deployment

#### 1. Set Environment Variable
Create a `.env` file or set environment variable:
```bash
VITE_API_BASE_URL=https://your-backend-url.onrender.com
```

#### 2. For Vercel/Netlify
Add environment variable in your deployment platform:
- **Variable Name**: `VITE_API_BASE_URL`
- **Value**: `https://your-backend-url.onrender.com`

#### 3. For Docker
```bash
docker build --build-arg VITE_API_BASE_URL=https://your-backend-url.onrender.com .
```

## Updated Files
- ✅ `src/config/api.ts` - Centralized API configuration
- ✅ `src/services/api.ts` - Uses config instead of hardcoded URL
- ✅ `src/pages/student/ContestTaking.tsx` - Dynamic image URLs
- ✅ `src/pages/admin/MCQList.tsx` - Dynamic image URLs  
- ✅ `src/pages/admin/EditMCQ.tsx` - Dynamic image URLs

## Benefits
- 🎯 Single place to change API URL
- 🚀 Environment-specific configuration
- 📦 Production-ready deployment
- �� Easy to maintain 