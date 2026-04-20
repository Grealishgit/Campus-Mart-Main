import { apiRequest, ApiResponse } from './apiClient';

export interface Order {
  id: string;
  listingId: string;
  buyerId: string;
  sellerId: string;
  type: 'SALE' | 'LEASE';
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  totalPrice: number;
  rate?: number;
  priceUnit?: string;
  leaseStart?: string;
  leaseEnd?: string;
  durationValue?: number;
  durationUnit?: string;
  createdAt?: string;
  updatedAt?: string;
  listing?: {
    title: string;
    imageUrl?: string;
    category?: string;
    location?: string;
  };
  buyer?: {
    name?: string;
    avatarUrl?: string;
  };
  seller?: {
    name?: string;
    avatarUrl?: string;
  };
}

export interface CreateOrderRequest {
  listingId: string;
  leaseStart?: string;
  leaseEnd?: string;
}

export interface OrdersResponse {
  orders?: Order[];
}

export async function getMyOrders(): Promise<ApiResponse<OrdersResponse>> {
  return apiRequest<OrdersResponse>('/orders/my', {
    method: 'GET',
    requiresAuth: true,
  });
}

export async function getSellingOrders(): Promise<ApiResponse<OrdersResponse>> {
  return apiRequest<OrdersResponse>('/orders/selling', {
    method: 'GET',
    requiresAuth: true,
  });
}

export async function createOrder(data: CreateOrderRequest): Promise<ApiResponse<{ order: Order }>> {
  return apiRequest<{ order: Order }>('/orders', {
    method: 'POST',
    body: {
      listing_id: Number(data.listingId),
      lease_start: data.leaseStart,
      lease_end: data.leaseEnd,
    },
    requiresAuth: true,
  });
}

export async function updateOrderStatus(
  orderId: string,
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled'
): Promise<ApiResponse<{ order: Order }>> {
  return apiRequest<{ order: Order }>(`/orders/${orderId}/status`, {
    method: 'PUT',
    body: { status },
    requiresAuth: true,
  });
}
