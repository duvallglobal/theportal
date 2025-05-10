import * as pg from 'pg';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env') });

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function fixTableMismatch() {
  const client = await pool.connect();
  
  try {
    console.log('Starting database fix operation...');
    
    // Begin transaction
    await client.query('BEGIN');
    
    // Step 1: Copy the schema structure from "users" to a new table called "user_temp"
    console.log('Step 1: Creating temporary users table with correct structure...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS "user_temp" (
        id SERIAL PRIMARY KEY,
        username TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        full_name TEXT NOT NULL,
        phone TEXT,
        role TEXT NOT NULL DEFAULT 'client',
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
        plan TEXT,
        onboarding_status TEXT DEFAULT 'incomplete',
        onboarding_step INTEGER DEFAULT 1,
        verification_status TEXT DEFAULT 'pending',
        stripe_customer_id TEXT,
        stripe_subscription_id TEXT
      );
    `);
    
    // Step 2: Insert data from "user" table to "user_temp", with field name transformations
    console.log('Step 2: Migrating data from "user" table to "user_temp"...');
    await client.query(`
      INSERT INTO "user_temp" (
        id, 
        username, 
        password, 
        email, 
        full_name, 
        phone, 
        role, 
        created_at, 
        updated_at, 
        plan, 
        onboarding_status, 
        onboarding_step, 
        verification_status, 
        stripe_customer_id, 
        stripe_subscription_id
      )
      SELECT 
        id, 
        username, 
        password, 
        email, 
        "fullName", 
        phone, 
        role, 
        "createdAt", 
        "updatedAt", 
        plan, 
        "onboardingStatus", 
        "onboardingStep", 
        "verificationStatus", 
        "stripeCustomerId", 
        "stripeSubscriptionId"
      FROM "user"
      ON CONFLICT (id) DO NOTHING;
    `);
    
    // Step 3: Drop the original "users" table if it exists
    console.log('Step 3: Dropping the current "users" table...');
    await client.query(`DROP TABLE IF EXISTS "users";`);
    
    // Step 4: Rename "user_temp" to "users"
    console.log('Step 4: Renaming "user_temp" to "users"...');
    await client.query(`ALTER TABLE "user_temp" RENAME TO "users";`);
    
    // Commit the transaction
    await client.query('COMMIT');
    console.log('Database fix completed successfully!');
    
    // Verify the data
    const countResult = await client.query('SELECT COUNT(*) FROM "users"');
    console.log(`Users table now contains ${countResult.rows[0].count} records.`);
    
    // Now check the first user to make sure everything looks correct
    const userResult = await client.query('SELECT * FROM "users" LIMIT 1');
    if (userResult.rows.length > 0) {
      const user = userResult.rows[0];
      console.log('Sample user from fixed table:');
      console.log({
        id: user.id,
        username: user.username,
        email: user.email,
        // Don't log the password
        fullName: user.full_name,
        role: user.role,
        onboardingStatus: user.onboarding_status,
        // Other fields omitted for brevity
      });
    }
    
  } catch (error) {
    // If anything fails, rollback the transaction
    await client.query('ROLLBACK');
    console.error('Error fixing the database:', error);
  } finally {
    client.release();
    console.log('Database connection released');
    process.exit(0);
  }
}

fixTableMismatch();