import { apiRequest, ApiResponse } from './apiClient';

// ══════════════════════════════════════════════════════════════
// ORDER TYPES
// ══════════════════════════════════════════════════════════════

export interface Order {
  id: string;
  listingId: string;
  buyerId: string;
  sellerId: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED' | 'COMPLETED';
  totalPrice: number;
  dueDate?: string;
  createdAt?: string;
  updatedAt?: string;
  listing?: {
    title: string;
    imageUrl?: string;
  };
}

export interface CreateOrderRequest {
  listingId: string;
  message?: string;
}

export interface OrdersResponse {
  orders?: Order[];
  data?: Order[];
}

// ══════════════════════════════════════════════════════════════
// ORDER SERVICES
// ══════════════════════════════════════════════════════════════

/**
 * Get all orders for current user
 */
export async function getOrders(
  status?: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED' | 'COMPLETED'
): Promise<ApiResponse<OrdersResponse>> {
  const endpoint = status ? `/orders?status=${status}` : '/orders';
  return apiRequest<OrdersResponse>(endpoint, {
    method: 'GET',
    requiresAuth: true,
  });
}

/**
 * Get a specific order
 */
export async function getOrder(orderId: string): Promise<ApiResponse<Order>> {
  return apiRequest<Order>(`/orders/${orderId}`, {
    method: 'GET',
    requiresAuth: true,
  });
}

/**
 * Create a new order (lease/purchase)
 */
export async function createOrder(data: CreateOrderRequest): Promise<ApiResponse<Order>> {
  return apiRequest<Order>('/orders', {
    method: 'POST',
    body: data,
    requiresAuth: true,
  });
}

/**
 * Update order status
 */
export async function updateOrderStatus(
  orderId: string,
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED' | 'COMPLETED'
): Promise<ApiResponse<Order>> {
  return apiRequest<Order>(`/orders/${orderId}`, {
    method: 'PUT',
    body: { status },
    requiresAuth: true,
  });
}

/**
 * Cancel an order
 */
export async function cancelOrder(orderId: string): Promise<ApiResponse<any>> {
  return apiRequest(`/orders/${orderId}/cancel`, {
    method: 'PUT',
    requiresAuth: true,
  });
}
