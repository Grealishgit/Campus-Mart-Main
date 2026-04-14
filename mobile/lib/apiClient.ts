import AsyncStorage from "@react-native-async-storage/async-storage";

const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL;
const AUTH_TOKEN_KEY = "authToken";

type AuthTokenListener = (token: string | null) => void;
const authTokenListeners = new Set<AuthTokenListener>();

function notifyAuthTokenListeners(token: string | null) {
  authTokenListeners.forEach((listener) => listener(token));
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  body?: any;
  headers?: Record<string, string>;
  requiresAuth?: boolean;
}

/**
 * Generic API request handler with auth token support
 */
export async function apiRequest<T>(
  endpoint: string,
  options: RequestOptions = {},
): Promise<ApiResponse<T>> {
  const { method = "GET", body, headers = {}, requiresAuth = false } = options;

  try {
    // Get auth token if required
    let authToken = null;
    if (requiresAuth) {
      authToken = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
      if (!authToken) {
        return {
          success: false,
          error: "No authentication token found. Please log in.",
        };
      }
    }

    // Prepare headers
    const defaultHeaders: Record<string, string> = {
      "Content-Type": "application/json",
      ...headers,
    };

    if (authToken) {
      defaultHeaders["Authorization"] = `Bearer ${authToken}`;
    }

    // Build URL
    const url = `${API_BASE_URL}${endpoint}`;

    console.log(`[API] ${method} ${url}`);

    // Make request
    const response = await fetch(url, {
      method,
      headers: defaultHeaders,
      body: body ? JSON.stringify(body) : undefined,
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error:
          data.message || `HTTP ${response.status}: ${response.statusText}`,
        data: data as T,
      };
    }

    return {
      success: true,
      data: data.data || data,
      message: data.message,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";
    console.error(`[API Error] ${endpoint}:`, errorMessage);
    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Set auth token in AsyncStorage
 */
export async function setAuthToken(token: string) {
  try {
    await AsyncStorage.setItem(AUTH_TOKEN_KEY, token);
    notifyAuthTokenListeners(token);
  } catch (error) {
    console.error("Failed to save auth token:", error);
  }
}

/**
 * Get auth token from AsyncStorage
 */
export async function getAuthToken(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(AUTH_TOKEN_KEY);
  } catch (error) {
    console.error("Failed to get auth token:", error);
    return null;
  }
}

/**
 * Clear auth token from AsyncStorage
 */
export async function clearAuthToken() {
  try {
    await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
    notifyAuthTokenListeners(null);
  } catch (error) {
    console.error("Failed to clear auth token:", error);
  }
}

/**
 * Subscribe to token changes so navigation/auth state can react immediately.
 */
export function subscribeToAuthTokenChanges(listener: AuthTokenListener) {
  authTokenListeners.add(listener);
  return () => {
    authTokenListeners.delete(listener);
  };
}
