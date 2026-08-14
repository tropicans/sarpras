# Technical Debt, Security & Architectural Concerns

**Analysis Date:** 2026-08-14

---

## 1. Security & Environment Configuration

- **Environment Secrets:**
  - `BETTER_AUTH_SECRET` and `DATABASE_URL` must be strictly secured in production environments.
  - `FONNTE_API_TOKEN` controls the outbound WhatsApp sender account; ensure tokens are rotated regularly.
- **Legacy Password Migration:**
  - Migrated accounts from the legacy PHP/MySQL database carry the `mustResetPassword: true` flag in the `user` table. Enforce the password reset prompt upon login before granting dashboard access.
- **Access Control Boundaries:**
  - All new server functions in `src/lib/**/*.functions.ts` must explicitly apply `authMiddleware` or `requireRoleMiddleware()` to prevent unauthorized RPC invocations.

---

## 2. Concurrency & Data Integrity

- **Double-Booking Race Conditions:**
  - Room double-booking is currently checked via query inspection before insertion in `src/lib/booking/service.server.ts`. Under extreme concurrent submissions for the exact same millisecond slot, PostgreSQL transaction locks or database exclusion constraints (`EXCLUDE USING gist`) should be considered.
- **Dormitory Capacity Accounting:**
  - Bed/occupancy math calculates total active attendance across overlapping date windows. Ensure cancelled/rejected bookings are excluded from active occupancy calculations (governed by state machine in `src/lib/booking/dormitory.ts`).

---

## 3. Performance & Scalability

- **Database Indexes:**
  - Add composite index on `bookings(asset_id, start_date, end_date, status)` to ensure sub-millisecond calendar range queries as booking records grow.
  - Ensure index on `audit_logs(created_at DESC)` and `audit_logs(entity_type, entity_id)` for responsive audit trail pagination.
- **Outbound Notification Queueing:**
  - WhatsApp dispatches run asynchronously via `safeDispatchNotification()`. For high-volume multi-recipient broadcasts, integrating a lightweight persistent task queue (e.g., pg-boss or Redis/BullMQ) will prevent rate-limit throttling from external API gateways.
- **Audit Table Growth:**
  - `audit_logs` records all entity mutations and notification attempts. Establish an archiving or retention policy for historical data older than 12-24 months.

---

## 4. Operational Monitoring

- **Gateway Status Monitoring:**
  - Monitor Fonnte API credit balances and token validity to prevent silent notification drops in production.
  - Mock mode logs visual cards in local development console, providing seamless debugging without consuming real SMS/WhatsApp quotas.

---

*Codebase concerns and technical debt analysis: 2026-08-14*
