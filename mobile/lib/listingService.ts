import { apiRequest, ApiResponse } from './apiClient';

// ══════════════════════════════════════════════════════════════
// LISTING TYPES
// ══════════════════════════════════════════════════════════════

export interface Listing {
  id: string;
  title: string;
  description: string;
  price: number;
  priceUnit?: 'KES' | 'USD'; // Currency
  type: 'SELLING' | 'BUYING' | 'LEASING';
  category: string;
  condition?: 'NEW' | 'LIKE_NEW' | 'GOOD' | 'FAIR';
  location: string;
  distance?: number;
  imageUrl?: string;
  images?: string[];
  userId: string;
  sellerName?: string;  
  sellerRating?: number;
  sellerAvatar?: string;
  sellerVerified?: boolean;
  isVerified?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateListingRequest {
  title: string;
  description: string;
  price: number;
  priceUnit?: 'KES' | 'USD';
  type: 'SELLING' | 'BUYING' | 'LEASING';
  category: string;
  condition?: 'NEW' | 'LIKE_NEW' | 'GOOD' | 'FAIR';
  location: string;
}

export interface ListingsResponse {
  listings?: Listing[];
  data?: Listing[];
  total?: number;
  page?: number;
  limit?: number;
}

export interface CategoriesResponse {
  categories?: string[];
  data?: string[];
}

// ══════════════════════════════════════════════════════════════
// LISTING SERVICES
// ══════════════════════════════════════════════════════════════

/**
 * Get all listings with optional filtering
 */
export async function getAllListings(
  filters?: {
    category?: string;
    type?: 'SELLING' | 'BUYING' | 'LEASING';
    minPrice?: number;
    maxPrice?: number;
    search?: string;
    page?: number;
    limit?: number;
  }
): Promise<ApiResponse<ListingsResponse>> {
  // Build query string
  const params = new URLSearchParams();
  if (filters?.category) params.append('category', filters.category);
  if (filters?.type) params.append('type', filters.type);
  if (filters?.minPrice !== undefined) params.append('minPrice', String(filters.minPrice));
  if (filters?.maxPrice !== undefined) params.append('maxPrice', String(filters.maxPrice));
  if (filters?.search) params.append('search', filters.search);
  if (filters?.page) params.append('page', String(filters.page));
  if (filters?.limit) params.append('limit', String(filters.limit));

  const queryString = params.toString();
  const endpoint = `/listings${queryString ? '?' + queryString : ''}`;

  return apiRequest<ListingsResponse>(endpoint, {
    method: 'GET',
  });
}

/**
 * Get listing by ID
 */
export async function getListingById(id: string): Promise<ApiResponse<Listing>> {
  return apiRequest<Listing>(`/listings/${id}`, {
    method: 'GET',
  });
}

/**
 * Get all listings of current user
 */
export async function getMyListings(): Promise<ApiResponse<ListingsResponse>> {
  return apiRequest<ListingsResponse>('/listings/my', {
    method: 'GET',
    requiresAuth: true,
  });
}

/**
 * Create a new listing
 */
export async function createListing(data: CreateListingRequest): Promise<ApiResponse<Listing>> {
  return apiRequest<Listing>('/listings', {
    method: 'POST',
    body: data,
    requiresAuth: true,
  });
}

/**
 * Update a listing
 */
export async function updateListing(id: string, data: Partial<CreateListingRequest>): Promise<ApiResponse<Listing>> {
  return apiRequest<Listing>(`/listings/${id}`, {
    method: 'PUT',
    body: data,
    requiresAuth: true,
  });
}

/**
 * Delete a listing
 */
export async function deleteListing(id: string): Promise<ApiResponse<any>> {
  return apiRequest(`/listings/${id}`, {
    method: 'DELETE',
    requiresAuth: true,
  });
}

/**
 * Get all available categories
 */
export async function getCategories(): Promise<ApiResponse<CategoriesResponse>> {
  return apiRequest<CategoriesResponse>('/listings/categories', {
    method: 'GET',
  });
}
