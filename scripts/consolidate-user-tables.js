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

async function consolidateUserTables() {
  const client = await pool.connect();
  
  try {
    console.log('Starting user table consolidation...');
    
    // Begin transaction
    await client.query('BEGIN');
    
    // Step 1: Check if both tables exist
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name IN ('user', 'users')
    `);
    
    const existingTables = tablesResult.rows.map(row => row.table_name);
    console.log(`Found tables: ${existingTables.join(', ')}`);
    
    // If only users table exists, we're already good
    if (existingTables.includes('users') && !existingTables.includes('user')) {
      console.log('Only "users" table exists, no consolidation needed.');
      await client.query('COMMIT');
      return;
    }
    
    // If only user table exists, rename it to users
    if (existingTables.includes('user') && !existingTables.includes('users')) {
      console.log('Only "user" table exists, renaming to "users"...');
      
      // Step 1: Create "users" table with snake_case column names
      await client.query(`
        CREATE TABLE IF NOT EXISTS "users" (
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
      
      // Step 2: Copy data from "user" table to "users"
      await client.query(`
        INSERT INTO "users" (
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
      
      // Step 3: Drop the "user" table
      await client.query(`DROP TABLE IF EXISTS "user" CASCADE;`);
      console.log('Successfully renamed "user" table to "users".');
    }
    
    // If both tables exist, merge data and keep "users"
    if (existingTables.includes('user') && existingTables.includes('users')) {
      console.log('Both tables exist, merging data...');
      
      // Get max ID from users table to avoid conflicts
      const maxIdResult = await client.query('SELECT MAX(id) as max_id FROM "users"');
      const maxId = maxIdResult.rows[0].max_id || 0;
      console.log(`Max ID in users table: ${maxId}`);
      
      // Copy data from "user" table to "users" with ID offset to avoid conflicts
      await client.query(`
        INSERT INTO "users" (
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
          username || '_' || id as username, 
          password, 
          'migrated_' || id || '_' || email as email, 
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
        WHERE NOT EXISTS (
          SELECT 1 FROM "users" u 
          WHERE u.username = "user".username OR u.email = "user".email
        );
      `);
      
      // Step 3: Update foreign keys in related tables
      const relatedTables = [
        { table: 'profiles', column: 'user_id' },
        { table: 'platform_accounts', column: 'user_id' },
        { table: 'content_strategies', column: 'user_id' },
        { table: 'media_files', column: 'user_id' },
        { table: 'verification_documents', column: 'user_id' },
        { table: 'subscriptions', column: 'user_id' },
        { table: 'appointments', column: 'client_id' },
        { table: 'appointments', column: 'admin_id' },
        { table: 'conversation_participants', column: 'user_id' },
        { table: 'messages', column: 'sender_id' },
        { table: 'notifications', column: 'user_id' },
        { table: 'rent_men_settings', column: 'user_id' },
        { table: 'analytics', column: 'user_id' },
        { table: 'communication_templates', column: 'created_by' },
        { table: 'communication_history', column: 'recipient_id' },
        { table: 'communication_history', column: 'sender_id' }
      ];
      
      // Just check if tables exist before attempting to update
      for (const item of relatedTables) {
        const tableExists = await client.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_name = $1
          )
        `, [item.table]);
        
        if (tableExists.rows[0].exists) {
          const columnExists = await client.query(`
            SELECT EXISTS (
              SELECT FROM information_schema.columns 
              WHERE table_schema = 'public' AND table_name = $1 AND column_name = $2
            )
          `, [item.table, item.column]);
          
          if (columnExists.rows[0].exists) {
            console.log(`Updating references in ${item.table}.${item.column}...`);
            try {
              // This is a basic approach - in a real project with lots of data,
              // you would want to handle this more carefully
              await client.query(`
                UPDATE "${item.table}" 
                SET "${item.column}" = u2.id
                FROM "user" u1
                JOIN "users" u2 ON u1.username = u2.username
                WHERE "${item.table}"."${item.column}" = u1.id;
              `);
            } catch (err) {
              console.log(`Warning: Could not update references in ${item.table}.${item.column}: ${err.message}`);
            }
          }
        }
      }
      
      // Step 4: Drop the "user" table
      await client.query(`DROP TABLE IF EXISTS "user" CASCADE;`);
      console.log('Successfully merged "user" table into "users" and dropped "user" table.');
    }
    
    // Commit the transaction
    await client.query('COMMIT');
    console.log('User table consolidation completed successfully!');
    
    // Verify the data
    const countResult = await client.query('SELECT COUNT(*) FROM "users"');
    console.log(`Users table now contains ${countResult.rows[0].count} records.`);
    
    // Now check the first user to make sure everything looks correct
    const userResult = await client.query('SELECT * FROM "users" LIMIT 1');
    if (userResult.rows.length > 0) {
      const user = userResult.rows[0];
      console.log('Sample user from consolidated table:');
      console.log({
        id: user.id,
        username: user.username,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
        onboarding_status: user.onboarding_status,
      });
    }
    
  } catch (error) {
    // If anything fails, rollback the transaction
    await client.query('ROLLBACK');
    console.error('Error consolidating user tables:', error);
  } finally {
    client.release();
    console.log('Database connection released');
    process.exit(0);
  }
}

consolidateUserTables();