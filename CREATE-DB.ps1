# PowerShell script to create PostgreSQL database reliably
# Usage: powershell -ExecutionPolicy Bypass -File CREATE-DB.ps1

$username = "postgres"
$password = "ABC123"
$host = "localhost"
$port = 5432
$database = "billing_system"

Write-Host "Creating database: $database" -ForegroundColor Cyan
Write-Host "Host: $host" -ForegroundColor Cyan
Write-Host "User: $username" -ForegroundColor Cyan
Write-Host ""

# Create connection string for postgres database (to create new database)
$connectionString = "Server=$host;Port=$port;Username=$username;Password=$password;Database=postgres"

# SQL command to create database
$sqlCommand = "CREATE DATABASE `"$database`";"

try {
    # Try to connect and create database
    $connection = New-Object Npgsql.NpgsqlConnection
    $connection.ConnectionString = $connectionString
    $connection.Open()
    
    Write-Host "Connected to PostgreSQL" -ForegroundColor Green
    
    $command = $connection.CreateCommand()
    $command.CommandText = $sqlCommand
    
    try {
        $command.ExecuteNonQuery() | Out-Null
        Write-Host "Database created successfully!" -ForegroundColor Green
    } catch {
        if ($_.Exception.Message -like "*already exists*") {
            Write-Host "Database already exists (OK)" -ForegroundColor Yellow
        } else {
            throw $_
        }
    }
    
    $connection.Close()
    exit 0
}
catch {
    Write-Host "ERROR: Could not create database" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit 1
}
