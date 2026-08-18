# 🔔 Sistem Notifikasi Dual-Channel

Dokumen ini memaparkan arsitektur, konfigurasi penyedia layanan, pemetaan kejadian (*event triggers*), serta mekanisme format pesan untuk mesin notifikasi terpadu **SARPRAS**.

---

## 📡 Arsitektur Notifikasi Terpadu

SARPRAS mengimplementasikan **Unified Dual-Channel Notification Orchestrator** yang secara otomatis mengirimkan notifikasi ke dua jalur paralel: **Email Transaksional (Resend)** dan **WhatsApp Gateway (Fonnte)**.

```mermaid
graph TD
    Trigger[Kejadian Permohonan Booking] --> Orchestrator[Notification Service Orchestrator]
    
    Orchestrator --> Formatter[Template & Timezone Formatter (WIB)]
    
    Formatter --> ResendWorker[Resend Email Dispatcher]
    Formatter --> FonnteWorker[Fonnte WhatsApp Dispatcher]
    
    ResendWorker -->|HTTP POST /emails| ResendAPI[Resend Cloud API]
    FonnteWorker -->|HTTP POST /send| FonnteAPI[Fonnte Gateway API]
    
    ResendAPI -.->|Status Pengiriman| AuditLogger[(audit_logs)]
    FonnteAPI -.->|Status Pengiriman| AuditLogger
```

---

## 🎯 Pemetaan Kejadian & Matriks Notifikasi

| Kejadian (*Event*) | Penerima | Saluran | Konten Notifikasi |
| :--- | :--- | :---: | :--- |
| **`booking.submitted`** | Pemohon | Email & WA | Bukti pengajuan, kode referensi unik, tautan cek status (`/status/:ref`). |
| **`booking.submitted`** | Admin / Pengelola | Email & WA | Peringatan permohonan baru masuk antrean, tautan verifikasi admin. |
| **`booking.approved`** | Pemohon | Email & WA | Surat konfirmasi persetujuan resmi, detail jadwal, dan tata tertib pemakaian. |
| **`booking.rejected`** | Pemohon | Email & WA | Pemberitahuan penolakan peminjaman disertai **Alasan Penolakan Resmi**. |
| **`booking.cancelled`** | Pemohon & Admin | Email & WA | Konfirmasi pembatalan pemesanan dan pengembalian ketersediaan slot jadwal. |

---

## 🕒 Standarisasi Format Waktu (WIB / Asia/Jakarta)

Seluruh waktu peminjaman dalam notifikasi diformat secara ketat dalam zona waktu **WIB (Waktu Indonesia Barat)** menggunakan utilitas `date-fns-tz` agar tidak membingungkan pemohon:

```typescript
// Contoh Format: "Kamis, 20 Agustus 2026 pukul 08:30 WIB"
formatInTimeZone(date, 'Asia/Jakarta', "EEEE, dd MMMM yyyy 'pukul' HH:mm 'WIB'", { locale: id });
```

---

## ✉️ Integrasi Email (Resend)

Pengiriman email menggunakan library resmi `resend` dengan template HTML modern, responsif untuk perangkat seluler, serta tombol aksi (*CTA Button*) yang jelas.

### Konfigurasi `.env`:
```ini
RESEND_API_KEY=re_123456789abcdef...
EMAIL_FROM=SARPRAS PPKASN <sarpras@ppkasn.lan.go.id>
EMAIL_ADMIN_TARGET=admin.sarpras@ppkasn.lan.go.id,operator@ppkasn.lan.go.id
RESEND_MOCK=false
```

---

## 📱 Integrasi WhatsApp (Fonnte)

Pengiriman pesan instan WhatsApp menggunakan Fonnte API (`https://api.fonnte.com/send`). Sebelum dikirim, nomor telepon pemohon melalui proses normalisasi otomatis:
- Menghilangkan karakter non-digit (spasi, tanda strip, kurung).
- Mengubah awalan lokal `08...` atau `+628...` menjadi kode negara `628...`.
- Menolak nomor yang tidak valid secara format.

### Konfigurasi `.env`:
```ini
FONNTE_API_TOKEN=your_fonnte_device_token_here
FONNTE_ADMIN_TARGET=6281234567890
FONNTE_MOCK=false
APP_BASE_URL=http://localhost:3000
```

---

## 🧪 Mode Mock & Pengujian (Failsafe & Test Isolation)

Untuk mencegah pengiriman email atau pesan WA yang tidak disengaja selama tahap pengujian unit atau pengembangan lokal:
- Jika `NODE_ENV === 'test'` atau API token tidak diisi, dispatcher secara otomatis beralih ke **Mock Mode**.
- Log pengiriman tetap dicatat pada konsol dan tabel `audit_logs` tanpa memicu panggilan API eksternal.
- Kegagalan jaringan atau kuota habis pada API eksternal **tidak akan membatalkan status booking** di database (*resilient fault-tolerance*).
