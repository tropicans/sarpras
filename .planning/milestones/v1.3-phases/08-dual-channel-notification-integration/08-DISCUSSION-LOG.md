# Phase 8: Dual-Channel Notification Integration - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-08-14
**Phase:** 08-dual-channel-notification-integration
**Areas discussed:** Desain & Format Email Template, Strategi Orkestrasi Dual-Channel, Konfigurasi Penerima Notifikasi Admin & Mock Logger, Skema & Audit Logging Notifikasi

---

## Desain & Format Email Template

| Option | Description | Selected |
|--------|-------------|----------|
| Template HTML institusional modern | Header logo/nama PPKASN, badge status warna (kuning/hijau/merah), tabel ringkasan jadwal WIB & fasilitas, tombol CTA (Cek Status/Review), dan footer resmi. Dilengkapi versi plaintext yang rapi. | ✓ |
| Template HTML minimalis | Layout sederhana berbasis teks dengan formatting tabel bersih dan link tombol direct URL. | |
| Template berbasis markdown | Konversi otomatis ke HTML sederhana. | |

**User's choice:** Template HTML institusional modern lengkap dengan versi plaintext yang rapi.
**Notes:** Otomatis sertakan kedua versi (HTML responsif + Plaintext) di setiap pengiriman Resend untuk kompatibilitas penuh email client.

---

## Strategi Orkestrasi Dual-Channel

| Option | Description | Selected |
|--------|-------------|----------|
| Non-blocking concurrent dispatch (`Promise.allSettled`) | Kirim Email & WhatsApp secara paralel setelah commit DB. Kegagalan salah satu channel dicatat ke audit log tanpa menggagalkan channel lain atau operasi database. | ✓ |
| Sequential dispatch | Kirim WhatsApp dulu, jika sukses lalu kirim Email secara berurutan. | |

**User's choice:** Non-blocking concurrent dispatch (`Promise.allSettled`).
**Notes:** Kegagalan salah satu gateway tidak boleh mempengaruhi transaksi database atau channel notifikasi lainnya.

---

## Konfigurasi Penerima Notifikasi Admin & Mock Logger

| Option | Description | Selected |
|--------|-------------|----------|
| Multi-target Email Admin | Kirim alert notifikasi admin ke semua email yang terdaftar di `ADMIN_DEFAULT_EMAIL` (mendukung comma-separated). | ✓ |
| Single-target Email Admin | Kirim alert admin hanya ke alamat email pertama di daftar. | |

| Option | Description | Selected |
|--------|-------------|----------|
| Resend Mock Logger | Sediakan Resend Mock Logger yang mencetak visualisasi email (To, Subject, HTML/Text preview) ke console saat `RESEND_API_KEY` kosong, `RESEND_MOCK=true`, atau di testing. | ✓ |
| Silent no-op | Skip pengiriman secara hening tanpa output console saat API key tidak ada. | |

**User's choice:** Multi-target email admin + Resend Mock Logger dengan console ASCII box preview.

---

## Skema & Audit Logging Notifikasi

| Option | Description | Selected |
|--------|-------------|----------|
| Audit log terpisah per channel | Action `notification.email_dispatch` untuk email dan `notification.whatsapp_dispatch` untuk WhatsApp, dengan metadata lengkap (target, templateType, status `sent`\|`mocked`\|`failed`, error). | ✓ |
| Audit log terpadu | Action tunggal `notification.dispatch` dengan field channel di metadata. | |

**User's choice:** Audit log terpisah per channel (`notification.email_dispatch` dan `notification.whatsapp_dispatch`).

---

## the agent's Discretion

- Standard email container styling (max-width: 600px, inline CSS styling, clean system font stacks).
- Email validation logic using standard RFC 5322 regex validation.

## Deferred Ideas

- Inbound email webhook parsing / automatic replies.
- PDF e-ticket / surat izin peminjaman email attachments.
