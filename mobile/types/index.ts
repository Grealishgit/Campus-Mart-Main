
export enum Screen {
    SPLASH = 'SPLASH',
    ONBOARDING = 'ONBOARDING',
    SIGNUP = 'SIGNUP',
    HOME = 'HOME',
    SEARCH = 'SEARCH',
    ITEM_DETAILS = 'ITEM_DETAILS',
    CREATE_LISTING = 'CREATE_LISTING',
    MESSAGES = 'MESSAGES',
    CHAT_WINDOW = 'CHAT_WINDOW',
    PROFILE = 'PROFILE',
    LEASES = 'LEASES',
    AI_ASSISTANT = 'AI_ASSISTANT'
}

export enum TransactionType {
    SALE = 'SALE',
    LEASE = 'LEASE'
}

export interface Listing {
    id: string;
    title: string;
    price: number;
    priceUnit?: string;
    type: TransactionType;
    category: string;
    condition: string;
    location: string;
    distance: string;
    imageUrl: string;
    isVerified: boolean;
    seller: {
        name: string;
        rating: number;
        avatarUrl: string;
        isVerified: boolean;
    };
    description: string;
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
}

export interface Message {
    id: string;
    text: string;
    sender: 'me' | 'them';
    timestamp: string;
}
