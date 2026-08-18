# 🔌 Referensi Server Functions & API

Sistem SARPRAS memanfaatkan **TanStack Start Server Functions (`createServerFn`)** sebagai antarmuka RPC (*Remote Procedure Call*) bertipe data ketat (*fully type-safe*) antara klien dan server.

---

## 🌐 1. Server Functions Publik (Public API)

Fungsi-fungsi ini dapat diakses oleh masyarakat umum / pemohon tanpa memerlukan autentikasi login staf.

### `getPublicAssets`
Mengambil daftar seluruh sarana dan prasarana aktif beserta kapasitas dan lokasinya.
- **Metode**: `GET`
- **Parameter Input**: Tidak ada / opsional filter `type`
- **Output**: Array objek aset (`id`, `name`, `type`, `location`, `capacity`, `status`)

### `getAssetById`
Mengambil informasi detail satu aset tertentu termasuk jadwal operasionalnya.
- **Metode**: `GET`
- **Parameter Input**: `{ data: { id: string } }` (UUID Aset)
- **Output**: Objek aset lengkap beserta relasi `availability` dan `closures`

### `checkAvailability`
Mengevaluasi ketersediaan aset pada rentang tanggal dan jam tertentu (*pre-flight check*).
- **Metode**: `GET` / `POST`
- **Parameter Input**:
  ```typescript
  {
    assetId: string;   // UUID
    startDate: string; // ISO 8601 string (e.g. "2026-08-20T01:30:00.000Z")
    endDate: string;   // ISO 8601 string (e.g. "2026-08-20T09:00:00.000Z")
  }
  ```
- **Output**: `{ available: boolean, conflictReason?: string }`

### `createBooking`
Membuat permohonan peminjaman fasilitas baru.
- **Metode**: `POST`
- **Parameter Input (Zod Validated)**:
  ```typescript
  {
    assetId: string;
    requesterName: string;
    requesterEmail: string;
    requesterPhone: string;
    requesterOrganization: string;
    purpose: string;
    attendance: number;
    startDate: string;
    endDate: string;
  }
  ```
- **Output**: Objek pemesanan yang berhasil dibuat beserta `id` (kode referensi pelacakan).

### `getBookingByRef`
Mengambil status detail permohonan peminjaman berdasarkan ID referensi.
- **Metode**: `GET`
- **Parameter Input**: `{ data: { ref: string } }` (UUID Booking)
- **Output**: Objek booking lengkap dengan nama aset dan riwayat status terkini.

### `cancelBooking`
Membatalkan permohonan peminjaman oleh pemohon secara mandiri.
- **Metode**: `POST`
- **Parameter Input**:
  ```typescript
  {
    bookingId: string;
    rejectionReason: string; // Wajib diisi (minimal 5 karakter)
  }
  ```
- **Output**: `{ success: true, message: "Permohonan berhasil dibatalkan." }`

---

## 🔒 2. Server Functions Administratif (Admin API)

Fungsi-fungsi ini diproteksi oleh middleware autentikasi dan otorisasi peranan (*RBAC Guard*).

### `getAdminBookings`
Mengambil antrean permohonan peminjaman dengan filter status, rentang tanggal, dan pencarian nama.
- **Akses**: `admin`, `operator`, `pimpinan`
- **Parameter Input**: `{ status?: string, assetId?: string, search?: string, limit?: number, offset?: number }`
- **Output**: Daftar booking beserta data pemohon dan aset.

### `approveBooking`
Menyetujui permohonan peminjaman fasilitas.
- **Akses**: `admin`, `operator`, `pimpinan`
- **Parameter Input**: `{ bookingId: string }`
- **Output**: Objek booking terbarui dengan status `'approved'`.

### `rejectBooking`
Menolak permohonan peminjaman fasilitas dengan alasan resmi.
- **Akses**: `admin`, `operator`, `pimpinan`
- **Parameter Input**:
  ```typescript
  {
    bookingId: string;
    rejectionReason: string; // Wajib diisi
  }
  ```
- **Output**: Objek booking terbarui dengan status `'rejected'`.

### `createAsset` / `updateAsset` / `deleteAsset`
Operasi CRUD pada katalog sarana dan prasarana.
- **Akses**: `admin`, `operator` (untuk Tambah/Edit), `admin` (untuk Hapus)
- **Parameter Input**: Skema aset (`name`, `type`, `location`, `capacity`, `status`)

### `getAuditLogs`
Mengambil riwayat log audit mutasi data sistem.
- **Akses**: `admin`, `pimpinan`
- **Parameter Input**: `{ entityType?: string, limit?: number }`
- **Output**: Array entri `audit_logs` terbaru.

---

## ⚠️ Konvensi Penanganan Galat (Error Handling)

Setiap galat dari Server Functions mengembalikan format respons terstruktur:

| Kode Status | Deskripsi | Penanganan Klien |
| :--- | :--- | :--- |
| `400 Bad Request` | Validasi input Zod gagal | Menampilkan pesan error di bawah field form terkait |
| `401 Unauthorized` | Belum login atau sesi kedaluwarsa | Redirect ke halaman `/login` |
| `403 Forbidden` | Peran pengguna tidak mencukupi | Menampilkan halaman *Access Denied* |
| `404 Not Found` | Aset atau kode booking tidak ditemukan | Menampilkan halaman *Not Found* |
| `409 Conflict` | Terjadi bentrok jadwal peminjaman | Meminta pengguna memilih rentang waktu lain |
| `500 Server Error` | Kesalahan internal server | Menampilkan toast alert kesalahan sistem |
