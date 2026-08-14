# Phase 7: WhatsApp Notification & Integration - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-08-14
**Phase:** 07-whatsapp-notification-integration
**Areas discussed:** Template Pesan WhatsApp, Format & Validasi Nomor Telepon, Target Notifikasi Admin & Operator, Logging & Audit Dispatch Notifikasi

---

## Template Pesan WhatsApp

| Option | Description | Selected |
|--------|-------------|----------|
| Struktur Semi-Formal + Emoji & Bold Fields | Header status jelas, detail rapi (Kode Ref, Fasilitas, Jadwal WIB, Pemohon), link tracking langsung, dan footer instansi. | ✓ |
| Format Minimalis & Ringkas | Pesan singkat to-the-point tanpa banyak atribut. | |
| Format Surat Resmi (Formal Lengkap) | Bahasa sangat baku resmi kedinasan. | |

**User's choice:** Struktur Semi-Formal + Emoji & Bold Fields
**Notes:** Dynamic base URL menggunakan `APP_BASE_URL` (production default: `https://sarpras.ppkasn.id`, fallback `http://localhost:3000` di dev), dan template penolakan wajib mencantumkan alasan penolakan secara eksplisit (*Alasan Penolakan:* [reason]).

---

## Format & Validasi Nomor Telepon (Sanitization)

| Option | Description | Selected |
|--------|-------------|----------|
| Auto-sanitize agresif | Hapus semua karakter non-angka, konversi awalan 08 dan +62 menjadi 628, validasi 10-15 digit, skip aman jika invalid. | ✓ |
| Validasi ketat di form saja | Tolak input di form jika tidak sesuai. | |
| Sanitize standar | Hanya hapus spasi dan strip. | |

**User's choice:** Auto-sanitize agresif
**Notes:** Form booking wizard publik juga dilengkapi hint ("Nomor WhatsApp Aktif: contoh 08123456789") dan validasi Zod.

---

## Target Notifikasi Admin & Operator

| Option | Description | Selected |
|--------|-------------|----------|
| Multi-target Fleksibel | Dukung nomor tunggal, multiple nomor (koma terpisah), dan Fonnte WhatsApp Group ID via `FONNTE_ADMIN_TARGET`. | ✓ |
| Hanya nomor tunggal | Hanya 1 nomor HP admin. | |
| Hanya Group ID | Khusus WhatsApp group ID. | |

**User's choice:** Multi-target Fleksibel
**Notes:** Notifikasi ke admin dipicu saat booking baru dibuat (WA-07, WA-08) dan saat permohonan dibatalkan oleh pemohon.

---

## Logging & Audit Dispatch Notifikasi

| Option | Description | Selected |
|--------|-------------|----------|
| Catat ke audit_logs + Console logger | Tabel `audit_logs` menyimpan record dispatch lengkap dengan metadata (target, event_type, status success/failed/mock, response/error). | ✓ |
| Hanya console logger | Tanpa audit_logs. | |
| Tabel baru terpisah | Membuat tabel database baru. | |

**User's choice:** Catat ke audit_logs + Console logger
**Notes:** Dilengkapi Pretty-printed Mock Logger saat token Fonnte kosong/dalam dev/test agar developer workflow dan automated testing tetap lancar dan mudah di-inspect.

---

## the agent's Discretion

- Desain detail payload dan client wrapper Fonnte (`https://api.fonnte.com/send`).
- Implementasi non-blocking dispatch isolation agar latency Fonnte tidak mempengaruhi respons API / transaksi database.

## Deferred Ideas

- Bot dua arah / interaktif menu WhatsApp.
- Multi-channel notification (SMS / Email).
