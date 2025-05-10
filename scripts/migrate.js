import * as pg from 'pg';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import * as bcrypt from 'bcryptjs';

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

async function createTablesFromSchema() {
  try {
    console.log('Connected to PostgreSQL database');
    
    const client = await pool.connect();
    
    // Create tables in correct order (considering foreign key constraints)
    
    // Create user table
    await client.query(`
      CREATE TABLE IF NOT EXISTS "user" (
        id SERIAL PRIMARY KEY,
        username VARCHAR(255) NOT NULL UNIQUE,
        email VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        "fullName" VARCHAR(255) NOT NULL,
        phone VARCHAR(255),
        role VARCHAR(50) NOT NULL,
        "onboardingStatus" VARCHAR(50),
        "onboardingStep" INTEGER,
        "verificationStatus" VARCHAR(50),
        plan VARCHAR(50),
        "stripeCustomerId" VARCHAR(255),
        "stripeSubscriptionId" VARCHAR(255),
        "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
    console.log('User table created or already exists');
    
    // Create session table for session storage
    await client.query(`
      CREATE TABLE IF NOT EXISTS "session" (
        sid VARCHAR NOT NULL PRIMARY KEY,
        sess JSON NOT NULL,
        expire TIMESTAMP(6) NOT NULL
      );
      CREATE INDEX IF NOT EXISTS IDX_session_expire ON "session" (expire);
    `);
    console.log('Session table created or already exists');

    // Create profile_settings table
    await client.query(`
      CREATE TABLE IF NOT EXISTS "profile_settings" (
        id SERIAL PRIMARY KEY,
        "userId" INTEGER NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
        "preferredContactMethod" VARCHAR(50),
        "preferredCheckInTime" VARCHAR(50),
        timezone VARCHAR(50),
        "brandDescription" TEXT,
        "voiceTone" VARCHAR(255),
        "doNotSayTerms" TEXT,
        "uploadFrequency" VARCHAR(50),
        "birthDate" VARCHAR(50),
        UNIQUE("userId")
      );
    `);
    console.log('Profile settings table created or already exists');

    // Create platform_credentials table
    await client.query(`
      CREATE TABLE IF NOT EXISTS "platform_credentials" (
        id SERIAL PRIMARY KEY,
        "userId" INTEGER NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
        "platformType" VARCHAR(50) NOT NULL,
        username VARCHAR(255),
        password VARCHAR(255),
        "needsCreation" BOOLEAN,
        "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
        UNIQUE("userId", "platformType")
      );
    `);
    console.log('Platform credentials table created or already exists');

    // Create growth_settings table
    await client.query(`
      CREATE TABLE IF NOT EXISTS "growth_settings" (
        id SERIAL PRIMARY KEY,
        "userId" INTEGER NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
        "growthGoals" JSONB NOT NULL DEFAULT '{}',
        "contentTypes" JSONB NOT NULL DEFAULT '{}',
        "doNotSayTerms" TEXT,
        "existingContent" TEXT,
        "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
        UNIQUE("userId")
      );
    `);
    console.log('Growth settings table created or already exists');

    // Create content_uploads table
    await client.query(`
      CREATE TABLE IF NOT EXISTS "content_uploads" (
        id SERIAL PRIMARY KEY,
        "userId" INTEGER NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        "fileType" VARCHAR(50) NOT NULL,
        "storagePath" VARCHAR(255) NOT NULL,
        "thumbnailPath" VARCHAR(255),
        "uploadDate" TIMESTAMP NOT NULL DEFAULT NOW(),
        "scheduledDate" TIMESTAMP,
        status VARCHAR(50) NOT NULL DEFAULT 'pending',
        tags JSONB
      );
    `);
    console.log('Content uploads table created or already exists');

    // Create verification_documents table
    await client.query(`
      CREATE TABLE IF NOT EXISTS "verification_documents" (
        id SERIAL PRIMARY KEY,
        "userId" INTEGER NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
        "documentType" VARCHAR(50) NOT NULL,
        "storagePath" VARCHAR(255) NOT NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'pending',
        "uploadDate" TIMESTAMP NOT NULL DEFAULT NOW(),
        "reviewDate" TIMESTAMP,
        "reviewNotes" TEXT
      );
    `);
    console.log('Verification documents table created or already exists');

    // Create subscriptions table
    await client.query(`
      CREATE TABLE IF NOT EXISTS "subscriptions" (
        id SERIAL PRIMARY KEY,
        "userId" INTEGER NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
        "stripeSubscriptionId" VARCHAR(255) NOT NULL,
        "planType" VARCHAR(50) NOT NULL,
        status VARCHAR(50) NOT NULL,
        "startDate" TIMESTAMP NOT NULL,
        "endDate" TIMESTAMP,
        "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
    console.log('Subscriptions table created or already exists');

    // Create conversations table
    await client.query(`
      CREATE TABLE IF NOT EXISTS "conversations" (
        id SERIAL PRIMARY KEY,
        "participantIds" INTEGER[] NOT NULL,
        title VARCHAR(255),
        "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
        "lastMessageAt" TIMESTAMP
      );
    `);
    console.log('Conversations table created or already exists');

    // Create messages table
    await client.query(`
      CREATE TABLE IF NOT EXISTS "messages" (
        id SERIAL PRIMARY KEY,
        "conversationId" INTEGER NOT NULL REFERENCES "conversations"(id) ON DELETE CASCADE,
        "senderId" INTEGER NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
        "readAt" TIMESTAMP,
        attachments JSONB
      );
    `);
    console.log('Messages table created or already exists');

    // Create appointments table
    await client.query(`
      CREATE TABLE IF NOT EXISTS "appointments" (
        id SERIAL PRIMARY KEY,
        "adminId" INTEGER NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
        "clientId" INTEGER NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
        "appointmentDate" TIMESTAMP NOT NULL,
        duration INTEGER NOT NULL,
        location VARCHAR(255) NOT NULL,
        details TEXT,
        status VARCHAR(50) NOT NULL DEFAULT 'pending',
        amount VARCHAR(50),
        "photoUrl" VARCHAR(255),
        "notificationSent" BOOLEAN,
        "notificationMethod" VARCHAR(50),
        "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
    console.log('Appointments table created or already exists');

    // Create provider_settings table
    await client.query(`
      CREATE TABLE IF NOT EXISTS "provider_settings" (
        id SERIAL PRIMARY KEY,
        "userId" INTEGER NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
        "geographicAvailability" TEXT,
        "minimumRate" VARCHAR(50),
        "clientScreeningPreferences" TEXT,
        "maximumClientsPerWeek" INTEGER,
        "maximumWeeklyHours" INTEGER,
        "preferredAppointmentLength" INTEGER,
        "preferredBookingNotice" INTEGER,
        "showOnlyVerifiedClients" BOOLEAN,
        "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
        UNIQUE("userId")
      );
    `);
    console.log('Provider settings table created or already exists');

    // Create analytics_reports table
    await client.query(`
      CREATE TABLE IF NOT EXISTS "analytics_reports" (
        id SERIAL PRIMARY KEY,
        "userId" INTEGER NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
        "reportDate" DATE NOT NULL,
        period VARCHAR(20) NOT NULL,
        "periodStart" DATE,
        "periodEnd" DATE,
        "totalAppointments" INTEGER NOT NULL DEFAULT 0,
        "completedAppointments" INTEGER,
        "canceledAppointments" INTEGER,
        "engagementRate" VARCHAR(50),
        "totalRevenue" NUMERIC(10,2),
        "averageRating" NUMERIC(3,2),
        "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
    console.log('Analytics reports table created or already exists');

    // Create templates table
    await client.query(`
      CREATE TABLE IF NOT EXISTS "templates" (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        type VARCHAR(50) NOT NULL,
        category VARCHAR(50) NOT NULL,
        subject TEXT,
        content TEXT NOT NULL,
        "isDefault" BOOLEAN,
        "createdBy" INTEGER NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
        "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
    console.log('Templates table created or already exists');

    // Create notifications table
    await client.query(`
      CREATE TABLE IF NOT EXISTS "notifications" (
        id SERIAL PRIMARY KEY,
        "userId" INTEGER NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        type VARCHAR(50) NOT NULL,
        "isRead" BOOLEAN NOT NULL DEFAULT FALSE,
        "deliveryMethod" VARCHAR(50) NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
        "readAt" TIMESTAMP
      );
    `);
    console.log('Notifications table created or already exists');

    // Create sent_communications table
    await client.query(`
      CREATE TABLE IF NOT EXISTS "sent_communications" (
        id SERIAL PRIMARY KEY,
        type VARCHAR(50) NOT NULL,
        "senderId" INTEGER NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
        "recipientId" INTEGER NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
        subject TEXT,
        content TEXT NOT NULL,
        "templateId" INTEGER REFERENCES "templates"(id) ON DELETE SET NULL,
        status VARCHAR(50) NOT NULL,
        "statusMessage" TEXT,
        "sentAt" TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
    console.log('Sent communications table created or already exists');

    client.release();
    console.log('All tables created successfully');
    
    return true;
  } catch (error) {
    console.error('Error creating tables:', error);
    return false;
  }
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
    
    client.release();
    return true;
  } catch (error) {
    console.error('Error creating admin user:', error);
    return false;
  }
}

async function main() {
  try {
    console.log('Starting database migration...');
    
    // Create tables first
    const tablesCreated = await createTablesFromSchema();
    
    if (tablesCreated) {
      // Then create admin user
      await createAdminUser();
    }
    
    console.log('Migration completed.');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

main();