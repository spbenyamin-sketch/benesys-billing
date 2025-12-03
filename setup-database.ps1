# Setup script for Windows PowerShell

Write-Host "========================================"
Write-Host "Billing System - Database Setup"
Write-Host "========================================"

$DB_USER = Read-Host "PostgreSQL username (default: postgres)"
if ([string]::IsNullOrWhiteSpace($DB_USER)) { $DB_USER = "postgres" }

$DB_PASSWORD = Read-Host "PostgreSQL password" -AsSecureString
$BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($DB_PASSWORD)
$DB_PASSWORD_TEXT = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)

$DB_NAME = Read-Host "Database name (default: billing_system)"
if ([string]::IsNullOrWhiteSpace($DB_NAME)) { $DB_NAME = "billing_system" }

$env:PGPASSWORD = $DB_PASSWORD_TEXT
psql -U $DB_USER -c "CREATE DATABASE $DB_NAME;" 2>$null

npm run db:push
Write-Host "✓ Setup Complete!"
