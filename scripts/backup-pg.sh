#!/usr/bin/env bash
set -euo pipefail
OUT="${1:-./backups/alygen_$(date +%Y%m%d_%H%M%S).sql}"
mkdir -p "$(dirname "$OUT")"
PGHOST="${PGHOST:-localhost}"
PGPORT="${PGPORT:-5432}"
PGUSER="${PGUSER:-postgres}"
PGDATABASE="${PGDATABASE:-alygen_crm}"
export PGPASSWORD="${PGPASSWORD:-postgres}"
pg_dump -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" "$PGDATABASE" > "$OUT"
echo "Backup guardado em $OUT"
