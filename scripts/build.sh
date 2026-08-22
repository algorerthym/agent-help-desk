#!/bin/sh
set -e
# prisma generate only needs a nonempty URL that matches the provider.
# The real DATABASE_URL must be set on Vercel for runtime.
if [ -z "$DATABASE_URL" ]; then
  export DATABASE_URL="postgresql://user:pass@localhost:5432/neondb"
fi
npx prisma generate
npx next build
