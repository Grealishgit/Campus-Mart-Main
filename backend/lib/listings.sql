-- ============================================================
-- LISTINGS TABLE + QUERY REFERENCES
-- Source of truth: controllers/listingController.js
-- image_url stores a Cloudinary URL (req.file.path from multer-storage-cloudinary)
-- ============================================================

-- 1) Create listings table used by listing controller endpoints
CREATE TABLE IF NOT EXISTS listings (
	id SERIAL PRIMARY KEY,
	title VARCHAR(200) NOT NULL,
	description TEXT NOT NULL,
	price DECIMAL(10,2) NOT NULL,
	price_unit VARCHAR(20),
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

-- 2) Keep updated_at fresh on UPDATE for listings
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
	NEW.updated_at = NOW();
	RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_listings_updated_at ON listings;
CREATE TRIGGER update_listings_updated_at
BEFORE UPDATE ON listings
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- 3) Indexes used by getListings and ownership checks
CREATE INDEX IF NOT EXISTS idx_listings_seller_id ON listings(seller_id);
CREATE INDEX IF NOT EXISTS idx_listings_category ON listings(category);
CREATE INDEX IF NOT EXISTS idx_listings_type ON listings(type);
CREATE INDEX IF NOT EXISTS idx_listings_is_available ON listings(is_available);
CREATE INDEX IF NOT EXISTS idx_listings_created_at ON listings(created_at DESC);


-- ============================================================
-- LISTING CONTROLLER QUERY REFERENCES
-- ============================================================

-- Get all listings with filters (getListings)
-- SELECT l.*, u.name AS seller_name, u.rating AS seller_rating,
--        u.avatar_url AS seller_avatar, u.is_verified AS seller_verified
-- FROM listings l
-- JOIN users u ON l.seller_id = u.id
-- WHERE l.is_available = true
--   AND ($1::text IS NULL OR l.type = $1)
--   AND ($2::text IS NULL OR l.category = $2)
-- ORDER BY l.created_at DESC
-- LIMIT $3 OFFSET $4;

-- Count listings for pagination (getListings)
-- SELECT COUNT(*) FROM listings l WHERE l.is_available = true;

-- Get one listing by id (getListingById)
-- SELECT l.*, u.name AS seller_name, u.rating AS seller_rating,
--        u.avatar_url AS seller_avatar, u.is_verified AS seller_verified
-- FROM listings l
-- JOIN users u ON l.seller_id = u.id
-- WHERE l.id = $1;

-- Create listing (createListing)
-- image_url should receive Cloudinary URL from uploaded file
-- INSERT INTO listings (
--   title, description, price, price_unit, type, category, condition,
--   location, image_url, seller_id
-- ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
-- RETURNING *;

-- Update listing (updateListing)
-- UPDATE listings
-- SET title = COALESCE($1, title),
--     description = COALESCE($2, description),
--     price = COALESCE($3, price),
--     price_unit = COALESCE($4, price_unit),
--     category = COALESCE($5, category),
--     condition = COALESCE($6, condition),
--     location = COALESCE($7, location),
--     is_available = COALESCE($8, is_available),
--     image_url = COALESCE($9, image_url)
-- WHERE id = $10
-- RETURNING *;

-- Delete listing (deleteListing)
-- DELETE FROM listings WHERE id = $1;

-- Get my listings (getMyListings)
-- SELECT l.*, u.name AS seller_name, u.rating AS seller_rating,
--        u.avatar_url AS seller_avatar, u.is_verified AS seller_verified
-- FROM listings l
-- JOIN users u ON l.seller_id = u.id
-- WHERE l.seller_id = $1
-- ORDER BY l.created_at DESC;

-- Categories lookup used by getCategories
-- SELECT * FROM categories ORDER BY name;

