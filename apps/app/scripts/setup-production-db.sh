#!/bin/bash
# Setup production database schema

echo "🚀 Setting up production database..."

# Make sure we're using production env vars
source .env.local

# Push schema to database (creates all tables)
DATABASE_URL="$DIRECT_URL" npx prisma db push --accept-data-loss

# Generate Prisma client
npx prisma generate

echo "✅ Production database is ready!"
