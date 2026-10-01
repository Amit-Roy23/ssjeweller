# S.S JEWELLERY ERP — Production Deployment Guide

This guide details the complete deployment lifecycle, environment configuration, reverse proxy setup, backup verification, and go-live checklist for **S.S JEWELLERY ERP**.

---

## 1. Environment Variables Reference & Supabase Architecture

S.S JEWELLERY ERP uses **Supabase (hosted PostgreSQL)** with a dual-connection architecture:

| Variable | Required | Purpose | Description |
| :--- | :--- | :--- | :--- |
| `DATABASE_URL` | **Yes** | **Pooled Runtime Connection** | Pooled connection (via Supavisor / PgBouncer on port 6543 / 5432) used by Next.js route handlers. Avoids exhausting connection pools across concurrent requests. |
| `DIRECT_URL` | **Yes** | **Direct Session Connection** | Direct database connection (port 5432) used exclusively by Prisma CLI for running schema migrations (`prisma migrate deploy`) and seeding (`prisma db seed`). |
| `JWT_SECRET` | **Yes** | **Auth Signing Key** | 256-bit cryptographically secure secret string for JWT session tokens. |
| `ADMIN_INITIAL_PASSWORD` | **Yes** | **Bootstrap Password** | Initial password for the master admin account created during production seed. |
| `NODE_ENV` | **Yes** | **Environment Mode** | `production` enables secure HTTP-only cookies and optimized Next.js server runtime. |
| `PORT` | No | **HTTP Port** | HTTP port for Next.js server (defaults to `3000`). |
| `SENTRY_DSN` | No | **Error Monitoring** | Sentry monitoring endpoint for unhandled exception telemetry. |

---

## 2. Production Deployment via Docker Compose

### Step 1: Configure Environment
```bash
# Copy production environment template
cp .env.example .env
# Edit .env with your Supabase DATABASE_URL, DIRECT_URL, and JWT_SECRET
nano .env
```

### Step 2: Run Migrations and Production Seed
```bash
# Apply Prisma migrations directly to Supabase
npx prisma migrate deploy

# Seed production bootstrap masters (Shop settings, purities, categories, admin user)
npm run db:seed
```

### Step 3: Build & Start App Container
```bash
# Build and run Next.js application container
docker compose up -d --build
```

### Step 4: Verify Deployment Health
```bash
curl -f http://localhost:3000/api/health
```

---

## 3. HTTPS & Reverse Proxy Configuration

### Option A: Caddy Server (Recommended — Automatic HTTPS)
Caddy automatically provisions and renews Let's Encrypt TLS certificates.

**`Caddyfile`**:
```caddy
erp.ssjewellery.in {
    reverse_proxy localhost:3000 {
        header_up Host {host}
        header_up X-Real-IP {remote_host}
        header_up X-Forwarded-For {remote_host}
        header_up X-Forwarded-Proto {scheme}
    }
    encode zstd gzip
}
```

### Option B: Nginx Configuration
```nginx
server {
    listen 80;
    server_name erp.ssjewellery.in;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name erp.ssjewellery.in;

    ssl_certificate /etc/letsencrypt/live/erp.ssjewellery.in/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/erp.ssjewellery.in/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## 4. Staging vs Production Environments

| Aspect | Staging Environment | Production Environment |
| :--- | :--- | :--- |
| **URL** | `https://staging-erp.ssjewellers.internal` | `https://erp.ssjewellery.in` |
| **Database** | Staging PostgreSQL (isolated instance) | High-availability PostgreSQL cluster |
| **Data** | Seeded with demo datasets (`npm run seed:demo`) | Real shop transaction records only |
| **Logging** | Debug verbosity (`LOG_LEVEL=debug`) | Info/Error structured JSON logging |
| **Backups** | Weekly retention (7 days) | Daily backups (14+ days) + offsite replica |

---

## 5. Rollback Procedure

### Application Rollback
```bash
# Pull previous stable container image or tag
git checkout <last-stable-commit-or-tag>
docker compose up -d --build
```

### Database Migration Rollback
If a database migration needs to be reversed:
```bash
# 1. Restore from the pre-deployment snapshot
./scripts/restore.sh ./backups/pre_deployment_snapshot.sql.gz

# 2. Restart app service
docker compose restart app
```

---

## 6. Go-Live Production Checklist

Before opening the system for live counter transactions:

- [ ] **1. Change Default Admin Password**: Log in as `admin` and update the administrative password in Settings > Account or via `/api/auth/change-password`.
- [ ] **2. Configure Shop Details**: In Settings, verify Shop Name (`S.S JEWELLERY`), Owner Name, Phone, Registered Address, GSTIN (`24ABCDE1234F1Z5`), PAN, and Bank details.
- [ ] **3. Set Initial Sequence Counters**: In Database/Settings, set current financial year sequence counters (`INV-2026-00001`, `PUR-2026-00001`, `WF-10001`) matching physical bill books.
- [ ] **4. Verify Daily Automated Backup**: Run `./scripts/backup.sh` and ensure compressed `.sql.gz` is created in `./backups/` and verified with `sha256sum`.
- [ ] **5. Add Staff Accounts & Karigars**: Create user accounts for floor staff with role `STAFF` and assign specific workshop specialties (Melting, Shaping, Stone Setting, Polishing).
- [ ] **6. Inward Opening Inventory**:
  - Raw Gold Bullion / Scrap lots in Gold Inventory.
  - Diamonds / Gemstones in Stones Inventory.
  - Finished Jewellery items in Catalog.
- [ ] **7. Conduct User Acceptance Testing (UAT)**:
  - Create a test sale bill and verify 3% GST calculation.
  - Issue raw gold to a sample Karigar work order.
  - Progress work order step, record wastage, and verify QC approval.
  - Verify Old Gold valuation voucher creation.
  - Verify audit log records actor name, timestamp, and IP address.
- [ ] **8. Delete Test Records**: Void/Cancel test invoices before official counter opening.
