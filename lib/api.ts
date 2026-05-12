// ==========================
// Unified API (COOKIE BASED)
// ==========================

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";

const TOKEN_KEY = "adminToken";

// ----------------------
// TOKEN (COOKIE BASED)
// ----------------------

export const getToken = (): string => {
  if (typeof window === "undefined") return "";

  // Pehle cookie check karo
  const cookieMatch = document.cookie.match(
    new RegExp("(^| )" + TOKEN_KEY + "=([^;]+)")
  );
  if (cookieMatch) return cookieMatch[2];

  // Phir localStorage check karo
  return localStorage.getItem(TOKEN_KEY) || "";
};

export const setToken = (token: string): void => {
  if (typeof window !== "undefined") {
    // Cookie mein save karo
    document.cookie = `${TOKEN_KEY}=${token}; path=/; max-age=86400`;
    // LocalStorage mein bhi save karo
    localStorage.setItem(TOKEN_KEY, token);
  }
};

export const removeToken = (): void => {
  if (typeof window !== "undefined") {
    document.cookie = `${TOKEN_KEY}=; path=/; max-age=0`;
  }
};

export const isLoggedIn = (): boolean => {
  return !!getToken();
};

// ----------------------
// AUTH FETCH
// ----------------------

export const authFetch = async <T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> => {
  const token = getToken();
  
  console.log("🔑 authFetch token:", token ? token.substring(0, 20) + "..." : "NULL!")

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${BACKEND_URL}${endpoint}`, {
    ...options,
    credentials: "include",
    headers,
  });

  const data = await res.json();
  return data;
};
// ----------------------
// FORM DATA
// ----------------------

export const authFormDataFetch = async <T = any>(
  endpoint: string,
  formData: FormData
): Promise<T> => {
  const token = getToken();

  const res = await fetch(`${BACKEND_URL}${endpoint}`, {
    method: "POST",
    headers: {
      Authorization: token ? `Bearer ${token}` : "",
    },
    body: formData,
  });

  return res.json();
};

// ----------------------
// CUSTOMER QUERIES API
// ----------------------

export const getCustomerQueries = async <T = any>(
  status?: string,
  page: number = 1,
  limit: number = 20
): Promise<T> => {
  const params = new URLSearchParams();
  if (status) params.append('status', status);
  params.append('page', page.toString());
  params.append('limit', limit.toString());

  return authFetch(`/api/contact/all?${params.toString()}`);
};

export const getCustomerQueryById = async <T = any>(id: string): Promise<T> => {
  return authFetch(`/api/contact/${id}`);
};

export const updateQueryStatus = async <T = any>(
  id: string,
  status: string
): Promise<T> => {
  return authFetch(`/api/contact/${id}/status`, {
    method: 'PUT',
    body: JSON.stringify({ status }),
  });
};

export const deleteCustomerQuery = async <T = any>(id: string): Promise<T> => {
  return authFetch(`/api/contact/${id}`, {
    method: 'DELETE',
  });
};

export const replyToCustomerQuery = async <T = any>(
  id: string,
  reply: string
): Promise<T> => {
  return authFetch(`/api/contact/${id}/reply`, {
    method: 'POST',
    body: JSON.stringify({ reply }),
  });
};

export const updateCustomerQueryReply = async <T = any>(
  id: string,
  reply: string
): Promise<T> => {
  return authFetch(`/api/contact/${id}/reply`, {
    method: 'PUT',
    body: JSON.stringify({ reply }),
  });
};

export const getCustomerQueryStats = async <T = any>(): Promise<T> => {
  return authFetch('/api/contact/stats');
};

export default {
  getToken,
  setToken,
  removeToken,
  isLoggedIn,
  authFetch,
  authFormDataFetch,
  getCustomerQueries,
  getCustomerQueryById,
  updateQueryStatus,
  deleteCustomerQuery,
  replyToCustomerQuery,
  updateCustomerQueryReply,
  getCustomerQueryStats,
  BACKEND_URL,
};