-- ============================================================
-- CAMPUS MART DATABASE SCHEMA
-- Run: psql -U postgres -d campus_mart -f schema.sql
-- ============================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- ============================================================
-- USERS
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id              UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  name            VARCHAR(100)  NOT NULL,
  email           VARCHAR(150)  UNIQUE NOT NULL,
  password        VARCHAR(255)  NOT NULL,
  role            VARCHAR(20)   DEFAULT 'student' CHECK (role IN ('student', 'vendor', 'admin')),
  avatar_url      TEXT,
  is_verified     BOOLEAN       DEFAULT FALSE,
  faculty         VARCHAR(100),
  rating          DECIMAL(2,1)  DEFAULT 0.0,
  total_sales     INTEGER       DEFAULT 0,
  active_listings INTEGER       DEFAULT 0,
  created_at      TIMESTAMP     DEFAULT NOW(),
  updated_at      TIMESTAMP     DEFAULT NOW()
);

-- ============================================================
-- CATEGORIES
-- ============================================================
CREATE TABLE IF NOT EXISTS categories (
  id         SERIAL PRIMARY KEY,
  name       VARCHAR(100) UNIQUE NOT NULL,
  icon       VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW()
);

INSERT INTO categories (name, icon) VALUES
  ('Textbooks',  'book'),
  ('Tech',       'laptop'),
  ('Dorm Decor', 'home'),
  ('Bikes',      'bicycle'),
  ('Leisure',    'game-controller'),
  ('Electronics','flash'),
  ('Clothing',   'shirt'),
  ('Household',  'basket')
ON CONFLICT (name) DO NOTHING;

-- ============================================================
-- SALE LISTINGS
-- One-time purchases — no duration or price_unit
-- ============================================================
CREATE TABLE IF NOT EXISTS sale_listings (
  id           SERIAL          PRIMARY KEY,
  title        VARCHAR(200)    NOT NULL,
  description  TEXT            NOT NULL,
  price        DECIMAL(10,2)   NOT NULL,
  category     VARCHAR(100)    NOT NULL,
  condition    VARCHAR(50)     NOT NULL CHECK (condition IN ('Brand New', 'Like New', 'Excellent', 'Good', 'Used - Like New', 'Fair')),
  location     VARCHAR(150)    NOT NULL,
  image_url    TEXT,
  is_verified  BOOLEAN         DEFAULT FALSE,
  is_available BOOLEAN         DEFAULT TRUE,
  is_sold      BOOLEAN         DEFAULT FALSE,
  sold_at      TIMESTAMP,
  seller_id    UUID            REFERENCES users(id) ON DELETE CASCADE,
  created_at   TIMESTAMP       DEFAULT NOW(),
  updated_at   TIMESTAMP       DEFAULT NOW()
);

-- ============================================================
-- LEASE LISTINGS
-- Rentals with duration and price per time unit
-- ============================================================
CREATE TABLE IF NOT EXISTS lease_listings (
  id              SERIAL        PRIMARY KEY,
  title           VARCHAR(200)  NOT NULL,
  description     TEXT          NOT NULL,
  price           DECIMAL(10,2) NOT NULL,
  price_unit      VARCHAR(20)   NOT NULL CHECK (price_unit IN ('/hour', '/day', '/week', '/month')),
  min_duration    INT,
  max_duration    INT,
  duration_unit   VARCHAR(10)   CHECK (duration_unit IN ('hours', 'days', 'weeks', 'months')),
  available_from  DATE          NOT NULL DEFAULT CURRENT_DATE,
  available_until DATE,
  category        VARCHAR(100)  NOT NULL,
  condition       VARCHAR(50)   NOT NULL CHECK (condition IN ('Brand New', 'Like New', 'Excellent', 'Good', 'Used - Like New', 'Fair')),
  location        VARCHAR(150)  NOT NULL,
  image_url       TEXT,
  is_verified     BOOLEAN       DEFAULT FALSE,
  is_available    BOOLEAN       DEFAULT TRUE,
  seller_id       UUID          REFERENCES users(id) ON DELETE CASCADE,
  created_at      TIMESTAMP     DEFAULT NOW(),
  updated_at      TIMESTAMP     DEFAULT NOW()
);

-- ============================================================
-- ORDERS
-- Covers both SALE and LEASE — only one listing FK is set
-- ============================================================
CREATE TABLE IF NOT EXISTS orders (
  id                SERIAL        PRIMARY KEY,
  buyer_id          UUID          REFERENCES users(id) ON DELETE SET NULL,
  seller_id         UUID          REFERENCES users(id) ON DELETE SET NULL,
  sale_listing_id   INT           REFERENCES sale_listings(id) ON DELETE SET NULL,
  lease_listing_id  INT           REFERENCES lease_listings(id) ON DELETE SET NULL,
  type              VARCHAR(10)   NOT NULL CHECK (type IN ('SALE', 'LEASE')),
  amount            DECIMAL(10,2) NOT NULL,
  status            VARCHAR(30)   DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
  lease_start       DATE,
  lease_end         DATE,
  created_at        TIMESTAMP     DEFAULT NOW(),
  updated_at        TIMESTAMP     DEFAULT NOW(),

  -- Exactly one listing FK must be set, matching the type
  CONSTRAINT chk_listing_matches_type CHECK (
    (type = 'SALE'  AND sale_listing_id  IS NOT NULL AND lease_listing_id IS NULL) OR
    (type = 'LEASE' AND lease_listing_id IS NOT NULL AND sale_listing_id  IS NULL)
  ),

  -- Lease orders must have valid dates; sale orders must not
  CONSTRAINT chk_lease_dates CHECK (
    (type = 'LEASE' AND lease_start IS NOT NULL AND lease_end IS NOT NULL AND lease_end > lease_start) OR
    (type = 'SALE'  AND lease_start IS NULL AND lease_end IS NULL)
  ),

  -- No overlapping active lease orders for the same listing
  CONSTRAINT no_lease_overlap EXCLUDE USING gist (
    lease_listing_id WITH =,
    daterange(lease_start, lease_end, '[]') WITH &&
  ) WHERE (type = 'LEASE' AND status NOT IN ('cancelled'))
);

-- ============================================================
-- FAVORITES
-- References both listing tables via nullable FKs
-- ============================================================
CREATE TABLE IF NOT EXISTS favorites (
  id                SERIAL    PRIMARY KEY,
  user_id           UUID      REFERENCES users(id) ON DELETE CASCADE,
  sale_listing_id   INT       REFERENCES sale_listings(id) ON DELETE CASCADE,
  lease_listing_id  INT       REFERENCES lease_listings(id) ON DELETE CASCADE,
  created_at        TIMESTAMP DEFAULT NOW(),

  -- Only one listing type per favorite
  CONSTRAINT chk_favorite_one_listing CHECK (
    (sale_listing_id IS NOT NULL AND lease_listing_id IS NULL) OR
    (lease_listing_id IS NOT NULL AND sale_listing_id IS NULL)
  ),
  UNIQUE(user_id, sale_listing_id),
  UNIQUE(user_id, lease_listing_id)
);

-- ============================================================
-- CONVERSATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS conversations (
  id           SERIAL    PRIMARY KEY,
  buyer_id     UUID      REFERENCES users(id) ON DELETE CASCADE,
  seller_id    UUID      REFERENCES users(id) ON DELETE CASCADE,
  -- Nullable FKs — only one will be set
  sale_listing_id  INT  REFERENCES sale_listings(id) ON DELETE SET NULL,
  lease_listing_id INT  REFERENCES lease_listings(id) ON DELETE SET NULL,
  type         VARCHAR(10) CHECK (type IN ('BUYING', 'SELLING', 'LEASING')),
  last_message TEXT,
  last_message_at TIMESTAMP DEFAULT NOW(),
  created_at   TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- MESSAGES
-- ============================================================
CREATE TABLE IF NOT EXISTS messages (
  id              SERIAL    PRIMARY KEY,
  conversation_id INTEGER   REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id       UUID      REFERENCES users(id) ON DELETE SET NULL,
  text            TEXT      NOT NULL,
  is_read         BOOLEAN   DEFAULT FALSE,
  created_at      TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- REVIEWS
-- ============================================================
CREATE TABLE IF NOT EXISTS reviews (
  id               SERIAL    PRIMARY KEY,
  reviewer_id      UUID      REFERENCES users(id) ON DELETE SET NULL,
  reviewed_user_id UUID      REFERENCES users(id) ON DELETE CASCADE,
  sale_listing_id  INT       REFERENCES sale_listings(id) ON DELETE SET NULL,
  lease_listing_id INT       REFERENCES lease_listings(id) ON DELETE SET NULL,
  rating           INTEGER   CHECK (rating BETWEEN 1 AND 5),
  comment          TEXT,
  created_at       TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_sale_listings_seller    ON sale_listings(seller_id);
CREATE INDEX IF NOT EXISTS idx_sale_listings_category  ON sale_listings(category);
CREATE INDEX IF NOT EXISTS idx_sale_listings_available ON sale_listings(is_available, is_sold);

CREATE INDEX IF NOT EXISTS idx_lease_listings_seller   ON lease_listings(seller_id);
CREATE INDEX IF NOT EXISTS idx_lease_listings_category ON lease_listings(category);
CREATE INDEX IF NOT EXISTS idx_lease_listings_dates    ON lease_listings(available_from, available_until);

CREATE INDEX IF NOT EXISTS idx_orders_buyer            ON orders(buyer_id);
CREATE INDEX IF NOT EXISTS idx_orders_seller           ON orders(seller_id);
CREATE INDEX IF NOT EXISTS idx_orders_type_status      ON orders(type, status);
CREATE INDEX IF NOT EXISTS idx_orders_sale_listing     ON orders(sale_listing_id);
CREATE INDEX IF NOT EXISTS idx_orders_lease_listing    ON orders(lease_listing_id);

CREATE INDEX IF NOT EXISTS idx_messages_conversation   ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_favorites_user          ON favorites(user_id);

-- ============================================================
-- AUTO-UPDATE updated_at TRIGGER
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sale_listings_updated_at
  BEFORE UPDATE ON sale_listings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lease_listings_updated_at
  BEFORE UPDATE ON lease_listings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();