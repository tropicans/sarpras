# 🧪 Testing & Quality Assurance Guide

Sistem Sarpras PPKASN menerapkan pengujian otomatis menyeluruh pada level unit dan integrasi menggunakan Node.js native test runner (`node:test` dan `node:assert/strict`) dengan runner `tsx`.

---

## 🏃 Menjalankan Pengujian

### 1. Menjalankan Seluruh Test Suite
```bash
pnpm test
```

### 2. Menjalankan Uji Coba Spesifik
```bash
node --import tsx --test src/lib/assets/facilities.test.ts
node --import tsx --test src/lib/auth/rbac.test.ts
node --import tsx --test src/lib/booking/booking.test.ts
node --import tsx --test src/lib/notifications/service.test.ts
```

---

## 📂 Matriks Pengujian & Cakupan

| Modul | File Test | Cakupan & Kasus Uji |
| :--- | :--- | :--- |
| **Aset & Fasilitas** | `src/lib/assets/facilities.test.ts` | Sanitasi tag fasilitas dinamis, deduplikasi case-insensitive, pembatasan panjang (max 40 char) & jumlah (max 20 tags), preset kategori fallback |
| **Migrasi Database** | `src/db/migration.test.ts` | Integritas skema Drizzle, kolom jsonb (`room_layouts`, `facilities`), constraint tabel |
| **Autentikasi** | `src/db/auth.test.ts` | Better Auth adapter, session token persistence, password hashing |
| **RBAC** | `src/lib/auth/rbac.test.ts` | Evaluasi hierarki role (`admin` > `pimpinan` > `operator`), proteksi middleware |
| **Two-Factor (2FA)** | `src/lib/auth/two-factor.test.ts` | Pendaftaran TOTP, validasi backup code, proteksi brute force lock |
| **Regresi 2FA Password** | `src/lib/auth/two-factor-password-bug.test.ts` | Verifikasi password saat mengaktifkan 2FA |
| **Engine Pemesanan** | `src/lib/booking/booking.test.ts` | Deteksi bentrok jadwal ruang, validasi jam operasional, proteksi double-booking |
| **Admin Pemesanan** | `src/lib/booking/admin.test.ts` | State machine persetujuan & penolakan dengan alasan wajib |
| **WhatsApp Gateway** | `src/lib/whatsapp/phone.test.ts`, `templates.test.ts`, `service.test.ts` | Normalisasi format telepon (08 / +62 / 62), perenderan template pesan, fallback mode mock |
| **Email Transaksional** | `src/lib/email/templates.test.ts`, `service.test.ts`, `tracking-url-bug.test.ts` | Validasi RFC 5322 email, perenderan HTML responsif, URL status tracking yang valid |
| **Notifikasi Terpadu** | `src/lib/notifications/service.test.ts` | Dispatch paralel dual-channel, penanganan nomor/email kosong tanpa error |

---

## ✍️ Standar Penulisan Test Baru

1. **Gunakan `node:test` dan `node:assert/strict`:** Tidak memerlukan library testing eksternal tambahan.
2. **Uji Kasus Positif, Negatif, dan Edge Cases:** Pastikan boundary values (misal string kosong, format nomor rusak, overlap tanggal bertabrakan pada detik yang sama) teruji.
3. **Isolasi Lingkungan:** Pastikan modul external (Fonnte/Resend) tidak memanggil API publik sungguhan saat test dijalankan.
