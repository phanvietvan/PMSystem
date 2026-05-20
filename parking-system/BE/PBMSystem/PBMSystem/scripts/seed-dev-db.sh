#!/usr/bin/env bash
# Creates / updates pbmsystem_dev.db and seeds 3 dev users (User, Staff, Admin).
#
# Usage:
#   ./scripts/seed-dev-db.sh           # migrate + seed
#   ./scripts/seed-dev-db.sh --fresh   # delete dev db, migrate, seed

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
API_DIR="$ROOT/PBMSystem.API"
DB_PATH="$API_DIR/pbmsystem_dev.db"
SEED_PROJECT="$ROOT/tools/SeedDevUsers/SeedDevUsers.csproj"

export ASPNETCORE_ENVIRONMENT=Development

FRESH=false
if [[ "${1:-}" == "--fresh" ]]; then
  FRESH=true
fi

if $FRESH && [[ -f "$DB_PATH" ]]; then
  rm -f "$DB_PATH"
  echo "Removed existing database: $DB_PATH"
fi

cd "$API_DIR"
echo "Applying EF migrations..."
dotnet ef database update --project ../Repositories

echo "Seeding dev users..."
dotnet run --project "$SEED_PROJECT" -- "$DB_PATH"

echo ""
echo "Done. Start API with: dotnet run --project PBMSystem.API"
