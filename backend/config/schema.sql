-- ============================================================
-- CAMPUS MART DATABASE SCHEMA
-- Run this file in psql or pgAdmin to set up all tables
-- Command: psql -U postgres -d campus_mart -f schema.sql
-- ============================================================

-- Create database (run this separately if needed)
-- CREATE DATABASE campus_mart;

-- UUID support for user IDs
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================================
-- USERS TABLE
-- Supports both students and vendors (role-based)
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(20) DEFAULT 'student' CHECK (role IN ('student', 'vendor', 'admin')),
  avatar_url TEXT,
  is_verified BOOLEAN DEFAULT FALSE,
  faculty VARCHAR(100),
  graduation_year INTEGER,
  rating DECIMAL(2,1) DEFAULT 0.0,
  total_sales INTEGER DEFAULT 0,
  active_listings INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- CATEGORIES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  icon VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Seed default categories
INSERT INTO categories (name, icon) VALUES
  ('Textbooks', 'book'),
  ('Tech', 'laptop'),
  ('Dorm Decor', 'home'),
  ('Bikes', 'bicycle'),
  ('Leisure', 'game-controller'),
  ('Electronics', 'flash'),
  ('Clothing', 'shirt'),
  ('Household', 'basket')
ON CONFLICT (name) DO NOTHING;

-- ============================================================
-- LISTINGS TABLE
-- Matches the Listing interface in types/index.ts
-- ============================================================
CREATE TABLE IF NOT EXISTS listings (
  id SERIAL PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  price_unit VARCHAR(20),                          -- e.g. '/day', '/week' for leases
  type VARCHAR(10) NOT NULL CHECK (type IN ('SALE', 'LEASE')),
  category VARCHAR(100) NOT NULL,
  condition VARCHAR(50) NOT NULL CHECK (condition IN ('Brand New', 'Like New', 'Excellent', 'Good', 'Used - Like New', 'Fair')),
  location VARCHAR(150) NOT NULL,
  image_url TEXT,
  is_verified BOOLEAN DEFAULT FALSE,
  is_available BOOLEAN DEFAULT TRUE,
  seller_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- FAVORITES TABLE
-- For the "Favorites" tab in the profile screen
-- ============================================================
CREATE TABLE IF NOT EXISTS favorites (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  listing_id INTEGER REFERENCES listings(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, listing_id)
);

-- ============================================================
-- ORDERS TABLE
-- Created when user taps "Buy Now"
-- ============================================================
CREATE TABLE IF NOT EXISTS orders (
  id SERIAL PRIMARY KEY,
  buyer_id UUID REFERENCES users(id) ON DELETE SET NULL,
  listing_id INTEGER REFERENCES listings(id) ON DELETE SET NULL,
  seller_id UUID REFERENCES users(id) ON DELETE SET NULL,
  amount DECIMAL(10,2) NOT NULL,
  status VARCHAR(30) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
  type VARCHAR(10) NOT NULL CHECK (type IN ('SALE', 'LEASE')),
  lease_start DATE,
  lease_end DATE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- CONVERSATIONS TABLE
-- Matches the Conversation interface in types/index.ts
-- ============================================================
CREATE TABLE IF NOT EXISTS conversations (
  id SERIAL PRIMARY KEY,
  buyer_id UUID REFERENCES users(id) ON DELETE CASCADE,
  seller_id UUID REFERENCES users(id) ON DELETE CASCADE,
  listing_id INTEGER REFERENCES listings(id) ON DELETE SET NULL,
  type VARCHAR(10) CHECK (type IN ('BUYING', 'SELLING', 'LEASING')),
  last_message TEXT,
  last_message_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(buyer_id, seller_id, listing_id)
);

-- ============================================================
-- MESSAGES TABLE
-- Matches the Message interface in types/index.ts
-- ============================================================
CREATE TABLE IF NOT EXISTS messages (
  id SERIAL PRIMARY KEY,
  conversation_id INTEGER REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES users(id) ON DELETE SET NULL,
  text TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- REVIEWS TABLE
-- For the "Reviews" tab in the profile screen
-- ============================================================
CREATE TABLE IF NOT EXISTS reviews (
  id SERIAL PRIMARY KEY,
  reviewer_id UUID REFERENCES users(id) ON DELETE SET NULL,
  reviewed_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  listing_id INTEGER REFERENCES listings(id) ON DELETE SET NULL,
  rating INTEGER CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- INDEXES for performance
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_listings_seller ON listings(seller_id);
CREATE INDEX IF NOT EXISTS idx_listings_category ON listings(category);
CREATE INDEX IF NOT EXISTS idx_listings_type ON listings(type);
CREATE INDEX IF NOT EXISTS idx_listings_available ON listings(is_available);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_favorites_user ON favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_buyer ON orders(buyer_id);
CREATE INDEX IF NOT EXISTS idx_orders_seller ON orders(seller_id);

-- ============================================================
-- FUNCTION: auto-update updated_at timestamp
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_listings_updated_at BEFORE UPDATE ON listings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
