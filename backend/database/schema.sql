-- Create database
CREATE DATABASE IF NOT EXISTS tabunganqu_db;
USE tabunganqu_db;

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NULL,
    avatar VARCHAR(255) NULL,
    google_id VARCHAR(255) NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email)
);

-- Transactions table
CREATE TABLE IF NOT EXISTS transactions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    type ENUM('pemasukan', 'pengeluaran') NOT NULL,
    amount INT NOT NULL CHECK (amount > 0),
    description TEXT NOT NULL,
    transaction_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_date (user_id, transaction_date),
    INDEX idx_type (type)
);

-- Wishlist table
CREATE TABLE IF NOT EXISTS wishlists (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    target_amount INT NOT NULL CHECK (target_amount > 0),
    saved_amount INT DEFAULT 0 CHECK (saved_amount >= 0),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id)
);

-- Drop view if exists before creating
DROP VIEW IF EXISTS user_summary;

-- Create view for easier reporting
CREATE VIEW user_summary AS
SELECT 
    u.id as user_id,
    u.name,
    u.email,
    COALESCE(SUM(CASE WHEN t.type = 'pemasukan' THEN t.amount ELSE 0 END), 0) as total_pemasukan,
    COALESCE(SUM(CASE WHEN t.type = 'pengeluaran' THEN t.amount ELSE 0 END), 0) as total_pengeluaran,
    COUNT(DISTINCT w.id) as total_wishlist
FROM users u
LEFT JOIN transactions t ON u.id = t.user_id
LEFT JOIN wishlists w ON u.id = w.user_id
GROUP BY u.id, u.name, u.email;