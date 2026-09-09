# AppOrbit — Incident Response & Disaster Recovery Runbook (Phase 10)

## 1. Incident Response Framework

This runbook outlines standard operating procedures (SOPs) for triage, containment, resolution, and post-mortem analysis of critical production incidents affecting the AppOrbit platform.

```text
  [DETECTION] ──► [TRIAGE & SEVERITY] ──► [CONTAINMENT] ──► [ERADICATION] ──► [RECOVERY & VERIFY] ──► [POST-MORTEM]
```

---

## 2. Severity Classification Matrix

| Severity | Definition | Target Response (SLA) | Examples |
| :--- | :--- | :--- | :--- |
| **SEV-1 (Critical)** | Catastrophic platform outage, data loss, active malware spread, or active security breach. | Immediate (< 15 mins) | Database cluster down; malicious APK bypassed automated filter; active payment fraud. |
| **SEV-2 (High)** | Major feature failure affecting multiple users without a direct workaround. | < 1 hour | Payments gateway failing; APK uploads completely broken; background job queue stalled. |
| **SEV-3 (Medium)**| Degraded performance or non-critical feature impaired. | < 4 hours | Search autocomplete slow; notification delivery delayed; metrics aggregation delayed. |
| **SEV-4 (Low)** | Minor cosmetic or documentation defects. | Next business day | Styling glitch on admin sub-tab; minor typo in email template. |

---

## 3. Incident Runbooks

### Runbook A: Database Outage or Data Corruption
1. **Diagnosis**: Check `/health/ready` endpoint. If `database: "disconnected"`, check MongoDB Atlas cluster status and connection pool limits.
2. **Maintenance Gate**: If corruption is detected, immediately enable platform maintenance mode via Admin API or database query to block client writes:
   ```bash
   # Enable maintenance mode
   curl -X PUT http://localhost:5000/api/admin/settings \
     -H "Authorization: Bearer <ADMIN_TOKEN>" \
     -H "Content-Type: application/json" \
     -d '{"maintenanceMode": true}'
   ```
3. **Disaster Recovery Restore**:
   Identify the latest verified backup directory in `/server/backups/`:
   ```bash
   # Dry-run validation first
   node server/src/scripts/restoreDatabase.js --dryRun

   # Full recovery execution
   node server/src/scripts/restoreDatabase.js
   ```
4. **Verification**: Run `node server/src/scripts/test_phase10_production.js` to ensure data integrity.
5. **Resume**: Disable maintenance mode.

---

### Runbook B: Malicious APK or Zero-Day Security Flag
1. **Immediate Quarantine**: Admin navigates to Security Center or executes moderation block:
   ```bash
   curl -X POST http://localhost:5000/api/admin/apps/<APP_ID>/block \
     -H "Authorization: Bearer <ADMIN_TOKEN>" \
     -H "Content-Type: application/json" \
     -d '{"reason": "Zero-day vulnerability quarantine"}'
   ```
2. **Download Invalidation**: The platform instantly invalidates all active signed download tokens for that APK version.
3. **Revocation Notice**: Platform sends high-priority Web Push / Email notification to all users who downloaded that version code within the last 30 days.

---

### Runbook C: Payment Gateway Failure or Webhook Desync
1. **Diagnosis**: Query `/api/admin/payments` filtered by status `PENDING` or check Razorpay dashboard for API degradation.
2. **Manual Settlement Fallback**:
   - Developers submit manual payment receipt and UTR reference via `/api/payments/manual/submit`.
   - Administrators review and approve proof of payment in the Admin Payments Portal.
   - Subscription transitions cleanly to active state upon approval.

---

### Runbook D: High Traffic Spike or Distributed Denial of Service (DDoS)
1. **Edge Protection**: Enable Cloudflare "Under Attack" Mode at the DNS proxy layer.
2. **Rate Limit Throttling**: The built-in Express Rate Limiter automatically throttles IPs exceeding burst limits (returning HTTP 429).
3. **Horizontal Replicas**: Trigger Docker Compose or Kubernetes horizontal scaling:
   ```bash
   docker compose -f docker-compose.production.yml up --scale backend=4 -d
   ```
4. **Cache Offload**: Ensure static feeds (`/popular`, `/trending`, `/new`) are serving `X-Cache: HIT` from Redis / memory.

---

## 4. Recovery Objectives (RTO & RPO)

- **Recovery Point Objective (RPO)**: < 1 hour (via automated hourly snapshot backups and MongoDB Atlas PITR oplogs).
- **Recovery Time Objective (RTO)**: < 15 minutes (fully scripted restoration via `restoreDatabase.js`).
