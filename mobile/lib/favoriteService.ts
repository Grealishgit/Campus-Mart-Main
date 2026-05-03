import { apiRequest, ApiResponse } from './apiClient';

export interface Favorite {
  favoriteId: string;
  listingId: string;
  type: 'SALE' | 'LEASE';
  title: string;
  price: number;
  priceUnit?: string;
  category: string;
  condition: string;
  location: string;
  imageUrl?: string;
  description: string;
  isVerified: boolean;
  favoritedAt: string;
  availableFrom?: string;
  availableUntil?: string;
  seller: {
    role?: string;
    name: string;
    rating: number;
    avatarUrl?: string;
    isVerified: boolean;
  };
}

export interface FavoritesResponse {
  favorites?: Favorite[];
}

export async function getFavorites(): Promise<ApiResponse<FavoritesResponse>> {
  return apiRequest<FavoritesResponse>('/favorites', {
    method: 'GET',
    requiresAuth: true,
  });
}

// type must be 'sale' or 'lease' (lowercase — matches backend route param)
export async function addFavorite(
  listingId: string,
  type: 'SALE' | 'LEASE',
): Promise<ApiResponse<any>> {
  return apiRequest(`/favorites/${type.toLowerCase()}/${listingId}`, {
    method: 'POST',
    requiresAuth: true,
  });
}

export async function removeFavorite(
  listingId: string,
  type: 'SALE' | 'LEASE',
): Promise<ApiResponse<any>> {
  return apiRequest(`/favorites/${type.toLowerCase()}/${listingId}`, {
    method: 'DELETE',
    requiresAuth: true,
  });
}

export async function isFavorited(
  listingId: string,
): Promise<boolean> {
  const response = await getFavorites();
  if (response.success && response.data?.favorites) {
    return response.data.favorites.some(fav => fav.listingId === listingId);
  }
  return false;
}