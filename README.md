# 🏢 Sarpras PPKASN - Sistem Informasi Sarana & Prasarana

Sistem informasi reservasi fasilitas dan aset terpadu berbasis web untuk Pusat Pengembangan Kompetensi ASN (PPKASN) Kemensetneg RI. Dibangun menggunakan **TanStack Start (React 19)**, **Tailwind CSS v4**, dan **PostgreSQL** dengan **Drizzle ORM**.

---

## ✨ Fitur Utama

- 🔍 **Katalog & Ketersediaan Aset Real-Time:** Eksplorasi fasilitas (ruang rapat, asrama/dormitory, kendaraan, lapangan, peralatan) dengan jam operasional dan filter dinamis.
- 📋 **Wizard Reservasi 3-Langkah:** Pemilihan jadwal & kapasitas -> Data pemohon & organisasi -> Verifikasi & review permohonan.
- 🛡️ **Pencegahan Double-Booking Bertingkat:** Validasi ketersediaan pre-flight pada client dan proteksi bentrok jadwal tingkat database.
- 📱 **Notifikasi Dual-Channel Otomatis:** Integrasi instan WhatsApp Gateway ([Fonnte](https://fonnte.com)) dan Email Transaksional ([Resend](https://resend.com)) dengan fallback console mock.
- 🔎 **Pelacakan Permohonan & Pembatalan Mandiri:** Tracking status pengajuan real-time via kode referensi booking unik (`/status/:ref`).
- 📊 **Panel Administrator & Kalender Interaktif:** Kalender visual terpadu, review drawer permohonan, persetujuan/penolakan dengan alasan, dan inspeksi audit trail.
- 🔐 **Autentikasi & Keamanan Ketat:** Better Auth dengan Two-Factor Authentication (TOTP 2FA), Session Cookie, dan Hierarchical Role-Based Access Control (`admin`, `operator`, `pimpinan`).

---

## 🛠️ Tech Stack

- **Framework:** [TanStack Start](https://tanstack.com/start) & [TanStack Router](https://tanstack.com/router)
- **UI Library:** React 19 (`react: ^19.2.0`, `react-dom: ^19.2.0`)
- **Styling:** [Tailwind CSS v4](https://tailwindcss.com), `tw-animate-css`, `lucide-react`
- **Database & ORM:** PostgreSQL 16+ via [Drizzle ORM](https://orm.drizzle.team) (`pg: ^8.23.0`)
- **Autentikasi:** [Better Auth](https://better-auth.com) dengan TOTP Two-Factor Plugin
- **Linter & Formatter:** [Biome](https://biomejs.dev)
- **Runtime & Tests:** Node.js v22 (Native Test Runner via `tsx`)

---

## ⚡ Memulai Cepat (Quick Start)

### 1. Prasyarat
- Node.js `>= 20.x` atau `22.x`
- `pnpm` (`npm i -g pnpm`)
- PostgreSQL 15+ (lokal atau via Docker)

### 2. Instalasi & Konfigurasi
```bash
# Clone repository
git clone https://github.com/tropicans/sarpras.git
cd sarpras

# Salin konfigurasi environment
cp .env.example .env

# Install dependensi
pnpm install

# Jalankan migrasi database
pnpm db:migrate
```

### 3. Menjalankan Server Pengembangan
```bash
pnpm dev
```
Aplikasi berjalan di [http://localhost:3000](http://localhost:3000).

---

## 📜 Perintah Script Tersedia

| Perintah | Deskripsi |
| :--- | :--- |
| `pnpm dev` | Menjalankan Vite development server pada port 3000 |
| `pnpm build` | Membangun bundle produksi (client & server) |
| `pnpm start` | Menjalankan migrasi Drizzle dan server produksi `prod-server.js` |
| `pnpm test` | Menjalankan seluruh test suite unit & integrasi |
| `pnpm check` | Menjalankan linter dan formatter Biome |
| `pnpm format` | Memformat kode secara otomatis via Biome |
| `pnpm db:generate` | Menghasilkan file migrasi SQL Drizzle dari `schema.ts` |
| `pnpm db:migrate` | Mengeksekusi migrasi Drizzle ke database target |
| `pnpm db:migrate-legacy` | Mengimpor data historis JSON legacy ke PostgreSQL |

---

## 📚 Dokumentasi Lengkap

Dokumentasi arsitektur, API, skema basis data, dan panduan operasional tersedia lengkap di folder [`docs/`](./docs):

- 🏗️ [**Arsitektur Sistem**](./docs/architecture.md)
- 🗄️ [**Skema Database & ERD**](./docs/database-schema.md)
- 🔄 [**Alur Booking & State Machine**](./docs/booking-lifecycle.md)
- 🔐 [**Autentikasi & RBAC**](./docs/authentication-rbac.md)
- 🔔 [**Sistem Notifikasi Dual-Channel**](./docs/notifications.md)
- 🔌 [**Referensi Server Functions & API**](./docs/api-reference.md)
- 🚀 [**Deployment & Operasional**](./docs/deployment-operations.md)
- 🧪 [**Panduan Pengujian (Testing)**](./docs/TESTING.md)
- ⚙️ [**Konfigurasi Environment**](./docs/CONFIGURATION.md)
- 👥 [**Panduan Pengguna**](./docs/user-guide.md)
- 💻 [**Panduan Pengembang**](./docs/developer-guide.md)

---

## 📄 Lisensi
Hak Cipta © 2026 PPKASN / BKN. Seluruh hak cipta dilindungi undang-undang.
