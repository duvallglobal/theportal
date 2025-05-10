import pg from 'pg';
const { Pool } = pg;

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' 
    ? { rejectUnauthorized: false } 
    : undefined
});

async function createAdminUser() {
  try {
    console.log('Checking if admin user exists...');
    // Check if admin user already exists
    const { rows } = await pool.query(`
      SELECT * FROM users WHERE username = 'admin' LIMIT 1
    `);
    
    if (rows.length > 0) {
      console.log('Admin user already exists.');
      return;
    }
    
    console.log('Creating admin user...');
    // Pre-hashed password "secret" with bcrypt
    const hashedPassword = '$2a$10$iqJSHD.BGr0E2IxQwYgJmeP3NvhPrXAeLSaGCj6IR/XU5QtjVu5Tm';
    
    // Create admin user
    await pool.query(`
      INSERT INTO users (
        username, password, email, full_name, role, phone,
        created_at, updated_at, onboarding_status, onboarding_step, verification_status
      ) VALUES (
        'admin', $1, 'admin@managethefans.com', 'Admin User', 'admin', '+1234567890',
        NOW(), NOW(), 'complete', 1, 'verified'
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

createAdminUser();