#!/bin/bash
# Setup script for Linux/macOS

echo "========================================"
echo "Billing System - Database Setup"
echo "========================================"

if ! command -v psql &> /dev/null; then
    echo "ERROR: PostgreSQL not installed"
    exit 1
fi

read -p "PostgreSQL username (default: postgres): " DB_USER
DB_USER=${DB_USER:-postgres}
read -sp "PostgreSQL password: " DB_PASSWORD
echo ""
read -p "Database name (default: billing_system): " DB_NAME
DB_NAME=${DB_NAME:-billing_system}

echo "Creating .env file..."
cat > .env << ENVFILE
DATABASE_URL=postgresql://$DB_USER:$DB_PASSWORD@localhost:5432/$DB_NAME
NODE_ENV=development
ENVFILE

echo "Creating database..."
PGPASSWORD=$DB_PASSWORD psql -U $DB_USER -c "CREATE DATABASE $DB_NAME;" 2>/dev/null
npm run db:push
echo "✓ Setup Complete!"
