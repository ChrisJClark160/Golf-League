#!/bin/sh
# Daily backup of PocketBase data.
# Run by the backup container's cron at 03:00 server time.
#
# - SQLite snapshot via .backup (safe to run while PB is live)
# - Tar of uploads directory
# - Retention: 7 daily files; older auto-deleted

set -eu

SOURCE_DIR="/source"
BACKUP_DIR="/backups/daily"
RETENTION_DAYS=7

DATE=$(date +%F)
DB_FILE="${SOURCE_DIR}/data.db"
UPLOADS_DIR="${SOURCE_DIR}/storage"

mkdir -p "${BACKUP_DIR}"

# ---- SQLite snapshot --------------------------------------------------
if [ -f "${DB_FILE}" ]; then
    echo "[$(date)] Backing up SQLite database..."
    sqlite3 "${DB_FILE}" ".backup '${BACKUP_DIR}/db-${DATE}.sqlite'"
    gzip -f "${BACKUP_DIR}/db-${DATE}.sqlite"
    echo "[$(date)] Database backup complete: db-${DATE}.sqlite.gz"
else
    echo "[$(date)] WARNING: ${DB_FILE} not found, skipping DB backup"
fi

# ---- Uploads tarball -------------------------------------------------
if [ -d "${UPLOADS_DIR}" ]; then
    echo "[$(date)] Backing up uploads directory..."
    tar -czf "${BACKUP_DIR}/uploads-${DATE}.tar.gz" -C "${SOURCE_DIR}" storage
    echo "[$(date)] Uploads backup complete: uploads-${DATE}.tar.gz"
else
    echo "[$(date)] WARNING: ${UPLOADS_DIR} not found, skipping uploads backup"
fi

# ---- Retention: keep last 7 days -------------------------------------
echo "[$(date)] Cleaning up backups older than ${RETENTION_DAYS} days..."
find "${BACKUP_DIR}" -name "db-*.sqlite.gz" -mtime +${RETENTION_DAYS} -delete
find "${BACKUP_DIR}" -name "uploads-*.tar.gz" -mtime +${RETENTION_DAYS} -delete

echo "[$(date)] Backup run complete."
