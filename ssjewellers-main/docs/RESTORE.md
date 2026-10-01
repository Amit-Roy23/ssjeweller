# Database Backup & Restore Guide

This document outlines standard operating procedures (SOP) for automated backups, point-in-time recovery, and disaster restore for **S.S JEWELLERY ERP**.

---

## 1. Backup Strategy & Retention

- **Backup Type**: Full logical dump via `pg_dump` with maximum compression (`gzip -9`) and SHA256 integrity checksum.
- **Frequency**: Automated daily cron job (recommended: 02:00 AM local time).
- **Default Retention**: 14 days local rotation (older backups automatically pruned).
- **Storage Location**: `./backups/` mounted volume or offsite S3/R2 bucket.

### Running a Manual Backup

#### On Linux / Docker:
```bash
./scripts/backup.sh
```

#### On Windows (PowerShell):
```powershell
.\scripts\backup.ps1
```

---

## 2. Testing & Performing a Database Restore

> [!CAUTION]
> Restoring a backup replaces the entire active database schema and data. Always perform a pre-restore backup of the current database before restoring an older archive.

### Step 1: Pre-Restore Safety Dump
```bash
docker exec -t ssjewellery_postgres pg_dump -U postgres ssjewellers | gzip -9 > ./backups/pre_restore_snapshot_$(date +%Y%m%d_%H%M%S).sql.gz
```

### Step 2: Execute Restore Script

#### On Linux / Docker:
```bash
# Restore from compressed gzip archive
./scripts/restore.sh ./backups/ssjewellers_backup_20261002_000000.sql.gz
```

#### On Windows:
```powershell
.\scripts\restore.ps1 -BackupFile .\backups\ssjewellers_backup_20261002_000000.sql
```

---

## 3. Post-Restore Verification Checklist

After restoring, verify system integrity with the following queries:

1. **Verify Connection & User Counts**:
   ```sql
   SELECT count(*) FROM "User";
   ```
2. **Verify Financial Ledger Balance**:
   ```sql
   SELECT count(*) AS total_sales, sum("grandTotalPaise")/100 AS total_revenue_rupees FROM "Sale";
   ```
3. **Verify Sequence Counter Continuity**:
   ```sql
   SELECT "entityType", "financialYear", "currentValue" FROM "SequenceCounter";
   ```
4. **Hit Health Check Endpoint**:
   ```bash
   curl http://localhost:3000/api/health
   ```

---

## 4. Automated Cron Setup (Linux Host)

To schedule daily backups at 02:00 AM, add the following line to `crontab -e`:

```cron
0 2 * * * cd /path/to/ssjewellers && ./scripts/backup.sh >> /var/log/ssjewellers_backup.log 2>&1
```
