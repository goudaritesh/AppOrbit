# AppOrbit — Production Architecture Document (Phase 10)

## 1. High-Level System Architecture

AppOrbit is architected as an enterprise-grade, cloud-native platform designed for resilient Android application distribution, developer monetization, and automated security verification.

```text
                        CLIENTS / BROWSERS / MOBILE
                                    │
                                    ▼
                         CDN / EDGE PROXY (Cloudflare)
                                    │
                  ┌─────────────────┴─────────────────┐
                  ▼                                   ▼
         FRONTEND HOSTING                    API LOAD BALANCER
        (Vercel / Nginx Alpine)             (AWS ALB / Render / DigitalOcean)
                  │                                   │
                  │ (SPA Static Assets)               ▼
                  └─────────────────────────► EXPRESS.JS API CLUSTER
                                                      │
                       ┌──────────────────────────────┼──────────────────────────────┐
                       ▼                              ▼                              ▼
                 REDIS CLUSTER                   MONGODB ATLAS                 STORAGE ENGINE
              (Cache & Pub/Sub)             (Multi-Region Replicas)         (Local / AWS S3)
                       │                              │                              │
                       ▼                              ▼                              ▼
               RATE LIMITING & JOBS           FORENSIC LEDGERS               SIGNED SHORT-LIVED
             (BullMQ / TTL Failover)        (ACID Transactions)                 APK DOWNLOADS
```

---

## 2. Frontend Architecture (`/client`)

- **Framework**: React 18 with Vite build tooling and ES modules.
- **State Management**: Redux Toolkit for authenticated user sessions, developer portals, real-time unread badges, and cart/subscription states.
- **Routing**: React Router DOM v6 with declarative route protection (`RequireAuth`, `RequireRole`).
- **Styling**: Tailwind CSS with custom obsidian glassmorphic tokens, CSS variables, and dark-mode optimization.
- **Observability**: Client-side Sentry error logging wrapper capturing unhandled exceptions and React component crash boundaries.
- **SEO**: Semantic HTML5, canonical metadata tags, Open Graph meta tags, dynamic `sitemap.xml`, and crawler directives (`robots.txt`).

---

## 3. Backend Architecture (`/server`)

- **Runtime**: Node.js 20 LTS with Express.js micro-monolith modular structure (`src/modules/*`, `src/controllers/*`, `src/services/*`).
- **Process Model**: Stateless horizontal clustering behind reverse proxies with Kubernetes-ready `/health/live` and `/health/ready` probes.
- **Request Tracing**: Cryptographically random or caller-propagated `X-Request-Id` attached to all request contexts, logs, and client responses.
- **Structured Logging**: Pino/JSON structured log engine with automated credential redaction (passwords, tokens, payment secrets, private URLs).
- **Graceful Shutdown**: Intercepts `SIGTERM` and `SIGINT`, drains active HTTP connections, and disconnects MongoDB/Redis cleanly.

---

## 4. Database & Persistence Layer

- **Engine**: MongoDB Atlas with replica sets and connection pooling.
- **Data Modeling**: Mongoose 8 schema enforcement with compound indexes across high-traffic query patterns (slugs, categories, ratings, tags, developer IDs).
- **Disaster Recovery**: Automated point-in-time snapshot dumps with cryptographic manifests and rolling 30-day retention pruning.

---

## 5. Security & Trust Architecture

- **HTTP Hardening**: Helmet CSP, HSTS with preload, frameguard `SAMEORIGIN`, and `X-Content-Type-Options: nosniff`.
- **Injection Protection**: Recursive NoSQL operator sanitizer stripping `$` keys and dot-notation paths from user inputs.
- **Rate Limiting**: Layered rate limiters (Global API, Authentication, Uploads, Reviews, and Downloads) with loopback test bypasses.
- **APK Inspection Pipeline**: Multi-phase pipeline verifying zip magic numbers, AndroidManifest.xml structure, sha256 digests, certificate continuity, and dangerous permission combinations.
- **Secure File Downloads**: Tamper-proof HMAC SHA-256 signed download tokens expiring in 15 minutes.

---

## 6. Payments & Subscription Architecture

- **Provider**: Razorpay gateway integration with Zero-Trust server-side order calculation.
- **Verification**: Cryptographic HMAC SHA-256 signature verification on frontend redirects and asynchronous webhook callbacks.
- **Idempotency**: Webhook deduplication through dedicated `WebhookEvent` unique event ID indices.
- **Billing**: Automated generation of `PaymentReceipt` and formal `Invoice` records with PDF export capabilities.

---

## 7. Real-Time Telemetry & Background Jobs

- **WebSockets**: Socket.IO authenticated via JWT tokens with tenant room isolation (`user:<id>`, `admin:feed`).
- **Worker Jobs**:
  - `reviewAggregation.job`: Atomic application rating recalculation.
  - `trendingApps.job`: Exponential time-decay score calculation over 7-day windows.
  - `popularApps.job`: Downloads and active user aggregation.
  - `subscriptionExpiryJob`: Periodic downgrades for expired billing cycles.
  - `sitemapGeneration.job`: SEO catalog sitemap updates.
