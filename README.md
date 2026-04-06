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

#### **3.4 Jalankan backend**
```bash
npm run dev
```

Jika berhasil, akan muncul:
```
✅ Database connected successfully
🚀 Server running on port 5000
📝 Environment: development
🔗 Client URL: http://localhost:5173
```

**Biarkan terminal ini running** (jangan ditutup)

---

### **Langkah 4: Setup Frontend**

#### **4.1 Buka terminal baru**
Buka terminal baru (jangan tutup terminal backend)

#### **4.2 Masuk ke folder frontend**
```bash
cd frontend
```

#### **4.3 Install dependencies**
```bash
npm install
```

#### **4.4 Buat file .env**
Buat file `.env` di folder `frontend` dengan isi:

```env
VITE_API_URL=http://localhost:5000/api
```

#### **4.5 Jalankan frontend**
```bash
npm run dev
```

Jika berhasil, akan muncul:
```
VITE v4.x.x  ready in xxx ms

➜  Local:   http://localhost:5173/
➜  Network: http://192.168.1.x:5173/
```

---

### **Langkah 5: Buka Aplikasi**

1. Buka browser
2. Akses: **http://localhost:5173**
3. Selamat! TabunganQu siap digunakan 🎉

---

## 📝 **Cara Menggunakan Aplikasi**

### **1. Register Akun Baru**
- Klik "Mulai Sekarang" di landing page
- Atau buka `/register`
- Isi form:
  - Nama lengkap
  - Email
  - Password (min 6 karakter)
- Centang "I'm not a robot"
- Klik "Daftar"

### **2. Login**
- Email dan password yang sudah didaftarkan
- Centang captcha
- Klik "Login"

### **3. Dashboard**
- Lihat ringkasan saldo
- Grafik pemasukan/pengeluaran
- Preview wishlist

### **4. Manajemen Transaksi (Saldo)**
- Tambah pemasukan/pengeluaran
- Pilih tanggal, nominal, dan keterangan
- **Opsional:** Pilih wishlist untuk auto-update tabungan
- Lihat riwayat transaksi per bulan
- Edit atau hapus transaksi

### **5. Manajemen Wishlist**
- Buat target tabungan baru
- Lihat progress dalam bentuk persen dan bar
- Update tabungan manual
- Auto-update dari transaksi (jika dipilih)

### **6. Settings**
- Update profil
- Ganti password
- Hapus akun (zona berbahaya)

---

## 🎯 **Fitur Auto-Update Wishlist**

Fitur ini memudahkan kamu menabung secara otomatis:

1. **Buat wishlist** (contoh: "Laptop Gaming")
2. **Saat tambah transaksi** di halaman Saldo
3. **Pilih wishlist** dari dropdown yang muncul
4. **Simpan transaksi**
5. **Wishlist otomatis terupdate** sesuai nominal transaksi
6. **Notifikasi sukses** akan muncul

---

## 🔧 **Troubleshooting**

### **Error: Database connection failed**
```bash
# Cek apakah MySQL running
mysql -u root -p

# Cek kredensial di .env backend
# Pastikan DB_PASSWORD sesuai
```

### **Error: Port already in use**
```bash
# Cek proses yang menggunakan port (Mac/Linux)
lsof -i :5000
kill -9 <PID>

# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F
```

### **Error: Cannot find module 'xxx'**
```bash
# Install ulang dependencies
rm -rf node_modules package-lock.json
npm install
```

### **Error: API not responding**
```bash
# Cek apakah backend running
curl http://localhost:5000/api/health
# Harus return JSON dengan success: true
```

### **Error: Login gagal meskipun email benar**
```bash
# Cek user di database
mysql -u root -p
USE tabunganqu_db;
SELECT * FROM users WHERE email = 'email@example.com';
```

---

## 📁 **Struktur Proyek**

```
tabunganqu/
├── frontend/                 # React Frontend
│   ├── public/               # Static files
│   ├── src/
│   │   ├── components/       # Reusable components
│   │   │   ├── layout/       # Layout components
│   │   │   └── ui/           # UI components
│   │   ├── context/          # React Context
│   │   ├── pages/            # Pages
│   │   ├── services/         # API services
│   │   ├── utils/            # Helper functions
│   │   ├── App.jsx           # Main app
│   │   └── main.jsx          # Entry point
│   ├── .env                  # Environment variables
│   ├── index.html            # HTML template
│   └── package.json
│
└── backend/                  # Node.js Backend
    ├── src/
    │   ├── config/           # Database config
    │   ├── controllers/       # Business logic
    │   ├── middleware/        # Auth & validation
    │   ├── models/           # Database models
    │   ├── routes/           # API routes
    │   └── app.js            # Express app
    ├── .env                  # Environment variables
    ├── server.js             # Entry point
    └── package.json
```

---

## 🚀 **Deployment (Production)**

### **Backend Deployment**
1. Setup production database (MySQL cloud)
2. Update `.env` dengan production values
3. Gunakan PM2 untuk run backend:
```bash
npm install -g pm2
pm2 start server.js --name tabunganqu-api
```

### **Frontend Deployment**
```bash
npm run build
# Upload folder `dist` ke Vercel/Netlify
```

---

## 👨‍💻 **Developer**

- **Nama:** [Nama Kamu]
- **Email:** [Email Kamu]
- **Project:** Capstone Project - Dicoding

---

## 📄 **Lisensi**

© 2026 TabunganQu. All rights reserved.

---

## 🎉 **Selamat Mencoba!**

Ada pertanyaan atau masalah? Silakan hubungi developer. Happy saving! 💰✨