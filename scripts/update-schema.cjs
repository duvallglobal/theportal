// Using CommonJS format for compatibility
const dotenv = require('dotenv');
dotenv.config();
const { Pool } = require('pg');

async function updateSchema() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log('Starting database schema update...');

    // Begin transaction
    await pool.query('BEGIN');

    // Add missing columns to profiles table
    await pool.query(`
      ALTER TABLE profiles 
      ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id),
      ADD COLUMN IF NOT EXISTS preferred_contact_method TEXT,
      ADD COLUMN IF NOT EXISTS preferred_check_in_time TEXT,
      ADD COLUMN IF NOT EXISTS timezone TEXT,
      ADD COLUMN IF NOT EXISTS brand_description TEXT,
      ADD COLUMN IF NOT EXISTS voice_tone TEXT,
      ADD COLUMN IF NOT EXISTS do_not_say_terms TEXT,
      ADD COLUMN IF NOT EXISTS upload_frequency TEXT,
      ADD COLUMN IF NOT EXISTS birth_date TEXT
    `);
    console.log('Updated profiles table');

    // Add missing columns to platform_accounts table
    await pool.query(`
      ALTER TABLE platform_accounts 
      ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id),
      ADD COLUMN IF NOT EXISTS platform_type TEXT NOT NULL DEFAULT 'OnlyFans',
      ADD COLUMN IF NOT EXISTS username TEXT,
      ADD COLUMN IF NOT EXISTS password TEXT,
      ADD COLUMN IF NOT EXISTS needs_creation BOOLEAN DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    `);
    console.log('Updated platform_accounts table');

    // Add missing columns to media_files table
    await pool.query(`
      ALTER TABLE media_files 
      ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id),
      ADD COLUMN IF NOT EXISTS title TEXT NOT NULL DEFAULT 'Untitled',
      ADD COLUMN IF NOT EXISTS description TEXT,
      ADD COLUMN IF NOT EXISTS file_type TEXT NOT NULL DEFAULT 'image',
      ADD COLUMN IF NOT EXISTS storage_path TEXT NOT NULL DEFAULT '',
      ADD COLUMN IF NOT EXISTS thumbnail_path TEXT,
      ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pending',
      ADD COLUMN IF NOT EXISTS upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      ADD COLUMN IF NOT EXISTS scheduled_date TIMESTAMP,
      ADD COLUMN IF NOT EXISTS tags JSONB
    `);
    console.log('Updated media_files table');

    // Add missing columns to verification_documents table
    await pool.query(`
      ALTER TABLE verification_documents 
      ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id),
      ADD COLUMN IF NOT EXISTS document_type TEXT NOT NULL DEFAULT 'id',
      ADD COLUMN IF NOT EXISTS storage_path TEXT NOT NULL DEFAULT '',
      ADD COLUMN IF NOT EXISTS upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pending'
    `);
    console.log('Updated verification_documents table');

    // Add missing columns to content_strategies table
    await pool.query(`
      ALTER TABLE content_strategies
      ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id),
      ADD COLUMN IF NOT EXISTS growth_goals JSONB DEFAULT '{}',
      ADD COLUMN IF NOT EXISTS content_types JSONB DEFAULT '{}',
      ADD COLUMN IF NOT EXISTS do_not_say_terms TEXT,
      ADD COLUMN IF NOT EXISTS existing_content TEXT,
      ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    `);
    console.log('Updated content_strategies table');

    // Add missing columns to conversations table
    await pool.query(`
      ALTER TABLE conversations 
      ADD COLUMN IF NOT EXISTS last_message_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    `);
    console.log('Updated conversations table');

    // Create session table if it doesn't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS session (
        sid VARCHAR PRIMARY KEY,
        sess JSON NOT NULL,
        expire TIMESTAMP(6) NOT NULL
      )
    `);
    console.log('Ensured session table exists');

    // Commit transaction
    await pool.query('COMMIT');
    console.log('Database schema update completed successfully.');
  } catch (error) {
    // Rollback in case of error
    await pool.query('ROLLBACK');
    console.error('Error updating database schema:', error);
  } finally {
    // Close the database connection
    await pool.end();
  }
}

updateSchema();