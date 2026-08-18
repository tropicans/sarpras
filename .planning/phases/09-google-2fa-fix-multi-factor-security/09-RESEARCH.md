# Phase 9: Google 2FA Fix & Multi-Factor Security - Research

**Researched:** 2026-08-18
**Domain:** Authentication / Two-Factor Authentication (TOTP) / Better-Auth / OAuth2 & Passwordless Integration
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

No user constraints - all decisions at the agent's discretion.

### Locked Decisions
- Fix 400 Bad Request / "Invalid password" error when Google OAuth / passwordless users initiate 2FA.
- Support TOTP QR code display, manual secret key entry, and backup codes for recovery.
- Provide safe 2FA deactivation from the security settings modal.
- Protect login flows via `/two-factor` challenge for accounts with 2FA enabled.
- Ensure automated reproduction and lifecycle regression test coverage.

### the agent's Discretion
- UI error handling, notification styling, and UX improvements in the 2FA setup modal and challenge page.
- Test structuring and mock scenarios for Google SSO vs Credential users.

### Deferred Ideas (OUT OF SCOPE)
- SMS-based OTP (out of scope, costly & insecure).
- Hardware Security Key / WebAuthn Passkeys (planned for future milestone FUT-01).
- Mandatory admin 2FA enforcement policy (planned for FUT-02).
</user_constraints>

<architectural_responsibility_map>
## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| 2FA Server Configuration & Hooks | API/Backend Server (`auth.server.ts`) | Database/Storage (`twoFactors` schema) | Core auth engine generates TOTP secret, backup codes, and manages session state. |
| 2FA Setup Modal & Flow | Browser/Client (`two-factor-setup-modal.tsx`) | Frontend Server (TanStack Start) | Client renders QR code, handles verification form, and presents backup codes. |
| 2FA Login Challenge Route | Frontend Server / Client (`two-factor.tsx`) | API/Backend Server | Intercepts sign-ins requiring second-factor verification. |
| Automated Test Suite | Test Runner (`tsx/node:test`) | API/Backend Server | Validates configuration, plugin settings, and schema contracts. |
</architectural_responsibility_map>

<research_summary>
## Summary

This phase addresses the issue where Google OAuth and passwordless users encountered a `400 Bad Request` ("Invalid password") error when attempting to enable Two-Factor Authentication (TOTP).

Better Auth requires explicit configuration `allowPasswordless: true` within the `twoFactor()` plugin options. When omitted or `false`, Better Auth's `/two-factor/enable` endpoint insists on validating a credential password, which Google OAuth accounts do not possess. With `allowPasswordless: true` configured on the server, passwordless and OAuth users can call `authClient.twoFactor.enable({})` without supplying a password parameter.

Furthermore, disabling 2FA via `authClient.twoFactor.disable({})` and challenging users during login via `/two-factor` seamlessly work for both OAuth and credential users with complete backup code fallbacks.

**Primary recommendation:** Ensure `allowPasswordless: true` is strictly verified on server configuration, client setup modal passes empty object `{}` for passwordless users, and unit/integration tests verify the full lifecycle (enable, verify, challenge, backup code, disable).
</research_summary>

<standard_stack>
## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `better-auth` | ^1.6.27 | Full-stack TypeScript authentication framework | Framework-agnostic, modular plugin ecosystem with built-in TOTP & backup code support. |
| `@better-auth/drizzle-adapter` | ^1.6.27 | Database adapter for Drizzle ORM | Native mapping to PostgreSQL tables (`twoFactors`, `users`, `sessions`). |
| `drizzle-orm` | ^0.45.2 | PostgreSQL ORM schema and migrations | Type-safe schema definition for twoFactor tables. |
| `@tanstack/react-router` | latest | Type-safe routing & navigation | Handles navigation between `/login`, `/two-factor`, and `/admin`. |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `lucide-react` | ^1.31.0 | UI icons | Shield, QR Code, Key, Copy indicators in modal. |
| `qrserver.com API` | v1 | TOTP QR Code generation | Client-side QR generation from `otpauth://` URI. |

</standard_stack>

<architecture_patterns>
## Architecture Patterns

### System Architecture & Data Flow

```
[User Browser]
       │
       ├─ (1) Click "Mulai Aktivasi 2FA" ──────────► [authClient.twoFactor.enable]
       │                                                      │
       │                                                      ▼
       │                                            [Better Auth Server]
       │                                            (allowPasswordless: true)
       │                                                      │
       │                                                      ▼
       │◄── (2) Return { totpURI, backupCodes } ──── [Generate TOTP Secret & Encrypt]
       │
       ├─ (3) Display QR Code & Enter 6-digit PIN ─► [authClient.twoFactor.verifyTotp]
       │                                                      │
       │                                                      ▼
       │                                            [Verify TOTP & Set twoFactorEnabled: true]
       │                                                      │
       │◄── (4) Confirm Success & Show Backup Codes ─────────┘
```

### Pattern 1: Server Plugin Configuration
```typescript
import { betterAuth } from "better-auth";
import { twoFactor } from "better-auth/plugins";

export const auth = betterAuth({
  plugins: [
    twoFactor({
      issuer: "SARPRAS PPKASN",
      allowPasswordless: true,
    }),
  ],
});
```

### Pattern 2: Client Activation & Verification Flow
```typescript
// Step 1: Request activation
const res = await authClient.twoFactor.enable({});
const uri = res.data?.totpURI;
const backupCodes = res.data?.backupCodes;

// Step 2: User scans QR and submits 6-digit code
const verifyRes = await authClient.twoFactor.verifyTotp({
  code: userEnteredPin,
});

// Step 3: Disable 2FA
const disableRes = await authClient.twoFactor.disable({});
```

### Anti-Patterns to Avoid
- **Passing dummy password to enable endpoint:** Do not pass fake passwords like `"password"` or empty strings when `allowPasswordless` is enabled.
- **Storing unencrypted secrets:** Always let Better Auth manage secret encryption and schema storage.
- **Skipping backup code presentation:** Users must be prompted to copy/store backup codes upon initial TOTP confirmation.
</architecture_patterns>

<dont_hand_roll>
## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| TOTP Secret Generation & Crypto | Custom speakeasy / otplib wrapper | Better Auth `twoFactor` plugin | Built-in AES encryption for secrets in database, standard RFC 6238 compliance. |
| Time Window Drift Handling | Custom tolerance algorithms | Better Auth `verifyTotp` | Automatically accepts +/- 1 time period (30s) to absorb clock skew across mobile devices. |
| Backup Code Hashing & Invalidation | Custom backup code table logic | Better Auth `twoFactor` backup codes | Automatically handles single-use consumption and removal upon verification. |
</dont_hand_roll>

<common_pitfalls>
## Common Pitfalls

### Pitfall 1: 400 Bad Request on OAuth Users
**What goes wrong:** User clicks enable 2FA and gets `400 Bad Request: Invalid password`.
**Why it happens:** `allowPasswordless` is missing or false in Better Auth server config.
**How to avoid:** Configure `allowPasswordless: true` in `twoFactor({ ... })` plugin options.

### Pitfall 2: Disabling 2FA fails without password
**What goes wrong:** Calling `twoFactor.disable()` fails for Google OAuth users.
**Why it happens:** Better Auth default behavior requires password on disable unless `allowPasswordless: true` is active.
**How to avoid:** Ensure `allowPasswordless: true` is set on server, enabling passwordless disable.

### Pitfall 3: Device Time Skew
**What goes wrong:** Valid 6-digit code from Google Authenticator rejected.
**Why it happens:** Client mobile device clock differs by >30 seconds from server clock.
**How to avoid:** Inform user in error messages to check system clock synchronization, while Better Auth checks previous/current/next 30s window.
</common_pitfalls>

<code_examples>
## Code Examples

### Reproduction & Regression Unit Test
```typescript
import assert from "node:assert";
import test from "node:test";
import { auth } from "../../db/auth.server";

test("Two-Factor Authentication allows passwordless / OAuth users to enable 2FA", () => {
  const options = (auth as any).options;
  assert.ok(options, "Better Auth options must exist");

  const plugins = options.plugins || [];
  const twoFactorPlugin = plugins.find((p: any) => p.id === "two-factor");
  assert.ok(twoFactorPlugin, "twoFactor plugin must be registered in Better Auth");

  assert.strictEqual(
    twoFactorPlugin.options?.allowPasswordless,
    true,
    "twoFactor plugin must have allowPasswordless: true to support Google OAuth / passwordless users enabling 2FA",
  );
});
```
</code_examples>

<sources>
## Sources

### Primary (HIGH confidence)
- Context7 `/better-auth/better-auth` - `twoFactor` plugin API, `allowPasswordless` parameter, `enable`, `disable`, `verifyTotp`, `verifyBackupCode`.
- Better Auth official documentation (`docs/content/docs/plugins/2fa.mdx`).

### Secondary (MEDIUM confidence)
- Local codebase inspection: `src/db/auth.server.ts`, `src/components/admin/two-factor-setup-modal.tsx`, `src/routes/two-factor.tsx`.
</sources>

<metadata>
## Metadata

**Research scope:**
- Core technology: Better Auth Two-Factor Plugin (TOTP)
- Ecosystem: Drizzle ORM, TanStack Start, React 19
- Patterns: Passwordless & OAuth 2FA enablement, backup codes, login challenges
- Pitfalls: 400 Bad Request password requirement, device time skew, disable error

**Confidence breakdown:**
- Standard stack: HIGH
- Architecture: HIGH
- Pitfalls: HIGH
- Code examples: HIGH

**Research date:** 2026-08-18
**Valid until:** 2026-09-18
</metadata>

---

*Phase: 09-google-2fa-fix-multi-factor-security*
*Research completed: 2026-08-18*
*Ready for planning: yes*
