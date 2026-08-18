# Technical Debt, Security & Architectural Concerns

**Analysis Date:** 2026-08-18

---

## 1. Security & Environment Configuration

- **Environment Secrets:**
  - `BETTER_AUTH_SECRET` and `DATABASE_URL` must remain strictly confidential in production environments.
  - `FONNTE_API_TOKEN` and `RESEND_API_KEY` control external communications; configure token rotation procedures.
- **Legacy Account Security:**
  - Ingested legacy user accounts carry `mustResetPassword: true`. Login flows must enforce immediate password change before granting dashboard access.
- **Server Function Guarding:**
  - Ensure all administrative RPC endpoints in `src/lib/**/*.functions.ts` are guarded by `authMiddleware` or `requireRoleMiddleware`.

---

## 2. Concurrency & Data Integrity

- **Double-Booking Race Conditions:**
  - Room double-booking is checked in `src/lib/booking/service.server.ts` before inserting records. Under high-concurrency bursts for identical time windows, PostgreSQL exclusion constraints (`EXCLUDE USING gist`) or advisory transaction locks should be maintained.
- **Dormitory Capacity Accounting:**
  - Multi-day dormitory occupancy math calculates cumulative active attendance across overlapping date windows. Rejected or cancelled bookings must never count towards active bed occupancy.

---

## 3. Performance & Scalability

- **Database Indexes:**
  - Maintain compound indexes on `bookings(asset_id, start_date, end_date, status)` for responsive calendar queries.
  - Maintain indexes on `audit_logs(created_at DESC)` and `audit_logs(entity_type, entity_id)` for scalable audit log inspection.
- **Notification Queuing:**
  - Outbound WhatsApp and Email notifications run asynchronously. For high-volume multi-recipient notifications, consider integrating a background task queue (e.g. pg-boss or BullMQ) to avoid gateway rate limits.
- **Audit Log Retention:**
  - `audit_logs` records all entity mutations and notification attempts. Establish an archiving policy for logs older than 12-24 months.

---

## 4. Operational Monitoring

- **Gateway Quotas & Health:**
  - Monitor Fonnte and Resend API quota limits and delivery rates.
  - Mock mode logs structured JSON cards in development/test environments, avoiding accidental production notification dispatches.

---

*Codebase concerns and technical debt analysis: 2026-08-18*
