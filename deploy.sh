#!/bin/bash
cd /var/www/sufi-academy
git fetch origin main
git reset --hard origin/main

echo "NEXT_PUBLIC_API_URL=https://muzasufy.com/api/v1" > /var/www/sufi-academy/frontend/.env.local

cat > /var/www/sufi-academy/backend/.env << ENVEOF
DATABASE_URL=postgresql://sufi_user:SufiAcademy2024@localhost:5432/sufi_academy
JWT_ACCESS_SECRET=sufi_academy_access_secret_key_minimum_32_chars
JWT_REFRESH_SECRET=sufi_academy_refresh_secret_key_minimum_32_chars
JWT_ACCESS_EXPIRES=15m
JWT_REFRESH_EXPIRES=7d
JWT_SECRET=sufi_academy_access_secret_key_minimum_32_chars
APP_PORT=4000
NODE_ENV=production
FRONTEND_URL=https://muzasufy.com
ENVEOF

cd /var/www/sufi-academy/backend && npm run build
pm2 restart all --update-env
echo "Deploy complete!"
