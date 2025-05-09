import { Pool } from 'pg';

// Create a PostgreSQL connection pool for database operations
export const db = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' 
    ? { rejectUnauthorized: false } // For production (e.g., Supabase)
    : undefined // For development
});

// Log database connection status
db.on('connect', () => {
  console.log('Connected to PostgreSQL database');
});

db.on('error', (err) => {
  console.error('PostgreSQL connection error:', err.message);
});

// Export the database pool for use in other modules
export default db;