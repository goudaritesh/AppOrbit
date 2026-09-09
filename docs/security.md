# AppOrbit — Platform Security & Hardening Guide (Phase 10)

## 1. Security Philosophy

AppOrbit implements a **Zero-Trust, Defense-in-Depth** security model across all layers of the stack: network ingress, HTTP headers, authentication, authorization, database storage, file handling, and external payment integration.

---

## 2. Network & Transport Security

- **Strict HTTPS**: Enforces TLS 1.3 encryption across all public traffic.
- **HSTS**: `Strict-Transport-Security: max-age=31536000; includeSubDomains; preload` enabled in production.
- **Reverse Proxy IP Trust**: Express `trust proxy` configured with safe header parsing to prevent IP spoofing attacks.
- **CORS Whitelisting**: Strict, non-wildcard origin verification restricted to verified production client domains.

---

## 3. Application Security Headers (Helmet)

| Header | Production Directive | Protection Target |
| :--- | :--- | :--- |
| `Content-Security-Policy` | Restricts scripts, styles, fonts, frames, and connect endpoints | Cross-Site Scripting (XSS), Data Exfiltration |
| `X-Content-Type-Options` | `nosniff` | MIME-sniffing drive-by downloads |
| `X-Frame-Options` | `SAMEORIGIN` | Clickjacking & UI Redress attacks |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Sensitive URL token leakage |
| `Permissions-Policy` | Camera, microphone, geolocation disabled | Unauthorized device capabilities |

---

## 4. Authentication & RBAC

- **Password Hashing**: `bcryptjs` with salt work factor 12.
- **JWT Architecture**:
  - Access Token: Short-lived (15 minutes), signed with SHA-256 HMAC secret.
  - Refresh Token: Long-lived (7 days), stored securely and rotated on every session refresh.
  - Token Revocation: Blacklists previous refresh tokens on renewal to detect and block token reuse.
- **Role-Based Access Control**:
  - `USER`: Browse, search, write reviews, download signed APKs.
  - `DEVELOPER`: Manage applications, upload APK versions, view analytics, subscribe to tiers.
  - `MODERATOR`: Moderate reviews, inspect APK security flags.
  - `ADMIN` / `SUPER_ADMIN`: Full system controls, developer suspension, payment approvals, platform settings.

---

## 5. Input Validation & Injection Mitigation

- **NoSQL Injection**: Global `mongoSanitizer` middleware recursively purges MongoDB operators (`$where`, `$gt`, `$ne`, `$regex`) and dot-notation paths from `req.body`, `req.query`, and `req.params`.
- **XSS Sanitization**: HTML stripping and character entity escaping on all user-submitted reviews, changelogs, descriptions, and tickets.
- **Defensive Type Checking**: All string methods defensively assert `typeof val === 'string'` to neutralize type confusion exploits.

---

## 6. Multi-Tiered Rate Limiting

Rate limiting is enforced at multiple layers to prevent Denial of Service (DoS) and credential stuffing:
- **General API Limiter**: 300 requests per 15-minute window per IP.
- **Authentication Limiter**: 10 attempts per 15-minute window for `/auth/login` and `/auth/register`.
- **APK Upload Limiter**: 20 uploads per hour per developer.
- **Review Submission Limiter**: 10 reviews per hour per user.
- **APK Download Limiter**: 60 download token requests per hour per user.

---

## 7. APK Binary Security & Verification Pipeline

Every uploaded Android binary passes through automated static analysis:
1. **Magic Number Inspection**: Verifies zip header signature (`0x50, 0x4B, 0x03, 0x04`) preventing disguised scripts.
2. **Manifest Parsing**: Extracts `package_name`, `versionCode`, `versionName`, and requested Android permissions.
3. **Cryptographic Fingerprinting**: Computes 64-character SHA-256 binary hash.
4. **Certificate Continuity**: Verifies APK signing certificate against previous releases to detect supply-chain hijacking.
5. **Heuristic Risk Scoring**: Analyzes dangerous permission combinations (SMS + Internet, Location + Background, Contacts + Storage) and elevated debuggable flags.
6. **Automatic Quarantine**: Flags high-risk or digest-mismatched binaries into `QUARANTINED` status, immediately disabling public downloads.

---

## 8. Secure File Downloads

- Direct storage paths and cloud bucket credentials are never exposed to clients.
- The platform issues ephemeral **HMAC SHA-256 signed download URLs** with a strict 15-minute TTL.
- Tampered signatures or expired tokens are rejected with HTTP 403 Forbidden.

---

## 9. Zero-Trust Payment Security

- **Tamper-Resistant Pricing**: Client-submitted pricing payloads are discarded. Order amounts are strictly computed server-side from canonical database subscription plans.
- **Cryptographic Verification**: Webhooks and payment callbacks verify Razorpay HMAC SHA-256 signatures before activating subscriptions.
- **Webhook Idempotency**: Duplicate webhook delivery events are tracked and deduplicated via indexed `WebhookEvent` records.
