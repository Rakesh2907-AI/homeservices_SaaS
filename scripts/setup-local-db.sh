#!/usr/bin/env bash
# Bootstraps the local Postgres install with the saas_user role + homeservices DB.
# Run once after `brew install postgresql@16 redis`.
set -euo pipefail

export PATH="$HOME/homebrew/bin:$HOME/homebrew/opt/postgresql@16/bin:$PATH"

# Initialize cluster if needed
DATA_DIR="$HOME/homebrew/var/postgresql@16"
if [ ! -d "$DATA_DIR/base" ]; then
  initdb --locale=C -E UTF-8 "$DATA_DIR"
fi

# Start postgres in the background (idempotent)
pg_ctl -D "$DATA_DIR" -l "$HOME/homebrew/var/log/postgres.log" status >/dev/null 2>&1 || \
  pg_ctl -D "$DATA_DIR" -l "$HOME/homebrew/var/log/postgres.log" start

# Start redis (idempotent)
pgrep -x redis-server >/dev/null 2>&1 || \
  redis-server --daemonize yes --logfile "$HOME/homebrew/var/log/redis.log"

# Wait for postgres readiness
for _ in {1..20}; do pg_isready -q && break; sleep 0.5; done

# Create role + database
psql -d postgres <<SQL
DO \$\$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='saas_user') THEN
    -- Intentionally NOT a SUPERUSER: superusers bypass RLS even with FORCE.
    -- CREATEROLE is needed so migrations can create the app_user role.
    CREATE ROLE saas_user LOGIN PASSWORD 'saas_password' CREATEROLE CREATEDB;
  END IF;
END \$\$;
SQL

psql -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname='homeservices'" | grep -q 1 || \
  psql -d postgres -c "CREATE DATABASE homeservices OWNER saas_user"

psql -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname='unleash'" | grep -q 1 || \
  psql -d postgres -c "CREATE DATABASE unleash OWNER saas_user"

# Pre-create extensions + app_user role inside homeservices
psql -d homeservices <<SQL
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
DO \$\$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='app_user') THEN
    CREATE ROLE app_user LOGIN PASSWORD 'app_password';
  END IF;
END \$\$;
GRANT CONNECT ON DATABASE homeservices TO app_user;
GRANT USAGE ON SCHEMA public TO app_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO app_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO app_user;
SQL

echo "✓ Postgres + Redis ready. DB: homeservices  User: saas_user/saas_password"
