#!/bin/sh
# Restore from a backup. Use this in a drill (please do drill before launching).
#
# Usage:
#   ./scripts/restore.sh <date>
#   ./scripts/restore.sh 2026-05-25
#
# This script:
#   1. Stops the docker-compose stack
#   2. Restores db and uploads from the named backup
#   3. Brings the stack back up
#
# Run from the project root.

set -eu

if [ -z "${1-}" ]; then
    echo "Usage: $0 <date>  e.g.  $0 2026-05-25"
    exit 1
fi

DATE="$1"
DB_BACKUP="./backups/daily/db-${DATE}.sqlite.gz"
UPLOADS_BACKUP="./backups/daily/uploads-${DATE}.tar.gz"

if [ ! -f "${DB_BACKUP}" ]; then
    echo "ERROR: ${DB_BACKUP} not found"
    exit 1
fi

if [ ! -f "${UPLOADS_BACKUP}" ]; then
    echo "ERROR: ${UPLOADS_BACKUP} not found"
    exit 1
fi

echo "About to restore from ${DATE}. This will OVERWRITE current data."
printf "Type RESTORE to continue: "
read -r CONFIRM
if [ "${CONFIRM}" != "RESTORE" ]; then
    echo "Aborted."
    exit 1
fi

echo "Stopping stack..."
docker compose down

echo "Backing up current state as failsafe..."
NOW=$(date +%F-%H%M)
mkdir -p "./backups/pre-restore-${NOW}"
cp -r ./pocketbase/pb_data "./backups/pre-restore-${NOW}/"

echo "Restoring database..."
gunzip -c "${DB_BACKUP}" > ./pocketbase/pb_data/data.db

echo "Restoring uploads..."
rm -rf ./pocketbase/pb_data/storage
tar -xzf "${UPLOADS_BACKUP}" -C ./pocketbase/pb_data/

echo "Restarting stack..."
docker compose up -d

echo "Done. Pre-restore failsafe saved to ./backups/pre-restore-${NOW}/"
echo "Verify everything looks right, then delete the failsafe if no longer needed."
