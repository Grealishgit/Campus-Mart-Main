-- ============================================================
-- CAMPUS MART DATABASE SCHEMA
-- Single listings table with lease-specific metadata.
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- ============================================================
-- USERS
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
-- CATEGORIES
-- ============================================================
CREATE TABLE IF NOT EXISTS categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  icon VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW()
);

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
-- LISTINGS
-- ============================================================
CREATE TABLE IF NOT EXISTS listings (
  id SERIAL PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL CHECK (price > 0),
  price_unit VARCHAR(20) CHECK (price_unit IN ('/hour', '/day', '/week', '/month')),
  min_duration INT CHECK (min_duration IS NULL OR min_duration > 0),
  max_duration INT CHECK (max_duration IS NULL OR max_duration > 0),
  duration_unit VARCHAR(10) CHECK (duration_unit IN ('hours', 'days', 'weeks', 'months')),
  available_from DATE NOT NULL DEFAULT CURRENT_DATE,
  available_until DATE,
  type VARCHAR(10) NOT NULL CHECK (type IN ('SALE', 'LEASE')),
  category VARCHAR(100) NOT NULL,
  condition VARCHAR(50) NOT NULL CHECK (condition IN ('Brand New', 'Like New', 'Excellent', 'Good', 'Used - Like New', 'Fair')),
  location VARCHAR(150) NOT NULL,
  image_url TEXT,
  is_verified BOOLEAN DEFAULT FALSE,
  is_available BOOLEAN DEFAULT TRUE,
  is_sold BOOLEAN DEFAULT FALSE,
  sold_at TIMESTAMP,
  seller_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT chk_lease_listing_fields CHECK (
    (type = 'SALE' AND price_unit IS NULL AND min_duration IS NULL AND max_duration IS NULL AND duration_unit IS NULL) OR
    (
      type = 'LEASE'
      AND price_unit IS NOT NULL
      AND (available_until IS NULL OR available_until >= available_from)
    )
  ),
  CONSTRAINT chk_listing_duration_range CHECK (
    max_duration IS NULL OR min_duration IS NULL OR max_duration >= min_duration
  ),
  CONSTRAINT chk_listing_availability_window CHECK (
    available_until IS NULL OR available_until >= available_from
  )
);

-- ============================================================
-- ORDERS
-- ============================================================
CREATE TABLE IF NOT EXISTS orders (
  id SERIAL PRIMARY KEY,
  buyer_id UUID REFERENCES users(id) ON DELETE SET NULL,
  listing_id INTEGER REFERENCES listings(id) ON DELETE SET NULL,
  seller_id UUID REFERENCES users(id) ON DELETE SET NULL,
  amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
  status VARCHAR(30) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
  type VARCHAR(10) NOT NULL CHECK (type IN ('SALE', 'LEASE')),
  lease_start DATE,
  lease_end DATE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT chk_order_lease_dates CHECK (
    (type = 'SALE' AND lease_start IS NULL AND lease_end IS NULL) OR
    (type = 'LEASE' AND lease_start IS NOT NULL AND lease_end IS NOT NULL AND lease_end > lease_start)
  ),
  CONSTRAINT no_lease_overlap EXCLUDE USING gist (
    listing_id WITH =,
    daterange(lease_start, lease_end, '[]') WITH &&
  ) WHERE (type = 'LEASE' AND status IN ('pending', 'confirmed'))
);

-- ============================================================
-- FAVORITES
-- ============================================================
CREATE TABLE IF NOT EXISTS favorites (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  listing_id INTEGER REFERENCES listings(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, listing_id)
);

-- ============================================================
-- CONVERSATIONS
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
-- MESSAGES
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
-- REVIEWS
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
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_listings_seller ON listings(seller_id);
CREATE INDEX IF NOT EXISTS idx_listings_category ON listings(category);
CREATE INDEX IF NOT EXISTS idx_listings_type ON listings(type);
CREATE INDEX IF NOT EXISTS idx_listings_available ON listings(is_available, is_sold);
CREATE INDEX IF NOT EXISTS idx_listings_dates ON listings(available_from, available_until);

CREATE INDEX IF NOT EXISTS idx_orders_buyer ON orders(buyer_id);
CREATE INDEX IF NOT EXISTS idx_orders_seller ON orders(seller_id);
CREATE INDEX IF NOT EXISTS idx_orders_listing ON orders(listing_id);
CREATE INDEX IF NOT EXISTS idx_orders_type_status ON orders(type, status);

CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_favorites_user ON favorites(user_id);

-- ============================================================
-- TIMESTAMP TRIGGERS
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_listings_updated_at ON listings;
CREATE TRIGGER update_listings_updated_at
BEFORE UPDATE ON listings
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_orders_updated_at ON orders;
CREATE TRIGGER update_orders_updated_at
BEFORE UPDATE ON orders
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
