# 📱 TabunganQu - Aplikasi Pengelola Keuangan Pribadi

TabunganQu adalah aplikasi **Full Stack** untuk mengelola keuangan pribadi dengan fitur pencatatan transaksi, wishlist tabungan, dan dashboard interaktif. Dibangun dengan React.js (Frontend) dan Node.js + Express (Backend) dengan database MySQL.

## 🚀 Cara View README.md

Buka file README.md di Visual Studio Code

Tekan:
Ctrl + Shift + V

👉 langsung muncul preview

## ✨ Fitur Utama

- 🔐 **Autentikasi** - Register, Login, Logout dengan JWT
- 💰 **Manajemen Transaksi** - Catat pemasukan & pengeluaran
- 🎯 **Wishlist Tabungan** - Buat target tabungan dan lacak progress
- 📊 **Dashboard Interaktif** - Ringkasan keuangan dengan chart
- 🤖 **Auto-Update Wishlist** - Tabungan otomatis terupdate dari transaksi
- 🔍 **Filter & Search** - Cari transaksi per bulan dan wishlist
- 📱 **Responsive Design** - Bisa diakses dari HP, tablet, dan desktop

---

## 🛠️ **Teknologi yang Digunakan**

### **Frontend:**
- React.js 19
- Vite (Module Bundler)
- TailwindCSS (Styling)
- React Router DOM (Routing)
- Recharts (Chart & Grafik)
- Axios (HTTP Client)

### **Backend:**
- Node.js
- Express.js
- MySQL (Database)
- JWT (Authentication)
- Bcrypt (Password Hashing)
- Express Validator (Validation)

---

## 📋 **Prasyarat**

Sebelum menjalankan aplikasi, pastikan kamu sudah menginstall:

1. **Node.js** (v18 atau lebih baru) - [Download](https://nodejs.org)
2. **MySQL** (v8 atau lebih baru) - [Download](https://www.mysql.com/downloads/)
3. **Git** (opsional) - [Download](https://git-scm.com)
4. **Browser Modern** (Chrome, Firefox, Edge, dll)

Cek instalasi:
```bash
node --version
npm --version
mysql --version
```

---

## 🚀 **Cara Menjalankan Aplikasi**

### **Langkah 1: Clone Repository**
```bash
git clone https://github.com/username/tabunganqu.git
cd tabunganqu
```

Atau jika tidak menggunakan Git, download ZIP dan extract.

---

### **Langkah 2: Setup Database MySQL**

#### **2.1 Login ke MySQL**
```bash
mysql -u root -p
# Masukkan password MySQL kamu
```

#### **2.2 Buat Database dan Tables**
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
    password VARCHAR(255) NOT NULL,
    avatar VARCHAR(255) NULL,
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

-- Show tables
SHOW TABLES;

-- Exit MySQL
EXIT;
```

---

### **Langkah 3: Setup Backend**

#### **3.1 Masuk ke folder backend**
```bash
cd backend
```

#### **3.2 Install dependencies**
```bash
npm install
```

#### **3.3 Buat file .env**
Buat file `.env` di folder `backend` dengan isi:

```env
# Server Configuration
PORT = 5000
NODE_ENV = development

# Database Configuration
DB_HOST = localhost
DB_USER = root
DB_PASSWORD = your_mysql_password_here  # GANTI dengan password MySQL kamu
DB_NAME = tabunganqu_db

# JWT Configuration
JWT_SECRET = tabunganqu_super_secret_key_2026  # GANTI untuk production
JWT_EXPIRE = 7d

# CORS Configuration
CLIENT_URL = http://localhost:5173
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