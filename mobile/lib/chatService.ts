import { apiRequest, ApiResponse } from './apiClient';

export interface Message {
  id: string;
  text: string;
  sender: 'me' | 'them';
  timestamp: string;
  senderName?: string;
  senderAvatar?: string;
}

export interface Conversation {
  id: string;
  participant: {
    name: string;
    avatarUrl: string;
    isOnline: boolean;
    isStore?: boolean;
  };
  lastMessage: string;
  timestamp: string;
  unreadCount: number;
  listingThumb: string;
  type: 'BUYING' | 'SELLING' | 'LEASING';
  listingTitle: string;
  created_at: string;
}

export interface ConversationsResponse {
  conversations?: Conversation[];
}

export async function getConversations(): Promise<ApiResponse<ConversationsResponse>> {
  return apiRequest<ConversationsResponse>('/chats', {
    method: 'GET',
    requiresAuth: true,
  });
}

export async function getConversationMessages(
  conversationId: string
): Promise<ApiResponse<{ messages: Message[] }>> {
  return apiRequest<{ messages: Message[] }>(`/chats/${conversationId}/messages`, {
    method: 'GET',
    requiresAuth: true,
  });
}

export async function sendMessage(
  conversationId: string,
  text: string
): Promise<ApiResponse<{ message: Message }>> {
  return apiRequest<{ message: Message }>(`/chats/${conversationId}/messages`, {
    method: 'POST',
    body: { text },
    requiresAuth: true,
  });
}

export async function createConversation(
  listingId: string,
  listingType: 'SALE' | 'LEASE',
): Promise<ApiResponse<{ conversation: Conversation }>> {
  return apiRequest<{ conversation: Conversation }>('/chats/start', {
    method: 'POST',
    body: {
      listing_id: Number(listingId),
      type: listingType.toLowerCase(),
    },
    requiresAuth: true,
  });
}
