# AppOrbit — Production Deployment & DevOps Guide (Phase 10)

## 1. Deployment Topology

AppOrbit is containerized and cloud-portable, designed to deploy seamlessly on Docker, AWS, Render, Railway, Vercel, or Kubernetes.

```text
               ┌────────────────────────────────────────────────────────┐
               │                  Cloudflare CDN / DNS                  │
               └───────────────────────────┬────────────────────────────┘
                                           │
                    ┌──────────────────────┴──────────────────────┐
                    ▼                                             ▼
          Frontend (Vercel / Nginx)                     Backend (Render / AWS)
         https://apporbit.example.com                 https://api.apporbit.example.com
                    │                                             │
                    └──────────────────► API Requests ────────────┤
                                                                  ▼
                                                      Docker Container (Node 20)
                                                       - Non-root user: appuser
                                                       - Healthchecks: /health/ready
                                                                  │
                                                ┌─────────────────┴─────────────────┐
                                                ▼                                   ▼
                                         MongoDB Atlas                         Managed Redis
```

---

## 2. Environment Variables Configuration

Create isolated `.env` configurations for each deployment tier. Refer to `.env.example` and `.env.production.example`.

### Critical Backend Variables:
| Variable | Description | Production Example |
| :--- | :--- | :--- |
| `NODE_ENV` | Runtime environment | `production` |
| `PORT` | API Server listening port | `5000` |
| `CLIENT_URL` | Canonical frontend domain for CORS | `https://apporbit.example.com` |
| `MONGODB_URI` | MongoDB Atlas Replica Set URI | `mongodb+srv://apporbit_prod:...@cluster0.mongodb.net/apporbit` |
| `REDIS_URL` | Redis Cache & Queue URI | `rediss://default:...@redis.cloud.redislabs.com:6379` |
| `JWT_SECRET` | Access token HMAC secret (>= 32 chars) | High-entropy secret |
| `REFRESH_TOKEN_SECRET`| Refresh token HMAC secret (>= 32 chars)| High-entropy secret |
| `RAZORPAY_KEY_ID` | Gateway Public Key | `rzp_live_...` |
| `RAZORPAY_KEY_SECRET` | Gateway Private Key | Secure secret |
| `RAZORPAY_WEBHOOK_SECRET`| Webhook verification secret | Webhook HMAC secret |
| `SENTRY_DSN` | Error monitoring DSN | `https://...@sentry.io/...` |

---

## 3. Docker Deployment

### 3.1 Local Multi-Container Development
Run the complete environment (Frontend, Backend, MongoDB, Redis):
```bash
docker compose up --build -d
```

### 3.2 Production Container Deployment
Run production orchestration with memory caps, restart policies, and internal bridge isolation:
```bash
docker compose -f docker-compose.production.yml up --build -d
```

### 3.3 Standalone Docker Builds
```bash
# Build Backend Production Image
docker build -t apporbit-server:latest -f docker/Dockerfile.backend .

# Build Frontend Nginx Image
docker build -t apporbit-client:latest -f docker/Dockerfile.frontend .
```

---

## 4. CI/CD Pipeline (GitHub Actions)

AppOrbit features automated continuous integration and delivery across 4 workflows:
- **`ci.yml`**: Runs on every Pull Request and Push to `main` (Lint, Unit Tests, Integration Tests, Security Audits, and Production Builds).
- **`deploy-staging.yml`**: Triggers on push to `develop` to deploy containerized staging replicas.
- **`deploy-production.yml`**: Triggers on GitHub Releases to deploy zero-downtime production containers with post-deployment health verification.
- **`security.yml`**: Scheduled weekly and PR vulnerability scan auditing dependencies and checking for secret leaks.

---

## 5. Subsystem Health Checks

- **Process Liveness**: `GET /health/live` (200 OK if event loop is alive).
- **Subsystem Readiness**: `GET /health/ready` (Verifies MongoDB ping, cache readiness, and memory footprint).
- **Service Root**: `GET /health` and `GET /api/health`.

---

## 6. Rollback & Disaster Recovery Strategy

1. **Rollback Release**: If post-deployment smoke test or `/health/ready` fails, automatically repoint DNS or container orchestrator to the previous verified Docker image tag.
2. **Database Rollback**:
   ```bash
   node server/src/scripts/restoreDatabase.js --folder=server/backups/backup_<timestamp>
   ```
3. **Cache Flush**:
   ```bash
   redis-cli -u $REDIS_URL FLUSHDB
   ```
