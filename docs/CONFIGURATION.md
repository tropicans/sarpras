# ⚙️ Configuration & Environment Variables

Dokumen ini memuat seluruh variabel lingkungan (*environment variables*), parameter koneksi, dan konfigurasi sistem Sarpras PPKASN.

---

## 📋 Daftar Variabel Lingkungan (`.env`)

| Variabel | Tipe | Default / Contoh | Deskripsi |
| :--- | :--- | :--- | :--- |
| `DATABASE_URL` | String (URI) | `postgres://postgres:password@localhost:5432/sarpras_db` | Connection string basis data PostgreSQL |
| `BETTER_AUTH_SECRET` | String | `your_auth_secret_32_chars` | Kunci rahasia untuk enkripsi sesi dan token Better Auth |
| `BETTER_AUTH_URL` | String (URL) | `http://localhost:3000` | URL basis aplikasi untuk Better Auth callback dan redirect |
| `APP_BASE_URL` | String (URL) | `http://localhost:3000` | URL publik aplikasi untuk tautan notifikasi tracking & persetujuan |
| `FONNTE_API_TOKEN` | String | `your_fonnte_token` | Token API Fonnte WhatsApp Gateway |
| `FONNTE_ADMIN_TARGET` | String | `6281234567890` | Nomor WhatsApp / Group ID admin untuk alert booking baru |
| `FONNTE_MOCK` | Boolean | `false` | Paksa mode console mock untuk pengujian lokal WhatsApp |
| `RESEND_API_KEY` | String | `re_123456789` | API Key Resend untuk pengiriman email transaksional |
| `EMAIL_FROM` | String | `Sarpras PPKASN <sarpras@ppkasn.lan.go.id>` | Alamat email pengirim resmi sistem |
| `EMAIL_ADMIN_TARGET` | String | `admin@ppkasn.lan.go.id,operator@ppkasn.lan.go.id` | Daftar email penerima alert admin (dipisahkan koma) |
| `RESEND_MOCK` | Boolean | `false` | Paksa mode console mock untuk pengujian lokal Email |

---

## 🔒 Praktik Keamanan Konfigurasi

1. **Pemisahan Environment:** Jangan pernah melakukan commit file `.env` yang berisi kredensial asli ke git repository. Gunakan `.env.example` sebagai referensi.
2. **Rotasi Kunci:** Lakukan rotasi berkala untuk `BETTER_AUTH_SECRET`, `FONNTE_API_TOKEN`, dan `RESEND_API_KEY`.
3. **Mode Mock Lokal:** Dalam lingkungan pengembangan atau testing offline, biarkan `FONNTE_MOCK=true` dan `RESEND_MOCK=true` agar tidak menggunakan kuota SMS/Email dan mencetak payload ke terminal.

---

## 🎛️ Konfigurasi Pool Database (`src/db/client.server.ts`)

```typescript
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20, // Maksimum koneksi aktif
  idleTimeoutMillis: 30000, // Timeout koneksi idle
  connectionTimeoutMillis: 5000, // Timeout koneksi baru
});
```
