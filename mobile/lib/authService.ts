import {
  apiRequest,
  ApiResponse,
  clearAuthToken,
  getAuthToken,
  setAuthToken,
} from "./apiClient";

// ══════════════════════════════════════════════════════════════
// AUTH TYPES
// ══════════════════════════════════════════════════════════════

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  faculty?: string;
  graduation_year?: number;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  avatar_url?: string;
  is_verified?: boolean;
  faculty?: string;
  graduation_year?: number;
  rating?: number;
  created_at?: string;
}

export interface AuthResponse {
  success: boolean;
  token?: string;
  user?: User;
  message?: string;
}

// ══════════════════════════════════════════════════════════════
// AUTH SERVICES
// ══════════════════════════════════════════════════════════════

/**
 * Register a new user
 */
export async function registerUser(
  data: RegisterRequest,
): Promise<ApiResponse<AuthResponse>> {
  const response = await apiRequest<AuthResponse>("/auth/register", {
    method: "POST",
    body: data,
  });

  // Save token if registration successful
  if (response.success && response.data?.token) {
    await setAuthToken(response.data.token);
  }

  return response;
}

/**
 * Login user
 */
export async function loginUser(
  data: LoginRequest,
): Promise<ApiResponse<AuthResponse>> {
  const response = await apiRequest<AuthResponse>("/auth/login", {
    method: "POST",
    body: data,
  });

  // Save token if login successful
  if (response.success && response.data?.token) {
    await setAuthToken(response.data.token);
  }

  return response;
}

/**
 * Get current authenticated user
 */
export async function getCurrentUser(): Promise<ApiResponse<User>> {
  return apiRequest<User>("/auth/me", {
    method: "GET",
    requiresAuth: true,
  });
}

/**
 * Update user profile
 */
export async function updateProfile(
  data: Partial<User>,
  avatarFile?: File,
): Promise<ApiResponse<User>> {
  // Handle file upload separately if needed
  return apiRequest<User>("/auth/profile", {
    method: "PUT",
    body: data,
    requiresAuth: true,
  });
}

/**
 * Delete user account
 */
export async function deleteAccount(): Promise<ApiResponse<any>> {
  const response = await apiRequest("/auth/account", {
    method: "DELETE",
    requiresAuth: true,
  });

  // Clear token on successful deletion
  if (response.success) {
    await clearAuthToken();
  }

  return response;
}

/**
 * Logout user (clear local token)
 */
export async function logoutUser(): Promise<void> {
  await clearAuthToken();
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  const token = await getAuthToken();
  return !!token;
}

/**
 * Restore auth session on app start by validating the stored token
 * against backend protected route /api/auth/me.
 */
export async function initializeAuthSession(): Promise<boolean> {
  const token = await getAuthToken();

  if (!token) {
    return false;
  }

  const response = await apiRequest<{ user?: User }>("/auth/me", {
    method: "GET",
    requiresAuth: true,
  });

  if (response.success) {
    return true;
  }

  await clearAuthToken();
  return false;
}
