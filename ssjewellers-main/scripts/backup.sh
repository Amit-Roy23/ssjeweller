#!/usr/bin/env bash
# ==============================================================================
# S.S JEWELLERY ERP — Automated PostgreSQL Backup Script (Linux/Docker)
# Features: Compressed pg_dump, timestamping, SHA256 checksum, retention pruning
# ==============================================================================

set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-./backups}"
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-14}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/ssjewellers_backup_${TIMESTAMP}.sql.gz"

mkdir -p "${BACKUP_DIR}"

echo "=================================================="
echo "Starting S.S Jewellery ERP Database Backup"
echo "Timestamp: ${TIMESTAMP}"
echo "Target:    ${BACKUP_FILE}"
echo "=================================================="

# Check if running inside docker or host
if [ -n "${DATABASE_URL:-}" ]; then
  # Parse DATABASE_URL or run pg_dump directly
  pg_dump "${DATABASE_URL}" | gzip -9 > "${BACKUP_FILE}"
elif command -v docker >/dev/null 2>&1 && docker ps | grep -q "ssjewellery_postgres"; then
  echo "Executing pg_dump inside Docker container (ssjewellery_postgres)..."
  docker exec -t ssjewellery_postgres pg_dump -U postgres ssjewellers | gzip -9 > "${BACKUP_FILE}"
else
  echo "Executing local pg_dump..."
  pg_dump -U "${POSTGRES_USER:-postgres}" -h "${POSTGRES_HOST:-localhost}" -p "${POSTGRES_PORT:-5432}" "${POSTGRES_DB:-ssjewellers}" | gzip -9 > "${BACKUP_FILE}"
fi

# Calculate checksum
if command -v sha256sum >/dev/null 2>&1; then
  sha256sum "${BACKUP_FILE}" > "${BACKUP_FILE}.sha256"
fi

BACKUP_SIZE=$(du -h "${BACKUP_FILE}" | cut -f1)
echo "✓ Backup created successfully! Size: ${BACKUP_SIZE}"

# Retention cleanup (prune backups older than RETENTION_DAYS)
echo "Cleaning up backups older than ${RETENTION_DAYS} days..."
find "${BACKUP_DIR}" -type f -name "ssjewellers_backup_*.sql.gz*" -mtime "+${RETENTION_DAYS}" -exec rm -f {} + || true

echo "✓ Backup routine completed."
