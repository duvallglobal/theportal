import pg from 'pg';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function hashPassword(password) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

async function testAuth() {
  try {
    console.log('Connecting to database...');
    const client = await pool.connect();
    console.log('Successfully connected to database');

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
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) RETURNING *`,
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
      
      console.log('Admin user created successfully:');
      console.log(insertResult.rows[0]);
    } else {
      console.log('Admin user already exists:');
      console.log(checkResult.rows[0]);
    }

    // Create a test client user
    const checkClientResult = await client.query('SELECT * FROM "user" WHERE username = $1', ['testclient']);
    
    if (checkClientResult.rowCount === 0) {
      console.log('Creating test client user...');
      const hashedPassword = await hashPassword('testpassword');
      
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
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) RETURNING *`,
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
      
      console.log('Test client user created successfully:');
      console.log(insertResult.rows[0]);
    } else {
      console.log('Test client user already exists:');
      console.log(checkClientResult.rows[0]);
    }

    client.release();
    console.log('Database connection released');
  } catch (error) {
    console.error('Error in testAuth:', error);
  } finally {
    process.exit(0);
  }
}

testAuth();