import { apiRequest, ApiResponse } from './apiClient';

// ══════════════════════════════════════════════════════════════
// CHAT TYPES
// ══════════════════════════════════════════════════════════════

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  text: string;
  timestamp: string;
  read?: boolean;
}

export interface Conversation {
  id: string;
  participant: {
    name: string;
    avatarUrl?: string;
    isOnline?: boolean;
    isStore?: boolean;
  };
  lastMessage: string;
  timestamp: string;
  unreadCount?: number;
  listingThumb?: string;
  type?: 'BUYING' | 'SELLING' | 'LEASING';
}

export interface ConversationsResponse {
  conversations?: Conversation[];
  data?: Conversation[];
}

// ══════════════════════════════════════════════════════════════
// CHAT SERVICES
// ══════════════════════════════════════════════════════════════

/**
 * Get all conversations for current user
 */
export async function getConversations(): Promise<ApiResponse<ConversationsResponse>> {
  return apiRequest<ConversationsResponse>('/chats', {
    method: 'GET',
    requiresAuth: true,
  });
}

/**
 * Get messages for a specific conversation
 */
export async function getConversationMessages(conversationId: string): Promise<ApiResponse<{ messages: Message[] }>> {
  return apiRequest<{ messages: Message[] }>(`/chats/${conversationId}`, {
    method: 'GET',
    requiresAuth: true,
  });
}

/**
 * Send a message in a conversation
 */
export async function sendMessage(conversationId: string, text: string): Promise<ApiResponse<Message>> {
  return apiRequest<Message>(`/chats/${conversationId}`, {
    method: 'POST',
    body: { text },
    requiresAuth: true,
  });
}

/**
 * Create a new conversation (usually when inquiring about a listing)
 */
export async function createConversation(listingId: string, message: string): Promise<ApiResponse<Conversation>> {
  return apiRequest<Conversation>('/chats', {
    method: 'POST',
    body: { listingId, message },
    requiresAuth: true,
  });
}

/**
 * Mark conversation as read
 */
export async function markConversationAsRead(conversationId: string): Promise<ApiResponse<any>> {
  return apiRequest(`/chats/${conversationId}/read`, {
    method: 'PUT',
    requiresAuth: true,
  });
}
