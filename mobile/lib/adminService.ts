import { apiRequest, ApiResponse } from "./apiClient";

export interface AdminStats {
  totalUsers: number;
  totalListings: number;
  totalOrders: number;
  totalRevenue: number;
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
  is_verified?: boolean;
  faculty?: string;
  rating?: number;
  total_sales?: number;
  active_listings?: number;
  created_at?: string;
}

export interface AdminListing {
  id: string;
  title: string;
  category?: string;
  type?: string;
  price?: number;
  is_verified?: boolean;
  is_available?: boolean;
  seller_name?: string;
  seller_email?: string;
  created_at?: string;
}

export async function getAdminStats(): Promise<ApiResponse<{ stats: AdminStats }>> {
  return apiRequest<{ stats: AdminStats }>("/admin/stats", {
    method: "GET",
    requiresAuth: true,
  });
}

export async function getAdminUsers(
  search?: string,
): Promise<ApiResponse<{ users: AdminUser[] }>> {
  const query = search ? `?search=${encodeURIComponent(search)}` : "";
  return apiRequest<{ users: AdminUser[] }>(`/admin/users${query}`, {
    method: "GET",
    requiresAuth: true,
  });
}

export async function verifyAdminUser(
  userId: string,
): Promise<ApiResponse<{ user: AdminUser }>> {
  return apiRequest<{ user: AdminUser }>(`/admin/users/${userId}/verify`, {
    method: "PUT",
    requiresAuth: true,
  });
}

export async function deleteAdminUser(userId: string): Promise<ApiResponse<unknown>> {
  return apiRequest(`/admin/users/${userId}`, {
    method: "DELETE",
    requiresAuth: true,
  });
}

export async function getAdminListings(): Promise<
  ApiResponse<{ listings: AdminListing[] }>
> {
  return apiRequest<{ listings: AdminListing[] }>("/admin/listings", {
    method: "GET",
    requiresAuth: true,
  });
}

export async function verifyAdminListing(
  listingId: string,
  listingType?: string,
): Promise<ApiResponse<{ listing: AdminListing }>> {
  const query = listingType
    ? `?type=${encodeURIComponent(listingType)}`
    : "";

  return apiRequest<{ listing: AdminListing }>(`/admin/listings/${listingId}/verify${query}`, {
    method: "PUT",
    requiresAuth: true,
  });
}
