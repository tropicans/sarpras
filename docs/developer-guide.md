# 💻 Panduan Pengembang (Developer Guide)

Dokumen ini ditujukan bagi pengembang (*developers*) yang berkontribusi pada pengembangan basis kode **SARPRAS**.

---

## 🛠️ Prasyarat & Lingkungan Pengembangan

- **Node.js**: Versi `>= 20.x` atau **Bun** `>= 1.1.x`
- **Package Manager**: `pnpm` (direkomendasikan) atau `npm`
- **Basis Data**: PostgreSQL `16.x`
- **Ekstensi VS Code yang Direkomendasikan**:
  - Biome (`biomejs.biome`)
  - Tailwind CSS IntelliSense (`bradlc.vscode-tailwindcss`)
  - Drizzle ORM Extension

---

## 📁 Struktur Direktori Proyek

```
sarpras/
├── docs/                        # Dokumentasi resmi sistem
├── drizzle/                     # File migrasi SQL hasil generate Drizzle
├── src/
│   ├── components/              # Komponen React modular
│   │   ├── admin/               # Komponen khusus panel administrator
│   │   ├── booking/             # Komponen multi-step wizard booking
│   │   ├── public/              # Komponen antarmuka publik
│   │   └── ui/                  # Komponen atomik UI (Buttons, Badges, Modals)
│   ├── db/                      # Skema Drizzle ORM, auth server, migrasi
│   │   ├── schema.ts            # Definisi tabel PostgreSQL & relasi
│   │   ├── auth.server.ts       # Inisialisasi Better Auth instance
│   │   └── migrate.ts           # Runner migrasi Drizzle
│   ├── lib/                     # Domain logic, services, & utilities
│   │   ├── audit/               # Fungsi audit trail
│   │   ├── auth/                # Fungsi autentikasi & RBAC
│   │   ├── booking/             # Business logic pemesanan & tes unit
│   │   ├── email/               # Service & template email Resend
│   │   ├── notifications/       # Dual-channel notification orchestrator
│   │   └── whatsapp/            # Service & template WhatsApp Fonnte
│   ├── routes/                  # File-based routing (TanStack Router)
│   │   ├── __root.tsx           # Layout root aplikasi & providers
│   │   ├── index.tsx            # Beranda utama publik
│   │   ├── login.tsx            # Halaman login staf
│   │   ├── check-booking.tsx    # Halaman input kode referensi
│   │   ├── book/                # Rute formulir peminjaman ($assetId.tsx)
│   │   ├── status/              # Rute cek status ($ref.tsx)
│   │   └── admin/               # Rute panel admin (bookings, assets, calendar, users)
│   ├── routeTree.gen.ts         # Hasil generate otomatis rute TanStack
│   └── styles.css               # Definisi Tailwind CSS & tema global
├── package.json                 # Konfigurasi dependensi & scripts
├── tsconfig.json                # Konfigurasi TypeScript
├── biome.json                   # Konfigurasi linter & formatter
└── vite.config.ts               # Konfigurasi bundler Vite
```

---

## 🧭 Konvensi Routing (TanStack Router)

Aplikasi menggunakan **File-Based Routing** dari TanStack Router:
- Rute dinamis menggunakan tanda `$` (contoh: `src/routes/book/$assetId.tsx`).
- Rute layout menggunakan file induk (contoh: `src/routes/admin.tsx` membungkus seluruh `src/routes/admin/*.tsx`).
- Untuk memperbarui file pohon rute `src/routeTree.gen.ts`, jalankan:
  ```bash
  pnpm generate-routes
  ```

---

## 🧹 Code Quality & Linting (Biome)

Sistem menggunakan **Biome** sebagai linter dan formatter cepat:

```bash
# Memeriksa kepatuhan linter & kode
pnpm lint

# Memformat seluruh berkas kode
pnpm format

# Menjalankan linter + auto-fix
pnpm check --write
```

---

## 🧪 Menjalankan Pengujian Unit (Testing Suite)

Pengujian unit menggunakan modul native `node:test` dan `tsx`:

```bash
# Menjalankan seluruh pengujian unit
pnpm test
```

### Lingkup Pengujian Unit:
- `src/lib/booking/booking.test.ts`: Pengujian pencegahan bentrok jadwal dan integritas transaksi.
- `src/lib/auth/rbac.test.ts`: Pengujian matriks hak akses dan session guard.
- `src/lib/whatsapp/phone.test.ts`: Pengujian normalisasi format nomor telepon Indonesia.
- `src/lib/whatsapp/templates.test.ts`: Pengujian pembentukan pesan WhatsApp dan format WIB.
- `src/lib/email/templates.test.ts`: Pengujian HTML template email dan sanitasi input.
- `src/lib/notifications/service.test.ts`: Pengujian dual-channel dispatching dan fallback audit log.

---

## 🔀 Standarisasi Pesan Commit (Conventional Commits)

Format pesan commit mengikuti standar Conventional Commits:

```
<tipe>(<lingkup opsional>): <deskripsi singkat>

[bodi pesan opsional]
```

**Tipe yang umum digunakan:**
- `feat`: Penambahan fitur baru (contoh: `feat(booking): add self-service cancellation`)
- `fix`: Perbaikan bug (contoh: `fix(notifications): handle empty phone numbers safely`)
- `refactor`: Perubahan struktur kode tanpa mengubah fungsionalitas
- `docs`: Penambahan atau pembaruan dokumentasi
- `test`: Penambahan atau perbaikan unit test
