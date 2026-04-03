# TabunganQu

Selamat datang di repo TabunganQu.  
Proyek ini adalah aplikasi pengelola keuangan pribadi berbasis web untuk membantu pengguna mencatat pemasukan, pengeluaran, dan target tabungan dengan lebih mudah dan terstruktur.

## Persyaratan
- Node.js v18 atau lebih baru
- MySQL v8 atau lebih baru
- NPM

## Langkah Instalasi

1. **Clone repository ini**:
   ```bash
   git clone https://github.com/G-breel/Capstone-projek.git
   cd Capstone-projek
   ```

2. **Setup Database**:
   ```bash
   mysql -u root -p < database/schema.sql
   ```
**2.2 Buat Database dan Tables**
Copy paste SQL berikut di terminal MySQL:
```sql
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
```

3. **Install dependencies untuk Backend**:
   ```bash
   cd backend
   npm install
   ```

4. **Install dependencies untuk Frontend**:
   ```bash
   cd ../frontend
   npm install
   ```


## Struktur Proyek
```
Capstone-projek/
├── backend/               # Kode sumber backend (Node.js + Express)
│   ├── src/
│   │   ├── config/        # Konfigurasi database
│   │   ├── controllers/   # Logika bisnis
│   │   ├── middleware/    # Auth & validasi
│   │   ├── models/        # Model database
│   │   └── routes/        # Endpoint API
│   └── .env
├── frontend/              # Kode sumber frontend (React + Vite)
│   ├── src/
│   │   ├── components/    # Komponen reusable
│   │   ├── context/       # State management
│   │   ├── pages/         # Halaman aplikasi
│   │   ├── services/      # API services
│   │   └── utils/         # Helper functions
│   └── .env
├── database/              # File SQL database
│   └── schema.sql
└── README.md
```

## Cara Menjalankan

### Menjalankan Backend
1. **Masuk ke folder backend**:
   ```bash
   cd backend
   ```
2. **Jalankan server**:
   ```bash
   npm run dev
   ```
   Server akan berjalan di `http://localhost:5000`

### Menjalankan Frontend
1. **Masuk ke folder frontend**:
   ```bash
   cd frontend
   ```
2. **Jalankan aplikasi**:
   ```bash
   npm run dev
   ```
   Aplikasi akan berjalan di `http://localhost:5173`
