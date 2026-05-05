// API utility with proper authentication and error handling

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";

// Get token from localStorage
export const getToken = (): string => {
  if (typeof window === 'undefined') return '';
  const token = localStorage.getItem('adminToken');
  console.log('🔐 getToken - Token found:', !!token);
  console.log('🔐 getToken - Token value:', token ? `${token.substring(0, 20)}...` : 'null');
  return token || '';
};

// Redirect to login on auth failure
export const handleAuthError = () => {
  console.log('❌ Auth error - Redirecting to login...');
  if (typeof window !== 'undefined') {
    localStorage.removeItem('adminToken');
    // Clear all cookies
    document.cookie.split(";").forEach((c) => {
      document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
    });
    // Redirect to login
    window.location.href = '/login';
  }
};

// Generic fetch wrapper with auth
export const authFetch = async (
  endpoint: string,
  options: RequestInit = {}
): Promise<any> => {
  const url = `${BACKEND_URL}${endpoint}`;
  const token = getToken();
  
  console.log('📡 API Request:', { url, hasToken: !!token });
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  
  // Add authorization header
  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
    console.log('🔐 Added Bearer token to request');
  }
  
  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });
    
    console.log('📡 API Response status:', response.status);
    
    const data = await response.json();
    
    // Handle authentication errors
    if (response.status === 401 || response.status === 403) {
      console.error('❌ Auth error:', data.message);
      handleAuthError();
      throw new Error(data.message || 'Authentication failed');
    }
    
    if (!response.ok) {
      console.error('❌ API Error:', data.message);
      throw new Error(data.message || 'Request failed');
    }
    
    console.log('✅ API Success:', data);
    return data;
  } catch (error: any) {
    console.error('❌ API Request failed:', error.message);
    
    // Handle network errors
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new Error('Cannot connect to server. Please check if backend is running.');
    }
    
    throw error;
  }
};

// Convenience methods
export const api = {
  get: (endpoint: string) => authFetch(endpoint, { method: 'GET' }),
  post: (endpoint: string, body: any) => authFetch(endpoint, {
    method: 'POST',
    body: JSON.stringify(body),
  }),
  put: (endpoint: string, body: any) => authFetch(endpoint, {
    method: 'PUT',
    body: JSON.stringify(body),
  }),
  delete: (endpoint: string) => authFetch(endpoint, { method: 'DELETE' }),
};

// Check if user is logged in
export const isLoggedIn = (): boolean => {
  const token = getToken();
  if (!token) return false;
  
  // Check if token is expired (basic check)
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const isExpired = payload.exp * 1000 < Date.now();
    if (isExpired) {
      console.log('❌ Token expired');
      handleAuthError();
      return false;
    }
    return true;
  } catch {
    console.log('❌ Invalid token format');
    handleAuthError();
    return false;
  }
};

// Login function
export const login = async (email: string, password: string): Promise<boolean> => {
  console.log('🔐 Attempting login...');
  
  try {
    const response = await fetch(`${BACKEND_URL}/api/user/admin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    
    const data = await response.json();
    
    if (data.success) {
      console.log('✅ Login successful');
      localStorage.setItem('adminToken', data.token);
      document.cookie = `adminToken=${data.token}; path=/; max-age=86400`;
      return true;
    } else {
      console.error('❌ Login failed:', data.message);
      return false;
    }
  } catch (error: any) {
    console.error('❌ Login error:', error.message);
    return false;
  }
};

// Logout function
export const logout = () => {
  console.log('🔐 Logging out...');
  localStorage.removeItem('adminToken');
  document.cookie.split(";").forEach((c) => {
    document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
  });
  if (typeof window !== 'undefined') {
    window.location.href = '/login';
  }
};