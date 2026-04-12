-- ============================================================
-- USERS TABLE + AUTH QUERIES
-- Source of truth for columns: controllers/authController.js
-- ============================================================

-- UUID support for user IDs
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1) Create users table used by auth and admin flows
CREATE TABLE IF NOT EXISTS users (
	id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
	name VARCHAR(100) NOT NULL,
	email VARCHAR(150) UNIQUE NOT NULL,
	password VARCHAR(255) NOT NULL,
	role VARCHAR(20) DEFAULT 'student' CHECK (role IN ('student', 'vendor')),
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

-- 2) Keep updated_at fresh on UPDATE
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
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- 3) Optional index for faster email lookups (register/login)
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);


-- ============================================================
-- AUTH CONTROLLER QUERY REFERENCES
-- ============================================================

-- Register: check existing email
-- SELECT id FROM users WHERE email = $1;

-- Register: create user
-- INSERT INTO users (name, email, password, role, faculty, graduation_year)
-- VALUES ($1, $2, $3, $4, $5, $6)
-- RETURNING id, name, email, role, avatar_url, is_verified, faculty, graduation_year, rating, created_at;

-- Login: find user
-- SELECT * FROM users WHERE email = $1;

-- Get current user
-- SELECT id, name, email, role, avatar_url, is_verified, faculty, graduation_year,
--        rating, total_sales, active_listings, created_at
-- FROM users
-- WHERE id = $1;

-- Update profile (example using COALESCE for optional fields)
-- UPDATE users
-- SET name = COALESCE($1, name),
--     faculty = COALESCE($2, faculty),
--     graduation_year = COALESCE($3, graduation_year),
--     avatar_url = COALESCE($4, avatar_url)
-- WHERE id = $5
-- RETURNING id, name, email, role, avatar_url, is_verified, faculty, graduation_year, rating;

-- Delete account
-- DELETE FROM users WHERE id = $1;

