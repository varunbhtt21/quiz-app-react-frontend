// API Configuration
const getApiBaseUrl = (): string => {
  // Check for environment variable first (for production)
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }
  
  // Fallback to localhost for development
  return 'http://localhost:8000';
};

export const API_BASE_URL = `${getApiBaseUrl()}/api`;
export const API_SERVER_URL = getApiBaseUrl();

// For debugging
console.log('API Configuration:', {
  API_BASE_URL,
  API_SERVER_URL,
  VITE_API_BASE_URL: import.meta.env.VITE_API_BASE_URL,
}); 