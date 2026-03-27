#!/bin/bash
# =============================================================
# fix-image-upload.sh  —  Run ONCE on the VPS to fix course covers
# Usage:  bash /root/sufi-academy/backend/fix-image-upload.sh
# =============================================================
set -e

BACKEND_DIR="/root/sufi-academy/backend"
DB_CONN="postgresql://sufi_user:SufiAcademy2024@localhost:5432/sufi_academy"

cd "$BACKEND_DIR"

echo "===== [1/5] Applying DB migration ====="
# Apply migration using node + Prisma $executeRawUnsafe (no psql needed)
DATABASE_URL="$DB_CONN" node -e "
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
p.\$executeRawUnsafe('ALTER TABLE \"courses\" ADD COLUMN IF NOT EXISTS \"imageUrl\" TEXT')
  .then(() => { console.log('Column imageUrl — OK'); })
  .catch(e => { console.error('Migration error:', e.message); process.exit(1); })
  .finally(() => p.\$disconnect());
"

echo "===== [2/5] Regenerating Prisma client ====="
DATABASE_URL="$DB_CONN" npx prisma generate
echo "Prisma generate — OK"

echo "===== [3/5] Building backend ====="
npm run build
echo "Build — OK"

echo "===== [4/5] Ensuring uploads dir writable ====="
mkdir -p "$BACKEND_DIR/uploads"
chmod 755 "$BACKEND_DIR/uploads"
echo "uploads/ — OK"

echo "===== [5/5] Restarting backend ====="
pm2 restart backend
sleep 3

echo ""
echo "===== Recent logs ====="
pm2 logs backend --lines 30 --nostream

echo ""
echo "===== Verifying column exists ====="
DATABASE_URL="$DB_CONN" node -e "
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
p.\$queryRawUnsafe('SELECT column_name FROM information_schema.columns WHERE table_name=\'courses\' AND column_name=\'imageUrl\'')
  .then(r => { console.log(r.length ? '✅ imageUrl column EXISTS' : '❌ imageUrl column MISSING'); })
  .catch(e => console.error(e.message))
  .finally(() => p.\$disconnect());
"
