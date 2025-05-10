// Fix database schema to match our schema.ts definitions
import dotenv from 'dotenv';
dotenv.config();
import pg from 'pg';
const { Pool } = pg;

async function fixDatabaseSchema() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log('Starting comprehensive database schema fix...');

    // Begin transaction
    await pool.query('BEGIN');

    // Fix the appointments table - which appears to only have an ID
    await pool.query(`
      ALTER TABLE appointments 
      ADD COLUMN IF NOT EXISTS admin_id INTEGER REFERENCES users(id),
      ADD COLUMN IF NOT EXISTS client_id INTEGER REFERENCES users(id),
      ADD COLUMN IF NOT EXISTS appointment_date TIMESTAMP,
      ADD COLUMN IF NOT EXISTS duration INTEGER,
      ADD COLUMN IF NOT EXISTS location TEXT,
      ADD COLUMN IF NOT EXISTS details TEXT,
      ADD COLUMN IF NOT EXISTS amount VARCHAR(50),
      ADD COLUMN IF NOT EXISTS photo_url TEXT,
      ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending',
      ADD COLUMN IF NOT EXISTS notification_sent BOOLEAN DEFAULT false,
      ADD COLUMN IF NOT EXISTS notification_method TEXT,
      ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    `);
    console.log('Updated appointments table');

    // Fix the conversations table
    await pool.query(`
      ALTER TABLE conversations 
      ADD COLUMN IF NOT EXISTS title TEXT
    `);
    console.log('Updated conversations table');

    // Check if templates and communication_templates are duplicates
    const templateTables = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('templates', 'communication_templates')
    `);

    if (templateTables.rows.length === 2) {
      console.log('Found both templates and communication_templates tables.');
      
      // Count rows in each table
      const templateCount = await pool.query('SELECT COUNT(*) FROM templates');
      const commTemplateCount = await pool.query('SELECT COUNT(*) FROM communication_templates');
      
      console.log(`templates has ${templateCount.rows[0].count} rows`);
      console.log(`communication_templates has ${commTemplateCount.rows[0].count} rows`);
      
      // We will not attempt to drop either table automatically due to possible dependencies
      console.log('Will not automatically merge or drop templates to avoid breaking dependencies.');
      console.log('Please manually review and merge data if needed.');
    }

    // Add any missing columns to the messages table
    await pool.query(`
      ALTER TABLE messages 
      ADD COLUMN IF NOT EXISTS conversation_id INTEGER REFERENCES conversations(id),
      ADD COLUMN IF NOT EXISTS sender_id INTEGER REFERENCES users(id),
      ADD COLUMN IF NOT EXISTS content TEXT,
      ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      ADD COLUMN IF NOT EXISTS read_at TIMESTAMP,
      ADD COLUMN IF NOT EXISTS attachments JSONB
    `);
    console.log('Updated messages table');

    // Fix the notifications table
    await pool.query(`
      ALTER TABLE notifications 
      ADD COLUMN IF NOT EXISTS recipient_id INTEGER REFERENCES users(id),
      ADD COLUMN IF NOT EXISTS type TEXT,
      ADD COLUMN IF NOT EXISTS title TEXT,
      ADD COLUMN IF NOT EXISTS content TEXT,
      ADD COLUMN IF NOT EXISTS link TEXT,
      ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT false,
      ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    `);
    console.log('Updated notifications table');

    // Fix the conversation_participants table
    await pool.query(`
      ALTER TABLE conversation_participants 
      ADD COLUMN IF NOT EXISTS conversation_id INTEGER REFERENCES conversations(id),
      ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id),
      ADD COLUMN IF NOT EXISTS joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    `);
    console.log('Updated conversation_participants table');

    // Commit transaction
    await pool.query('COMMIT');
    console.log('Database schema fix completed successfully.');
  } catch (error) {
    // Rollback in case of error
    await pool.query('ROLLBACK');
    console.error('Error fixing database schema:', error);
  } finally {
    // Close the database connection
    await pool.end();
  }
}

fixDatabaseSchema();