# Phase 7: WhatsApp Notification & Integration - Technical Research

**Researched:** 2026-08-14
**Status:** Completed

## 1. Executive Summary

Phase 7 integrates WhatsApp notification capabilities into the Sarpras PPKASN booking platform using the Fonnte WhatsApp Gateway API (`https://api.fonnte.com/send`). The system will provide instant updates to booking requesters (submission receipt, approval confirmation, rejection with specific reason) and operational alerts to facility administrators.

To guarantee system resilience, the integration is designed around:
1. **Asynchronous Non-Blocking Execution**: Outbound WhatsApp HTTP requests run outside transactional database locks, ensuring gateway downtime or latency never blocks booking creation or status transitions.
2. **Deterministic Mock & Development Fallback**: When `FONNTE_API_TOKEN` is omitted or when running in local development/test modes, a styled console mock logger processes messages seamlessly.
3. **Rigorous Phone Sanitization**: Normalizes Indonesian phone numbers (`08...`, `+628...`, `628...`) into standardized international formats while supporting comma-separated numbers and WhatsApp group IDs (`@g.us`).
4. **Append-Only Audit Logging**: All dispatch attempts (success, failed, mock) are recorded into PostgreSQL `audit_logs` for traceability and diagnostics.

---

## 2. Fonnte Gateway API Specification

### 2.1 API Endpoint & Authentication
- **Endpoint**: `POST https://api.fonnte.com/send`
- **Headers**:
  ```http
  Authorization: <FONNTE_API_TOKEN>
  Content-Type: application/json
  ```
- **Request Payload**:
  ```json
  {
    "target": "6281234567890",
    "message": "📋 *PENGAJUAN BOOKING SARPRAS PPKASN*...",
    "countryCode": "62"
  }
  ```
- **Response Format (Success)**:
  ```json
  {
    "status": true,
    "id": "msg-uuid-12345",
    "target": "6281234567890",
    "process": "processing"
  }
  ```
- **Response Format (Error)**:
  ```json
  {
    "status": false,
    "reason": "invalid token / device disconnected"
  }
  ```

### 2.2 Network & Timeout Handling
- Native Node.js `fetch` with `AbortSignal.timeout(10000)` (10 seconds timeout).
- Catch block handles `TypeError` (network error / DNS failure), `AbortError` (timeout), and non-2xx HTTP responses.

---

## 3. Phone Number Normalization & Sanitization Architecture

### 3.1 Rules & Regex Patterns
Indonesian phone numbers must be formatted deterministically:
- WhatsApp Group ID: Matches `^[0-9]+-[0-9]+@g\.us$` or `^[0-9]+@g\.us$` -> Passed verbatim.
- Comma-separated list: Split by `,`, sanitize each individual number, and re-join with `,`.
- Single phone numbers:
  1. Strip all whitespace, dashes, parentheses, dots (`\s|-|\.|\(|\)`).
  2. If starts with `+62`, strip `+` -> `628...`.
  3. If starts with `08`, replace `0` with `62` -> `628...`.
  4. If starts with `8`, prepend `62` -> `628...`.
  5. Validate length: Must be between 10 and 15 digits matching `/^628[0-9]{8,12}$/`.
- If invalid or empty: Return `null` with a warning log, skipping WhatsApp dispatch without throwing exceptions.

---

## 4. Message Templates & Content Design

All templates follow a consistent, semi-formal institutional structure with emoji indicators and markdown formatting compatible with WhatsApp client rendering.

### 4.1 Requester Submission Confirmation (WA-04)
```text
📋 *PENGAJUAN BOOKING SARPRAS PPKASN*

Yth. *{{requesterName}}*,
Permohonan peminjaman sarana & prasarana Anda telah kami terima dan sedang menunggu verifikasi admin.

*Rincian Pengajuan:*
• *Kode Ref:* #{{bookingRef}}
• *Fasilitas:* {{assetName}} ({{assetLocation}})
• *Jadwal:* {{startDateWib}} s.d. {{endDateWib}} WIB
• *Tujuan:* {{purpose}}
• *Status:* ⏳ Menunggu Persetujuan

Cek status permohonan Anda secara berkala melalui tautan:
{{trackingUrl}}

_Pesan otomatis dari Sistem Sarpras PPKASN_
```

### 4.2 Requester Approval Notification (WA-05)
```text
✅ *PERMOHONAN BOOKING DISETUJUI*

Yth. *{{requesterName}}*,
Kabar baik! Permohonan peminjaman sarana & prasarana Anda telah *DISETUJUI*.

*Rincian Pemakaian:*
• *Kode Ref:* #{{bookingRef}}
• *Fasilitas:* {{assetName}} ({{assetLocation}})
• *Jadwal:* {{startDateWib}} s.d. {{endDateWib}} WIB
• *Status:* ✅ Disetujui

Harap mematuhi tata tertib pemakaian fasilitas selama kegiatan berlangsung.

Detail lengkap:
{{trackingUrl}}

_Pesan otomatis dari Sistem Sarpras PPKASN_
```

### 4.3 Requester Rejection Notification (WA-06)
```text
❌ *PERMOHONAN BOOKING DITOLAK*

Yth. *{{requesterName}}*,
Mohon maaf, permohonan peminjaman fasilitas Anda tidak dapat kami setujui.

*Rincian Pengajuan:*
• *Kode Ref:* #{{bookingRef}}
• *Fasilitas:* {{assetName}}
• *Jadwal:* {{startDateWib}} s.d. {{endDateWib}} WIB
• *Status:* ❌ Ditolak

*Alasan Penolakan:*
"{{rejectionReason}}"

Silakan mengajukan kembali dengan menyesuaikan jadwal atau fasilitas lain melalui sistem Sarpras PPKASN.

_Pesan otomatis dari Sistem Sarpras PPKASN_
```

### 4.4 Admin Operational Alert (WA-07, WA-08)
```text
🔔 *OPERATIONAL ALERT: BOOKING BARU*

Terdapat permohonan booking sarpras baru yang membutuhkan persetujuan:

• *Kode Ref:* #{{bookingRef}}
• *Pemohon:* {{requesterName}} ({{requesterOrganization}})
• *Fasilitas:* {{assetName}}
• *Jadwal:* {{startDateWib}} s.d. {{endDateWib}} WIB
• *Jumlah Peserta:* {{attendance}} orang
• *Keperluan:* {{purpose}}

Buka panel persetujuan admin:
{{adminApprovalUrl}}

_Notifikasi Internal Sistem Sarpras PPKASN_
```

---

## 5. Non-Blocking Async Dispatch & Fallback Strategy

### 5.1 Architecture Diagram
```
[User Action] -> [BookingService Transaction]
                        │
                        ├─> 1. DB Commit (bookings & state machine updated)
                        │
                        └─> 2. void dispatchWhatsAppNotification(payload)
                                     │
                                     ├── [Check Token]
                                     │      ├── Missing/Test -> Console Mock Logger
                                     │      └── Present -> POST https://api.fonnte.com/send
                                     │
                                     └── 3. recordAuditEvent("notification.whatsapp_dispatch")
```

### 5.2 Mock Logger Output Specification
When `FONNTE_API_TOKEN` is unset or `NODE_ENV === 'test'`, the mock client outputs:
```
┌─────────────────────────────────────────────────────────────┐
│ [MOCK WHATSAPP] Target: 6281234567890                       │
│ Type: BOOKING_CONFIRMATION                                  │
├─────────────────────────────────────────────────────────────┤
│ 📋 *PENGAJUAN BOOKING SARPRAS PPKASN*                       │
│ Yth. Budi Santoso,                                          │
│ ...                                                         │
└─────────────────────────────────────────────────────────────┘
```

---

## 6. Audit Trail & Diagnostics

Every dispatch attempt logs an entry to `audit_logs`:
- **actorId**: `"system:whatsapp"`
- **actorType**: `"system"`
- **action**: `"notification.whatsapp_dispatch"`
- **entityType**: `"booking"`
- **entityId**: `booking.id`
- **metadata**:
  ```json
  {
    "target": "628123456789",
    "template": "BOOKING_CREATED",
    "status": "success", // or "failed" | "mock"
    "provider": "fonnte",
    "response": { "id": "msg-123" },
    "error": null,
    "timestamp": "2026-08-14T04:00:00.000Z"
  }
  ```

---

## 7. Validation Architecture

### 7.1 Automated Tests
- Unit Tests: `src/lib/whatsapp/phone.test.ts` (phone parsing, sanitization, country code prefixing)
- Unit Tests: `src/lib/whatsapp/templates.test.ts` (template rendering, WIB formatting, null safety)
- Unit Tests: `src/lib/whatsapp/service.test.ts` (client mock fallback, Fonnte API payload, audit log emission)
- Integration Tests: `src/lib/booking/booking.test.ts` (end-to-end booking hooks triggering notification dispatches)

### 7.2 Manual Verification
- Testing with live/mock tokens, inspecting server console output, verifying audit log records in PostgreSQL.
