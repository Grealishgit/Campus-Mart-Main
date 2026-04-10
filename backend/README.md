# 🛒 Campus Mart Backend API

Node.js + Express + PostgreSQL backend for the Campus Mart mobile app.

---

## 🚀 Setup

### 1. Install dependencies
```bash
cd backend
npm install
```

### 2. Setup environment variables
```bash
cp .env.example .env
# Edit .env with your PostgreSQL credentials
```

### 3. Create the PostgreSQL database
```bash
psql -U postgres
CREATE DATABASE campus_mart;
\q
```

### 4. Run the schema (creates all tables)
```bash
psql -U postgres -d campus_mart -f config/schema.sql
```

### 5. Start the server
```bash
npm run dev     # development (nodemon)
npm start       # production
```

Server runs at: `http://localhost:5000`

---

## 📡 API Endpoints

### Auth
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/api/auth/register` | Public | Register with university email |
| POST | `/api/auth/login` | Public | Login |
| GET | `/api/auth/me` | Private | Get current user |
| PUT | `/api/auth/profile` | Private | Update profile + avatar |
| DELETE | `/api/auth/account` | Private | Delete account |

### Listings
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/api/listings` | Public | Get all listings (filterable) |
| GET | `/api/listings/categories` | Public | Get all categories |
| GET | `/api/listings/my` | Private | Get my listings |
| GET | `/api/listings/:id` | Public | Get single listing |
| POST | `/api/listings` | Private | Create listing (+ image upload) |
| PUT | `/api/listings/:id` | Private | Update listing |
| DELETE | `/api/listings/:id` | Private | Delete listing |

#### Query Params for GET /api/listings
- `type` — SALE or LEASE
- `category` — e.g. Textbooks, Tech
- `search` — keyword search
- `minPrice` / `maxPrice` — price range in KES
- `condition` — Brand New, Like New, etc.
- `page` / `limit` — pagination

### Favorites
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/api/favorites` | Private | Get my favorites |
| POST | `/api/favorites/:listingId` | Private | Add to favorites |
| DELETE | `/api/favorites/:listingId` | Private | Remove from favorites |

### Orders
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/api/orders` | Private | Place order (Buy Now) |
| GET | `/api/orders/my` | Private | My purchases |
| GET | `/api/orders/selling` | Private | Incoming orders |
| PUT | `/api/orders/:id/status` | Private | Update order status |

### Chats
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/api/chats` | Private | Get all conversations |
| POST | `/api/chats/start` | Private | Start conversation on a listing |
| GET | `/api/chats/:id/messages` | Private | Get messages |
| POST | `/api/chats/:id/messages` | Private | Send message |

### Admin
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/api/admin/stats` | Admin | Dashboard stats |
| GET | `/api/admin/users` | Admin | All users |
| PUT | `/api/admin/users/:id/verify` | Admin | Verify user |
| DELETE | `/api/admin/users/:id` | Admin | Delete user |
| GET | `/api/admin/listings` | Admin | All listings |
| PUT | `/api/admin/listings/:id/verify` | Admin | Verify listing |

---

## 🔐 Authentication

All private routes require a Bearer token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

---

## 📁 Image Uploads

Uploaded images are served at:
```
http://localhost:5000/uploads/<filename>
```

Send images as `multipart/form-data` with field name `image` (listings) or `avatar` (profile).

---

## 🗄️ Database Tables

- `users` — students, vendors, admins
- `listings` — product listings (SALE/LEASE)
- `categories` — product categories (pre-seeded)
- `favorites` — user saved listings
- `orders` — purchase/lease records
- `conversations` — chat threads
- `messages` — individual chat messages
- `reviews` — user reviews

---

## 📱 Connecting from React Native

```javascript
// lib/api.js
const BASE_URL = 'http://YOUR_LOCAL_IP:5000/api'; // Use your machine's IP, not localhost

export const api = {
  baseURL: BASE_URL,
  headers: (token) => ({
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  }),
};
```

> ⚠️ On Android emulator use `http://10.0.2.2:5000/api`
> On physical device use your machine's local IP e.g. `http://192.168.x.x:5000/api`
