# Campus Mart Frontend-Backend Integration Guide

## Overview

Your mobile app is now connected to the Campus Mart backend API. All API services are centralized in the `lib/` directory for easy management and reusability.

---

## Setup Instructions

### 1. Install Dependencies

```bash
cd mobile
npm install
```

The following key packages have been added:

- `@react-native-async-storage/async-storage` - For storing auth tokens securely

### 2. Configure Environment Variables

Create a `.env` file in the mobile directory (copy from `.env.example`):

```bash
# .env file
EXPO_PUBLIC_API_BASE_URL=http://localhost:5000/api
EXPO_PUBLIC_GEMINI_API_KEY=your_gemini_api_key_here
```

**Important**: Make sure your backend is running on `localhost:5000` or update the `API_BASE_URL` accordingly.

---

## API Services Architecture

### Available Services

1. **Authentication** (`lib/authService.ts`)
   - `registerUser()` - Register new user
   - `loginUser()` - Login user
   - `getCurrentUser()` - Get authenticated user
   - `updateProfile()` - Update user profile
   - `logoutUser()` - Logout (clear token)
   - `isAuthenticated()` - Check if user is logged in

2. **Listings** (`lib/listingService.ts`)
   - `getAllListings()` - Get all listings with filters
   - `getListingById()` - Get specific listing
   - `getMyListings()` - Get current user's listings
   - `createListing()` - Create new listing
   - `updateListing()` - Update existing listing
   - `deleteListing()` - Delete listing
   - `getCategories()` - Get available categories

3. **Favorites** (`lib/favoriteService.ts`)
   - `getFavorites()` - Get user's favorite listings
   - `addFavorite()` - Add to favorites
   - `removeFavorite()` - Remove from favorites
   - `isFavorited()` - Check if item is favorited

4. **Chats** (`lib/chatService.ts`)
   - `getConversations()` - Get all conversations
   - `getConversationMessages()` - Get messages in conversation
   - `sendMessage()` - Send message
   - `createConversation()` - Start new conversation
   - `markConversationAsRead()` - Mark as read

5. **Orders** (`lib/orderService.ts`)
   - `getOrders()` - Get user's orders
   - `getOrder()` - Get specific order
   - `createOrder()` - Create new order
   - `updateOrderStatus()` - Update order status
   - `cancelOrder()` - Cancel order

### Core Utilities

**apiClient.ts** - Low-level HTTP request handler

- Automatic token management
- Error handling
- Request/response logging
- AsyncStorage integration for tokens

---

## Usage Examples

### Example 1: Login (Already Implemented)

```typescript
import { loginUser } from "@/lib/authService";

const handleLogin = async () => {
  const response = await loginUser({
    email: "user@example.ac.ke",
    password: "password123",
  });

  if (response.success) {
    // Token automatically saved, navigate to home
    router.replace("/(tabs)");
  } else {
    Alert.alert("Error", response.error);
  }
};
```

### Example 2: Fetch Listings

```typescript
import { getAllListings } from '@/lib/listingService';
import { useEffect, useState } from 'react';

export function BrowseScreen() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchListings = async () => {
      const response = await getAllListings({
        category: 'Textbooks',
        type: 'SELLING',
        limit: 20,
      });

      if (response.success && response.data?.listings) {
        setListings(response.data.listings);
      }
      setLoading(false);
    };

    fetchListings();
  }, []);

  if (loading) return <ActivityIndicator />;

  return (
    <FlatList
      data={listings}
      renderItem={({ item }) => <ListingCard listing={item} />}
      keyExtractor={(item) => item.id}
    />
  );
}
```

### Example 3: Create Listing

```typescript
import { createListing } from "@/lib/listingService";

const handleCreateListing = async (formData) => {
  const response = await createListing({
    title: "Organic Chemistry Textbook",
    description: "Like new condition, used for one semester",
    price: 2500,
    priceUnit: "KES",
    type: "SELLING",
    category: "Textbooks",
    condition: "LIKE_NEW",
    location: "Campus Gate A",
  });

  if (response.success) {
    Alert.alert("Success", "Listing created!");
    router.back();
  } else {
    Alert.alert("Error", response.error);
  }
};
```

### Example 4: Add to Favorites

```typescript
import { addFavorite, removeFavorite } from "@/lib/favoriteService";

const toggleFavorite = async (listingId, isFavorited) => {
  const response = isFavorited
    ? await removeFavorite(listingId)
    : await addFavorite(listingId);

  if (response.success) {
    setIsFavorited(!isFavorited);
  }
};
```

### Example 5: Send Message in Chat

```typescript
import { sendMessage } from "@/lib/chatService";

const handleSendMessage = async (conversationId, text) => {
  const response = await sendMessage(conversationId, text);

  if (response.success) {
    // Add message to state
    setMessages((prev) => [...prev, response.data]);
  } else {
    Alert.alert("Error", "Failed to send message");
  }
};
```

---

## Key Points

### Authentication Token Management

- Tokens are automatically saved to AsyncStorage after login/register
- Tokens are automatically included in all requests that require authentication
- On logout, tokens are cleared from AsyncStorage

### Error Handling

All API responses follow this structure:

```typescript
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}
```

Always check `response.success` before accessing `response.data`:

```typescript
const response = await someApiCall();
if (response.success) {
  // Use response.data
} else {
  // Handle error with response.error
}
```

### Protected Routes

Routes that require authentication will automatically return an error if no token is found. You can also check manually:

```typescript
import { isAuthenticated } from "@/lib/authService";

const checkAuth = async () => {
  const authenticated = await isAuthenticated();
  if (!authenticated) {
    router.replace("/(auth)");
  }
};
```

---

## Screens to Update

The following screens are ready for API integration:

- [x] SignIn - **DONE** ✓
- [x] Sign Up - **DONE** ✓
- [ ] Home (Browse) - Use `getAllListings()`
- [ ] Product Details - Use `getListingById()` and `addFavorite()`
- [ ] Chat - Use `getConversations()` and `sendMessage()`
- [ ] Leases - Use `getOrders()`
- [ ] Profile - Use `getCurrentUser()` and `updateProfile()`

---

## Testing

### Test the Login Flow

1. Start your backend: `npm start` (in backend directory)
2. Start your app: `npm start` (in mobile directory)
3. Create an account or login with test credentials
4. Verify in console logs that API calls are being made

### Check Request Logs

The API client logs all requests. Open the React Native debugger to see:

```
[API] POST /api/auth/login
[API] GET /api/listings
```

### Common Issues

**"No authentication token found"**

- User is not logged in
- Token was cleared
- SessionStorage was cleared

**API timeout / Connection refused**

- Backend is not running
- Wrong `EXPO_PUBLIC_API_BASE_URL`
- Firewall blocking requests

**CORS errors**

- Backend CORS settings need adjustment
- Already configured in backend to accept all origins

---

## Next Steps

1. **Update remaining screens** with API calls (follow examples above)
2. **Test on actual device** - Use `expo start` and scan QR code
3. **Add error handling** - Implement retry logic for failed requests
4. **Add offline support** - Cache listings/data locally
5. **Implement real-time chat** - Consider WebSockets for live messaging

---

## Resources

- API Client: `lib/apiClient.ts`
- Auth Service: `lib/authService.ts`
- Listing Service: `lib/listingService.ts`
- Favorite Service: `lib/favoriteService.ts`
- Chat Service: `lib/chatService.ts`
- Order Service: `lib/orderService.ts`

For more info on types, check the service files for exported interfaces!
