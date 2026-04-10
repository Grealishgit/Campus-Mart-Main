import { apiRequest, ApiResponse } from './apiClient';

// ══════════════════════════════════════════════════════════════
// FAVORITES TYPES
// ══════════════════════════════════════════════════════════════

export interface Favorite {
  id: string;
  listingId: string;
  userId: string;
  createdAt?: string;
}

export interface FavoritesResponse {
  favorites?: Favorite[];
  data?: Favorite[];
}

// ══════════════════════════════════════════════════════════════
// FAVORITES SERVICES
// ══════════════════════════════════════════════════════════════

/**
 * Get all favorite listings of current user
 */
export async function getFavorites(): Promise<ApiResponse<FavoritesResponse>> {
  return apiRequest<FavoritesResponse>('/favorites', {
    method: 'GET',
    requiresAuth: true,
  });
}

/**
 * Add listing to favorites
 */
export async function addFavorite(listingId: string): Promise<ApiResponse<Favorite>> {
  return apiRequest<Favorite>('/favorites', {
    method: 'POST',
    body: { listingId },
    requiresAuth: true,
  });
}

/**
 * Remove listing from favorites
 */
export async function removeFavorite(listingId: string): Promise<ApiResponse<any>> {
  return apiRequest(`/favorites/${listingId}`, {
    method: 'DELETE',
    requiresAuth: true,
  });
}

/**
 * Check if listing is favorited
 */
export async function isFavorited(listingId: string): Promise<boolean> {
  const response = await getFavorites();
  if (response.success && response.data?.favorites) {
    return response.data.favorites.some(fav => fav.listingId === listingId);
  }
  return false;
}
