#!/usr/bin/env bash
# ==============================================================================
# S.S JEWELLERY ERP — Database Restore Script (Linux / Docker)
# ==============================================================================

set -euo pipefail

if [ "$#" -ne 1 ]; then
  echo "Usage: $0 <path_to_backup_file.sql.gz | path_to_backup_file.sql>"
  exit 1
fi

BACKUP_FILE="$1"

if [ ! -f "${BACKUP_FILE}" ]; then
  echo "Error: Backup file '${BACKUP_FILE}' does not exist!"
  exit 1
fi

echo "=================================================="
echo "⚠️  WARNING: Restoring database will OVERWRITE current data!"
echo "Target File: ${BACKUP_FILE}"
echo "=================================================="

read -p "Are you sure you want to proceed? (yes/no): " CONFIRM
if [ "${CONFIRM}" != "yes" ]; then
  echo "Restore cancelled."
  exit 0
fi

# Decompress and restore
if [[ "${BACKUP_FILE}" == *.gz ]]; then
  echo "Decompressing and piping to psql..."
  if command -v docker >/dev/null 2>&1 && docker ps | grep -q "ssjewellery_postgres"; then
    gunzip -c "${BACKUP_FILE}" | docker exec -i ssjewellery_postgres psql -U postgres -d ssjewellers
  else
    gunzip -c "${BACKUP_FILE}" | psql -U "${POSTGRES_USER:-postgres}" -d "${POSTGRES_DB:-ssjewellers}"
  fi
else
  echo "Restoring plain SQL file..."
  if command -v docker >/dev/null 2>&1 && docker ps | grep -q "ssjewellery_postgres"; then
    docker exec -i ssjewellery_postgres psql -U postgres -d ssjewellers < "${BACKUP_FILE}"
  else
    psql -U "${POSTGRES_USER:-postgres}" -d "${POSTGRES_DB:-ssjewellers}" < "${BACKUP_FILE}"
  fi
fi

echo "✓ Database restore completed successfully!"
