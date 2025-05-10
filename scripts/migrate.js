// This script automatically pushes the schema to the database
// It's designed to be non-interactive to avoid the need for user input

import { exec } from 'child_process';
import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const { Pool } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' 
    ? { rejectUnauthorized: false } 
    : undefined
});

async function createTablesFromSchema() {
  console.log('Creating tables from schema...');
  
  try {
    // Read schema file
    const schemaPath = path.join(__dirname, '../shared/schema.ts');
    const schemaContent = fs.readFileSync(schemaPath, 'utf8');
    
    // Extract table definitions using regex
    const tableRegex = /export const (\w+) = pgTable\("(\w+)"/g;
    let match;
    const tables = [];
    
    while ((match = tableRegex.exec(schemaContent)) !== null) {
      tables.push({
        variableName: match[1],
        tableName: match[2]
      });
    }
    
    // Check which tables exist in the database
    const { rows } = await pool.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
    `);
    
    const existingTables = rows.map(row => row.table_name);
    
    console.log('Existing tables:', existingTables);
    console.log('Tables defined in schema:', tables.map(t => t.tableName));
    
    // Tables that don't exist yet
    const missingTables = tables.filter(t => !existingTables.includes(t.tableName));
    
    if (missingTables.length === 0) {
      console.log('All tables already exist in the database.');
      return true;
    }
    
    console.log('Missing tables:', missingTables.map(t => t.tableName));
    
    // Create SQL file for missing tables
    let sqlContent = `-- Auto-generated migration script\n\n`;
    
    // Add user table first (since others depend on it)
    const userTable = tables.find(t => t.tableName === 'users' || t.variableName === 'users');
    if (userTable && !existingTables.includes(userTable.tableName)) {
      sqlContent += `
-- Create users table
CREATE TABLE IF NOT EXISTS "users" (
  "id" SERIAL PRIMARY KEY,
  "username" TEXT NOT NULL UNIQUE,
  "password" TEXT NOT NULL,
  "email" TEXT NOT NULL UNIQUE,
  "full_name" TEXT NOT NULL,
  "phone" TEXT,
  "role" TEXT NOT NULL DEFAULT 'client',
  "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMP NOT NULL DEFAULT NOW(),
  "plan" TEXT,
  "onboarding_status" TEXT DEFAULT 'incomplete',
  "onboarding_step" INTEGER DEFAULT 1,
  "verification_status" TEXT DEFAULT 'pending',
  "stripe_customer_id" TEXT,
  "stripe_subscription_id" TEXT
);\n\n`;
    }
    
    // Create other tables (skipping users since we handled it above)
    missingTables.forEach(table => {
      if (table.tableName !== 'users' && table.variableName !== 'users') {
        sqlContent += `
-- Create ${table.tableName} table
CREATE TABLE IF NOT EXISTS "${table.tableName}" (
  "id" SERIAL PRIMARY KEY
  -- Other columns will be defined in pg database migrations
);\n\n`;
      }
    });
    
    // Write SQL file
    const sqlFilePath = path.join(__dirname, 'migration.sql');
    fs.writeFileSync(sqlFilePath, sqlContent);
    
    // Execute SQL file against database
    console.log('Executing SQL migration...');
    await pool.query(sqlContent);
    
    console.log('Basic tables created successfully.');
    return true;
  } catch (error) {
    console.error('Error creating tables:', error);
    return false;
  }
}

async function main() {
  try {
    // Create basic tables first
    const tablesCreated = await createTablesFromSchema();
    
    if (tablesCreated) {
      console.log('Database tables are ready. Running drizzle-kit push...');
      
      // Now run drizzle-kit push to complete the schema
      exec('echo "yes" | npx drizzle-kit push', { shell: true }, (error, stdout, stderr) => {
        if (error) {
          console.error(`Error running drizzle-kit push: ${error.message}`);
          return;
        }
        if (stderr) {
          console.error(`drizzle-kit push stderr: ${stderr}`);
          return;
        }
        console.log(`drizzle-kit push stdout: ${stdout}`);
        console.log('Migration completed successfully!');
        
        // Create admin user for testing
        createAdminUser();
      });
    }
  } catch (error) {
    console.error('Migration error:', error);
    process.exit(1);
  }
}

async function createAdminUser() {
  try {
    // Check if admin user already exists
    const { rows } = await pool.query(`
      SELECT * FROM users WHERE username = 'admin' LIMIT 1
    `);
    
    if (rows.length > 0) {
      console.log('Admin user already exists.');
      return;
    }
    
    // Pre-hashed password "secret" with bcrypt
    const hashedPassword = '$2a$10$iqJSHD.BGr0E2IxQwYgJmeP3NvhPrXAeLSaGCj6IR/XU5QtjVu5Tm';
    
    // Create admin user
    await pool.query(`
      INSERT INTO users (
        username, password, email, full_name, role, phone
      ) VALUES (
        'admin', $1, 'admin@managethefans.com', 'Admin User', 'admin', '+1234567890'
      )
    `, [hashedPassword]);
    
    console.log('Admin user created successfully.');
  } catch (error) {
    console.error('Error creating admin user:', error);
  } finally {
    // Close the connection pool
    await pool.end();
  }
}

main();