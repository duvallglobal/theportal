import * as pg from 'pg';
import * as bcrypt from 'bcryptjs';
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

async function hashPassword(password) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

async function createAdminUser() {
  try {
    console.log('Checking for admin user...');
    const client = await pool.connect();
    
    // Check if admin user exists
    const checkResult = await client.query('SELECT * FROM "user" WHERE username = $1', ['admin']);
    
    if (checkResult.rowCount === 0) {
      console.log('Creating admin user...');
      const hashedPassword = await hashPassword('secret');
      
      const insertResult = await client.query(
        `INSERT INTO "user" (
          username, 
          email, 
          password, 
          "fullName", 
          phone, 
          role, 
          "onboardingStatus", 
          "onboardingStep", 
          "verificationStatus", 
          plan, 
          "stripeCustomerId", 
          "stripeSubscriptionId", 
          "createdAt", 
          "updatedAt"
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) RETURNING id, username, email, role`,
        [
          'admin',
          'admin@example.com',
          hashedPassword,
          'Admin User',
          null,
          'admin',
          'completed',
          0,
          'verified',
          'enterprise',
          null,
          null,
          new Date(),
          new Date()
        ]
      );
      
      console.log('Admin user created successfully:', insertResult.rows[0]);
    } else {
      console.log('Admin user already exists:', checkResult.rows[0].username);
    }
    
    // Check for test client user
    const checkClientResult = await client.query('SELECT * FROM "user" WHERE username = $1', ['testclient']);
    
    if (checkClientResult.rowCount === 0) {
      console.log('Creating test client user...');
      const hashedPassword = await hashPassword('password123');
      
      const insertResult = await client.query(
        `INSERT INTO "user" (
          username, 
          email, 
          password, 
          "fullName", 
          phone, 
          role, 
          "onboardingStatus", 
          "onboardingStep", 
          "verificationStatus", 
          plan, 
          "stripeCustomerId", 
          "stripeSubscriptionId", 
          "createdAt", 
          "updatedAt"
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) RETURNING id, username, email, role`,
        [
          'testclient',
          'client@example.com',
          hashedPassword,
          'Test Client',
          null,
          'client',
          'in_progress',
          1,
          'pending',
          'basic',
          null,
          null,
          new Date(),
          new Date()
        ]
      );
      
      console.log('Test client user created successfully:', insertResult.rows[0]);
    } else {
      console.log('Test client user already exists:', checkClientResult.rows[0].username);
    }
    
    client.release();
    console.log('Database connection released');
    
    return true;
  } catch (error) {
    console.error('Error creating users:', error);
    return false;
  } finally {
    process.exit(0);
  }
}

createAdminUser();