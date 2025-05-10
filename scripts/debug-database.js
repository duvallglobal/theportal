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

async function debugTables() {
  try {
    console.log('Connecting to database...');
    const client = await pool.connect();
    console.log('Successfully connected to database');
    
    // List all tables in the database
    console.log('\nListing all tables in the database:');
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);
    
    console.log(tablesResult.rows.map(row => row.table_name));
    
    // Check if "user" table exists and show sample data
    console.log('\nChecking "user" table:');
    try {
      const userTableResult = await client.query(`
        SELECT * FROM "user" LIMIT 5;
      `);
      console.log(`"user" table exists with ${userTableResult.rowCount} records:`);
      console.log(userTableResult.rows);
    } catch (error) {
      console.log('"user" table does not exist or has an error:', error.message);
    }
    
    // Check if "users" table exists and show sample data
    console.log('\nChecking "users" table:');
    try {
      const usersTableResult = await client.query(`
        SELECT * FROM "users" LIMIT 5;
      `);
      console.log(`"users" table exists with ${usersTableResult.rowCount} records:`);
      console.log(usersTableResult.rows);
    } catch (error) {
      console.log('"users" table does not exist or has an error:', error.message);
    }
    
    client.release();
    console.log('\nDatabase connection released');
  } catch (error) {
    console.error('Error in debugging database:', error);
  } finally {
    process.exit(0);
  }
}

debugTables();