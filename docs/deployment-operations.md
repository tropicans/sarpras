# 🚀 Panduan Deployment & Operasional

Dokumen ini memandu proses pemasangan, konfigurasi *environment variables*, deployment menggunakan Docker, serta prosedur pemeliharaan basis data pada lingkungan produksi.

---

## 🐳 Deployment Berbasis Docker (Direkomendasikan)

SARPRAS dilengkapi dengan konfigurasi `Dockerfile` multi-stage build dan `docker-compose.yml` siap pakai.

```mermaid
graph LR
    Dev[Kode Sumber] --> BuildStage[Docker Build Stage: Node Alpine]
    BuildStage --> ProdImage[Docker Production Image (Dist + SSR)]
    ProdImage --> Container[Container SARPRAS App (Port 3000)]
    Container <--> Postgres[(PostgreSQL 16 Container)]
```

### 1. File Konfigurasi Environment (`.env`)
Salin template `.env.example` ke `.env` dan sesuaikan nilainya:

```ini
# --- Port & Environment ---
PORT=3000
NODE_ENV=production
APP_URL=https://sarpras.ppkasn.bkn.go.id

# --- Basis Data PostgreSQL ---
DATABASE_URL=postgres://sarpras_user:strong_password@postgres:5432/sarpras_db

# --- Better Auth Configuration ---
BETTER_AUTH_SECRET=generate_strong_random_secret_string_here_min_32_chars
BETTER_AUTH_URL=https://sarpras.ppkasn.bkn.go.id

# --- Layanan Email Transaksional (Resend) ---
RESEND_API_KEY=re_your_resend_api_key
EMAIL_FROM=SARPRAS PPKASN <sarpras@ppkasn.lan.go.id>
EMAIL_ADMIN_TARGET=admin.sarpras@ppkasn.lan.go.id,operator@ppkasn.lan.go.id
RESEND_MOCK=false

# --- WhatsApp Gateway (Fonnte) ---
FONNTE_API_TOKEN=your_fonnte_api_token
FONNTE_ADMIN_TARGET=6281234567890
FONNTE_MOCK=false
APP_BASE_URL=https://sarpras.ppkasn.lan.go.id
```

---

### 2. Menjalankan Layanan via Docker Compose

```bash
# 1. Build image dan jalankan seluruh container di background
docker compose up -d --build

# 2. Periksa status container yang berjalan
docker compose ps

# 3. Pantau log aplikasi secara real-time
docker compose logs -f app
```

---

## 🔄 Prosedur Migrasi & Seeding Basis Data

Sebelum aplikasi dibuka untuk pengguna pertama kali, jalankan langkah inisialisasi skema basis data:

```bash
# Jalankan migrasi tabel
docker compose exec app pnpm db:migrate

# Jalankan pembuatan akun Super Admin awal (Seeder)
docker compose exec app pnpm seed-admin
```

> [!IMPORTANT]
> Akun admin default yang dihasilkan oleh seeder memiliki kredensial:
> - **Email**: `admin@ppkasn.bkn.go.id`
> - **Password Default**: `Admin@123456`
> 
> Sangat disarankan untuk segera mengubah password default setelah login pertama kali!

---

## 💾 Prosedur Backup & Restore Basis Data

### Cadangkan Basis Data (Backup):
```bash
docker compose exec postgres pg_dump -U sarpras_user -d sarpras_db -F c -b -v -f /var/lib/postgresql/data/backup_$(date +%Y%m%d_%H%M%S).dump
```

### Pulihkan Basis Data (Restore):
```bash
docker compose exec -T postgres pg_restore -U sarpras_user -d sarpras_db -v -c < /path/ke/file_backup.dump
```

---

## 🩺 Pemeriksaan Kesehatan & Monitoring (Health Check)

- **Endpoint Status Aplikasi**: Akses `GET /` untuk memastikan server mengembalikan status HTTP 200.
- **Koneksi Database**: Jika koneksi basis data terputus, Server Functions akan mencatat error log dengan awalan `[DB_CONNECTION_ERROR]`.
- **Log Rotasi**: Pastikan Docker logging driver dikonfigurasi dengan batas ukuran (contoh: `max-size: "20m"`, `max-file: "5"`).
