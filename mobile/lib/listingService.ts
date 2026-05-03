import { apiRequest, ApiResponse } from './apiClient';

// ══════════════════════════════════════════════════════════════
// LISTING TYPES
// ══════════════════════════════════════════════════════════════

export interface Listing {
  id: string;
  title: string;
  description: string;
  price: number;
  priceUnit?: string;
  minDuration?: number;
  maxDuration?: number;
  durationUnit?: string;
  availableFrom?: string;
  availableUntil?: string;
  type: 'SALE' | 'LEASE';
  category: string;
  condition?: string;
  location: string;
  distance?: number | string;
  imageUrl?: string;
  images?: string[];
  userId: string;
  sellerRole?: string;
  sellerName?: string;  
  sellerRating?: number;
  sellerAvatar?: string;
  sellerVerified?: boolean;
  isVerified?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export type ListingType = 'SALE' | 'LEASE';

export interface CreateListingRequest {
  title: string;
  description: string;
  price: number;
  price_unit?: string;
  min_duration?: number;
  max_duration?: number;
  duration_unit?: string;
  available_from?: string;
  available_until?: string;
  type: 'SALE' | 'LEASE';
  category: string;
  condition: string;
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

export interface ConditionsResponse {
  conditions?: string[];
  data?: string[];
}

export interface CreateListingResponse {
  listing?: Listing;
  message?: string;
}

export interface VendorStoreSeller {
  id: string;
  name: string;
  email?: string;
  role: string;
  avatar_url?: string;
  is_verified?: boolean;
  location?: string;
  rating?: number;
  total_sales?: number;
  active_listings?: number;
  created_at?: string;
}

export interface VendorStoreResponse {
  seller: VendorStoreSeller;
  listings: Listing[];
  stats?: {
    totalListings?: number;
    averageRating?: number;
    totalSales?: number;
  };
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
    type?: ListingType;
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
export async function getListingById(
  id: string,
  type?: ListingType,
): Promise<ApiResponse<Listing>> {
  const query = type ? `?type=${type}` : '';

  return apiRequest<Listing>(`/listings/${id}${query}`, {
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
 * Get vendor profile + active listings for vendor store page
 */
export async function getVendorStore(
  sellerId: string,
): Promise<ApiResponse<VendorStoreResponse>> {
  const response = await apiRequest<any>(`/listings/store/${sellerId}`, {
    method: 'GET',
  });

  if (!response.success || !response.data) {
    return response;
  }

  const store = response.data.store ?? response.data;
  return {
    ...response,
    data: store,
  };
}



/**
 * Create a new listing
 */
export async function createListing(data: CreateListingRequest): Promise<ApiResponse<CreateListingResponse>> {
  return apiRequest<CreateListingResponse>('/listings', {
    method: 'POST',
    body: data,
    requiresAuth: true,
  });
}

/**
 * Update a listing
 */
export async function updateListing(
  id: string,
  data: Partial<CreateListingRequest>,
  type?: ListingType,
): Promise<ApiResponse<Listing>> {
  const query = type ? `?type=${type}` : '';

  return apiRequest<Listing>(`/listings/${id}${query}`, {
    method: 'PUT',
    body: data,
    requiresAuth: true,
  });
}

/**
 * Delete a listing
 */
export async function deleteListing(
  id: string,
  type?: ListingType,
): Promise<ApiResponse<any>> {
  const query = type ? `?type=${type}` : '';

  return apiRequest(`/listings/${id}${query}`, {
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

/**
 * Get all available item conditions
 */
export async function getConditions(): Promise<ApiResponse<ConditionsResponse>> {
  return apiRequest<ConditionsResponse>('/listings/conditions', {
    method: 'GET',
  });
}
