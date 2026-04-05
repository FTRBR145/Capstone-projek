-- Migration: Add Google OAuth support
USE tabunganqu_db;

-- Allow null passwords for OAuth users
ALTER TABLE users MODIFY COLUMN password VARCHAR(255) NULL;

-- Unique identifier for Google Provider
ALTER TABLE users 
ADD COLUMN google_id VARCHAR(255) NULL UNIQUE AFTER avatar;