# S.S JEWELLERY ERP

A production-grade, multi-user Enterprise Resource Planning (ERP) system tailored specifically for jewellery retail, raw material tracking, and workshop manufacturing workflows.

---

## Table of Contents

- [Overview](#overview)
- [System Architecture](#system-architecture)
- [Modules & Capabilities](#modules--capabilities)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Configuration](#environment-configuration)
  - [Database Setup](#database-setup)
- [Available Scripts](#available-scripts)
- [Engineering Guidelines & Rules](#engineering-guidelines--rules)
- [Migration & Transformation Roadmap](#migration--transformation-roadmap)
- [License](#license)

---

## Overview

S.S JEWELLERY ERP manages the complete lifecycle of jewellery operations:
- **Raw Material & Fine Gold Tracking**: Physical vault tracking, fine gold conversion, stock transfers, and reconciliation.
- **Production & Karigar Workflow**: Step-by-step job order execution (Gold Issue, Melting, Shaping, Cutting, Polishing, Stone Setting, Finishing, QC) with precision loss/wastage tracking at every handoff.
- **Finished Inventory**: Multi-metal, multi-purity jewellery master catalog with automated pricing, making charges, and barcode support.
- **Sales & Invoicing**: Fast counter billing with Old Gold Exchange adjustments, payment splitting, and GST compliance.
- **Supplier & Customer Ledgers**: Gap-free invoice numbering, credit balances, and audit trails.

---

## System Architecture

- **Frontend**: Next.js 16 (App Router), React 19, Tailwind CSS v4, Radix UI / shadcn/ui components, Lucide icons, Recharts.
- **Backend & API**: Next.js App Router Route Handlers, Zod schema validation, transaction-based business services.
- **Database & ORM**: PostgreSQL with Prisma ORM (relational schema, gap-free sequence generation, strict constraints).
- **Security**: Argon2/Bcrypt password hashing, Signed HTTP-only session cookies, Centralized Role-Based Access Control (RBAC) guard.

---

## Modules & Capabilities

1. **Dashboard (`/`)**: Executive summary with 14-day sales trends, stock distribution, metal mix, KPI counters, and quick bill action.
2. **Workflow (`workflow-view.tsx`)**: End-to-end karigar manufacturing lifecycle with stage-wise weights, wastage metrics, rework loops, and staff task queues.
3. **Gold Stock (`gold-inventory.tsx`)**: Vault management for raw gold bars, scrap, coins, and silver with real-time fine weight calculation and location transfers.
4. **Stone & Diamond Inventory (`stone-inventory.tsx`)**: Carat and piece tracking for diamonds, rubies, emeralds, and precious gemstones.
5. **Finished Products (`products.tsx`)**: Master inventory of retail jewellery items with net/gross weights, making charges, and barcodes.
6. **Purchase Management (`purchase.tsx`)**: Inward purchase orders from bullion suppliers with payment tracking and ledger updates.
7. **Sales & Billing (`sales.tsx`)**: Counter point-of-sale invoicing, item selection, old gold adjustment deductions, and payment recording.
8. **Customers (`customers.tsx`)**: Customer directory, purchase history, outstanding balances, DOB/anniversary tracking.
9. **Suppliers (`suppliers.tsx`)**: Supplier profiles, GSTIN/PAN records, purchase logs, and payables.
10. **Old Gold Exchange (`exchange.tsx`)**: Buy-back vouchers, touch assessment, karat rate computation, and invoice offset mapping.
11. **Reports & Analytics (`reports.tsx`)**: 6-month sales vs purchase comparisons, stock-by-purity aggregations, employee job order performance, GST breakdowns, and CSV exports.
12. **User Management (`users.tsx`)**: Role management (ADMIN, MANAGER, STAFF), specialty tracking, and access activation.
13. **Audit Trail (`audit-log.tsx`)**: Immutable log of every financial transaction, inventory movement, and administrative action.
14. **Settings (`settings.tsx`)**: Store profile, tax rates, daily 24K gold/silver market rates, numbering prefixes, purity masters, and workflow templates.

---

## Getting Started

### Prerequisites

- **Node.js**: `v20.x` or `v22.x` (LTS recommended)
- **Package Manager**: `npm` (v10+), `pnpm` (v9+), or `bun`
- **Database**: PostgreSQL 15+ (local instance or managed Postgres)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/Amit-Roy23/ssjeweller.git
   cd ssjewellers-main/ssjewellers-main
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

### Environment Configuration

Copy `.env.example` to `.env` and configure your Supabase credentials:

```bash
cp .env.example .env
```

Key environment variables:
| Variable | Purpose | Format / Usage |
| :--- | :--- | :--- |
| `DATABASE_URL` | **Transaction Pooled URL** | Used by the running Next.js application / serverless functions (Supavisor / PgBouncer pooler). Ensures fast connection reuse. |
| `DIRECT_URL` | **Direct Session Connection** | Used by Prisma CLI for running migrations (`prisma migrate deploy`) and database seeding (`prisma db seed`). |
| `JWT_SECRET` | Auth Token Secret | Cryptographically secure string (min 32 chars) for signing session cookies. |
| `ADMIN_INITIAL_PASSWORD` | Admin Bootstrap | Initial password for the seeded `admin` account. |
| `NODE_ENV` | Environment Mode | `development` or `production`. |

### Database Setup (Supabase)

1. Deploy schema migrations to your Supabase PostgreSQL instance:
   ```bash
   npm run db:migrate
   # Or directly: npx prisma migrate deploy
   ```
2. Generate Prisma Client:
   ```bash
   npm run db:generate
   ```
3. Bootstrap the database with production master records (Shop settings, purities, categories, statuses, sequence counters, and admin user):
   ```bash
   npm run db:seed
   ```

---

## Available Scripts

| Command | Description |
| :--- | :--- |
| `npm run dev` | Start the Next.js development server at `http://localhost:3000` |
| `npm run build` | Compile and bundle the production application |
| `npm run start` | Start the Next.js production server |
| `npm run lint` | Run ESLint across the codebase |
| `npm run typecheck` | Run TypeScript compiler validation (`tsc --noEmit`) |
| `npm run db:migrate` | Execute database migrations in development |
| `npm run db:generate` | Generate Prisma ORM client artifacts |
| `npm run db:reset` | Reset database and re-apply all migrations |

---

## Engineering Guidelines & Rules

1. **Server Single Source of Truth**: The client never calculates authoritative invoice totals, stock balances, or tax amounts. All calculations are executed server-side.
2. **Integer Arithmetic for Money and Weights**:
   - Currency is stored in **paise** (integers: ₹1.00 = 100 paise).
   - Weights are stored in **milligrams** (integers: 1.000g = 1000 mg) or high-precision fixed-scale Prisma Decimals.
   - Float conversions only occur at display formatting boundaries.
3. **Transactional Integrity**: Multi-entity writes (Sales + Inventory Decrements + Payments + Customer Ledger + Audit Log) always run within an atomic `prisma.$transaction`.
4. **Append-Only & Soft Cancellation**: Financial records (Sales, Purchases, Payments, Stock Movements) are never hard-deleted. Reversals use `CANCELLED` status with mandatory reason and compensating ledger entries.
5. **Strict Input Validation**: Every endpoint validates payloads via shared `zod` schemas.

---

## Migration & Transformation Roadmap

- **Phase 0**: Audit, Code Cleanup & Infrastructure Baseline *(Completed)*
- **Phase 1**: Relational PostgreSQL Database & Prisma Schema Design
- **Phase 2**: Secure Authentication (Argon2 / Session Cookies) & RBAC Guard
- **Phase 3**: REST API Handlers, Services, & Transactional Business Logic
- **Phase 4**: TanStack React Query Client Wiring & UI Modernization
- **Phase 5**: Comprehensive Automated Testing (Vitest + Playwright) & CI
- **Phase 6**: Production Deployment (Docker, Health Checks, Automated Backup & Restore)
