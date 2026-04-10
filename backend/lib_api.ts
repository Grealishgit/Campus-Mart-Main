// ============================================================
// lib/api.ts
// Drop this file into your mobile/lib/ folder
// Replace BASE_URL with your machine's local IP when testing
// on a physical device
// ============================================================

import AsyncStorage from '@react-native-async-storage/async-storage';

// ⚠️ Change this to your machine's IP when testing on a real device
// Android emulator: http://10.0.2.2:5000/api
// Physical device:  http://192.168.x.x:5000/api
export const BASE_URL = 'http://10.0.2.2:5000/api';

// ── Token helpers ────────────────────────────────────────────
export const saveToken = async (token: string) => {
  await AsyncStorage.setItem('campus_mart_token', token);
};

export const getToken = async (): Promise<string | null> => {
  return await AsyncStorage.getItem('campus_mart_token');
};

export const removeToken = async () => {
  await AsyncStorage.removeItem('campus_mart_token');
};

// ── Base fetch wrapper ───────────────────────────────────────
const request = async (
  endpoint: string,
  options: RequestInit = {},
  requiresAuth = false
) => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (requiresAuth) {
    const token = await getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Something went wrong');
  }

  return data;
};

// ── Auth API ─────────────────────────────────────────────────
export const authAPI = {
  register: (body: {
    name: string;
    email: string;
    password: string;
    role?: string;
    faculty?: string;
    graduation_year?: number;
  }) => request('/auth/register', { method: 'POST', body: JSON.stringify(body) }),

  login: (email: string, password: string) =>
    request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),

  getMe: () => request('/auth/me', {}, true),

  updateProfile: async (formData: FormData) => {
    const token = await getToken();
    const response = await fetch(`${BASE_URL}/auth/profile`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    return response.json();
  },

  deleteAccount: () => request('/auth/account', { method: 'DELETE' }, true),
};

// ── Listings API ─────────────────────────────────────────────
export const listingsAPI = {
  getAll: (params?: {
    type?: 'SALE' | 'LEASE';
    category?: string;
    search?: string;
    minPrice?: number;
    maxPrice?: number;
    page?: number;
    limit?: number;
  }) => {
    const query = new URLSearchParams(params as any).toString();
    return request(`/listings${query ? `?${query}` : ''}`);
  },

  getById: (id: string) => request(`/listings/${id}`),

  getMy: () => request('/listings/my', {}, true),

  getCategories: () => request('/listings/categories'),

  create: async (formData: FormData) => {
    const token = await getToken();
    const response = await fetch(`${BASE_URL}/listings`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    return response.json();
  },

  update: async (id: string, formData: FormData) => {
    const token = await getToken();
    const response = await fetch(`${BASE_URL}/listings/${id}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    return response.json();
  },

  delete: (id: string) => request(`/listings/${id}`, { method: 'DELETE' }, true),
};

// ── Favorites API ─────────────────────────────────────────────
export const favoritesAPI = {
  getAll: () => request('/favorites', {}, true),
  add: (listingId: string) => request(`/favorites/${listingId}`, { method: 'POST' }, true),
  remove: (listingId: string) => request(`/favorites/${listingId}`, { method: 'DELETE' }, true),
};

// ── Orders API ────────────────────────────────────────────────
export const ordersAPI = {
  create: (body: { listing_id: number; lease_start?: string; lease_end?: string }) =>
    request('/orders', { method: 'POST', body: JSON.stringify(body) }, true),

  getMy: () => request('/orders/my', {}, true),
  getSelling: () => request('/orders/selling', {}, true),

  updateStatus: (id: string, status: string) =>
    request(`/orders/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) }, true),
};

// ── Chats API ─────────────────────────────────────────────────
export const chatsAPI = {
  getConversations: () => request('/chats', {}, true),

  start: (listing_id: number) =>
    request('/chats/start', { method: 'POST', body: JSON.stringify({ listing_id }) }, true),

  getMessages: (conversationId: string) =>
    request(`/chats/${conversationId}/messages`, {}, true),

  sendMessage: (conversationId: string, text: string) =>
    request(`/chats/${conversationId}/messages`, { method: 'POST', body: JSON.stringify({ text }) }, true),
};
