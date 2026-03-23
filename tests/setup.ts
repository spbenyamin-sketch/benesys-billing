// Global test setup — runs before each test file
process.env.NODE_ENV = "test";
process.env.SESSION_SECRET = "test-secret-key-for-integration-tests";
// Use the real DATABASE_URL if set, otherwise skip DB tests
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = "postgresql://postgres:ABC123@localhost:5432/billing_system";
}
