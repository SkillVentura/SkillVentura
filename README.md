# Panduan Teknis & Setup Proyek — SkillVentura

Dokumen ini merupakan panduan resmi bagi **Tim IT / Developer** untuk melakukan instalasi, konfigurasi environment, deployment, serta inisialisasi data awal pada aplikasi **SkillVentura**.

---

## 1. Spesifikasi Teknis Proyek

| Komponen | Spesifikasi yang Digunakan |
| :--- | :--- |
| **Backend** | PHP `>= 8.4`, Laravel `12.x` |
| **Frontend** | React `19.x`, TypeScript `5.7`, Inertia.js `2.0`, Tailwind CSS `4.0`, Vite `7` |
| **Database Utama** | **MongoDB** (`mongodb/laravel-mongodb` `^5.8`) — digunakan untuk seluruh koleksi data, *Session*, *Cache*, dan *Queue* |
| **Penyimpanan File (Storage)** | **Laravel Cloud Object Storage (S3 / Cloudflare R2)** dengan *Internal Media Proxy* pada route `/media/{path}` |
| **Autentikasi** | Laravel Fortify (Email/Password & 2FA) + Laravel Socialite (Google OAuth 2.0) |
| **Generator Sertifikat** | `barryvdh/laravel-dompdf` (`^3.1`) |

---

## 2. Prasyarat Server / Perangkat Lokal

Pastikan perangkat lokal atau server memiliki komponen berikut sebelum menjalankan instalasi:

1. **PHP `>= 8.4`** dengan ekstensi berikut wajib aktif di `php.ini`:
   - `ext-mongodb` (**Wajib** — tanpa ekstensi ini `composer install` akan gagal)
   - `ext-gd` dan `ext-dom` (**Wajib** — digunakan oleh `DomPDF` untuk merender sertifikat PDF)
   - `ext-mbstring`, `ext-xml`, `ext-curl`, `ext-openssl`
   - Cek status ekstensi MongoDB dengan perintah:
     ```bash
     php --ri mongodb
     ```
2. **Composer `>= 2.x`**
3. **Node.js `>= 20.x`** dan **npm**

---

## 3. Layanan Eksternal yang Harus Disiapkan

Sebelum menjalankan aplikasi, siapkan 4 kredensial layanan berikut untuk dimasukkan ke dalam file `.env`:

### A. MongoDB Atlas
1. Buat cluster dan database bernama `skillventura` di [MongoDB Atlas](https://cloud.mongodb.com).
2. Buat *Database User* dengan hak akses `readWrite` pada database `skillventura`.
3. Masuk ke menu **Security $\rightarrow$ Network Access** di MongoDB Atlas:
   - Daftarkan IP perangkat/server Anda, atau tambahkan `0.0.0.0/0` jika aplikasi dijalankan di Laravel Cloud.
4. Salin **Connection String** (`mongodb+srv://...`) untuk variabel `DB_DSN`.

### B. Laravel Cloud Object Storage (S3 Bucket)
Digunakan untuk menyimpan seluruh file upload (avatar karakter, rank, badge, thumbnail course, gambar/dokumen materi modul, lampiran forum, file quest, desain sertifikat, PDF sertifikat, tanda tangan digital, dan banner donasi).
- Siapkan kredensial bucket: `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_BUCKET`, dan `AWS_ENDPOINT`.
- Bucket **tidak perlu** dibuat publik (`AWS_URL` tidak digunakan). Seluruh file S3 di-stream secara internal melalui route aplikasi `/media/{path}` (`App\Http\Controllers\MediaController`).

### C. Google OAuth 2.0 (Login dengan Google)
1. Buat *OAuth 2.0 Client ID* di [Google Cloud Console](https://console.cloud.google.com/apis/credentials).
2. Daftarkan **Authorized Redirect URI** berikut:
   - Lokal: `http://localhost:8000/auth/google/callback`
   - Production: `https://<domain-aplikasi>/auth/google/callback`
3. Salin `GOOGLE_CLIENT_ID` dan `GOOGLE_CLIENT_SECRET`.

### D. SMTP Email (Google App Password)
Digunakan untuk pengiriman email *Forgot Password / Reset Password*:
1. Aktifkan *2-Step Verification* pada akun Gmail pengirim.
2. Buat **App Password** (16 karakter tanpa spasi) di menu *Google Account $\rightarrow$ Security $\rightarrow$ App Passwords*.

---

## 4. Langkah Instalasi Pertama Kali (Local Development)

### Langkah 1: Clone & Install Dependensi
```bash
git clone <repository-url> skillmongo
cd skillmongo

composer install
npm install
```

### Langkah 2: Salin & Konfigurasi `.env`
```bash
cp .env.example .env
php artisan key:generate
```

Buka file `.env` dan sesuaikan nilainya seperti berikut:
```dotenv
APP_NAME="SkillVentura"
APP_ENV=local
APP_DEBUG=true
APP_URL=http://localhost:8000

# 1. Database MongoDB
DB_CONNECTION=mongodb
DB_DSN="mongodb+srv://<username>:<password>@<cluster>.mongodb.net/?retryWrites=true&w=majority&appName=SkillVentura"
DB_DATABASE=skillventura

SESSION_DRIVER=mongodb
CACHE_STORE=mongodb
QUEUE_CONNECTION=mongodb

# 2. Object Storage (S3)
FILESYSTEM_DISK=s3
AWS_ACCESS_KEY_ID="<access_key_id>"
AWS_SECRET_ACCESS_KEY="<secret_access_key>"
AWS_DEFAULT_REGION=auto
AWS_BUCKET="<nama_bucket>"
AWS_ENDPOINT="https://<account_id>.r2.cloudflarestorage.com"
AWS_USE_PATH_STYLE_ENDPOINT=true

# 3. SMTP Email
MAIL_MAILER=smtp
MAIL_SCHEME=smtps
MAIL_HOST=smtp.gmail.com
MAIL_PORT=465
MAIL_USERNAME="<email_pengirim@gmail.com>"
MAIL_PASSWORD="<16_digit_google_app_password_tanpa_spasi>"
MAIL_FROM_ADDRESS="<email_pengirim@gmail.com>"
MAIL_FROM_NAME="${APP_NAME}"

# 4. Google OAuth
GOOGLE_CLIENT_ID="<google_client_id>"
GOOGLE_CLIENT_SECRET="<google_client_secret>"
GOOGLE_REDIRECT_URI="${APP_URL}/auth/google/callback"
```

### Langkah 3: Jalankan Migrasi Indeks MongoDB
```bash
php artisan migrate --force
```

### Langkah 4: Buat Akun Admin Pertama
Karena proyek ini tidak menggunakan *dummy seeder*, buat akun **Admin** pertama kali menggunakan perintah berikut:
```bash
php artisan tinker --execute "App\Models\User::updateOrCreate(['email' => 'admin@skillventura.com'], ['name' => 'Guild Master', 'username' => 'admin', 'password' => bcrypt('Admin123!'), 'role' => 'admin', 'email_verified_at' => now()]);"
```

### Langkah 5: Jalankan Aplikasi
```bash
composer run dev
```
Perintah di atas otomatis menjalankan `php artisan serve`, `php artisan queue:listen`, dan `npm run dev` (Vite) secara bersamaan.

---

## 5. Urutan Konfigurasi Awal di Dalam Aplikasi (Setelah Login Admin)

Jika aplikasi dijalankan pada database baru yang masih kosong, **Admin wajib mengisi data master berikut secara berurutan** agar alur *Student* dan *Mentor* berjalan normal:

1. **Master Assets (`/admin/assets`)**:
   - **Character (Wajib)**: Tambahkan minimal 1 *Character*. Setiap akun *Student* baru diwajibkan memilih karakter di `/select-character` (melalui middleware `has.character`) sebelum dapat mengakses `/dashboard`.
   - **Rank**: Tambahkan daftar *Rank* sesuai urutan level pangkat.
   - **Level Badge**: Tambahkan ikon *Badge* untuk level kursus.
   - **Certificate Design**: Unggah gambar *Background* dan *Logo* sertifikat, lalu klik **Set Active** agar template PDF sertifikat aktif.
2. **Digital Signature (`/settings/signature`)**:
   - Admin dan Mentor wajib menyimpan tanda tangan digital pada menu **Settings $\rightarrow$ Signature** agar tanda tangan tampil pada file PDF sertifikat kelulusan siswa.
3. **Role Pengguna (`/admin/users`)**:
   - Ubah role pengguna yang bertugas sebagai pengajar menjadi `mentor` melalui halaman `/admin/users`.
4. **Course & Kurikulum (`/admin/courses`)**:
   - Buat *Course* baru, lalu masuk ke **Course Builder** (`/admin/courses/{slug}`).
   - Buat **Basic Fundamental Path**, buat **Career Group** beserta penugasan Mentor (*Assign Mentor*), tambahkan **Module**, **Module Content**, dan **Final Quiz**.
   - Klik **Publish** agar *Course* tampil di halaman *Student*.
5. **Footer CMS & Donation Banner (`/admin/footer` & `/settings/donation-banner`)**:
   - Kelola informasi brand, tautan sosial media, serta konten halaman publik di `/admin/footer`.
   - Kelola gambar dan tautan banner donasi halaman utama di `/settings/donation-banner`.

---

## 6. Konfigurasi Deployment (Laravel Cloud)

### Build Commands
```bash
composer install --no-dev --no-interaction --prefer-dist --optimize-autoloader
npm ci --audit false
npm run build
```

### Deploy Commands
```bash
php artisan migrate --force
```

### Ketentuan Environment Variables di Production
- Pastikan `APP_ENV=production`, `APP_DEBUG=false`, dan `APP_URL` menggunakan `https://`.
- Pastikan `DB_CONNECTION=mongodb`, `SESSION_DRIVER=mongodb`, `CACHE_STORE=mongodb`, dan `QUEUE_CONNECTION=mongodb`.
- Untuk SMTP dengan port `465`, gunakan `MAIL_SCHEME=smtps` (jangan gunakan variabel `MAIL_ENCRYPTION` karena sudah tidak digunakan di Laravel 12).

---

## 7. Pemeriksaan Kualitas Kode & Pengujian

```bash
# Format kode PHP sesuai standar proyek (Laravel Pint)
vendor/bin/pint

# Cek tipe TypeScript pada frontend React
npm run types

# Jalankan linter ESLint pada frontend
npm run lint

# Jalankan pengujian otomatis (Pest)
php artisan test --compact
```
