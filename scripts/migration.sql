-- Auto-generated migration script


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
);


-- Create profiles table
CREATE TABLE IF NOT EXISTS "profiles" (
  "id" SERIAL PRIMARY KEY
  -- Other columns will be defined in pg database migrations
);


-- Create platform_accounts table
CREATE TABLE IF NOT EXISTS "platform_accounts" (
  "id" SERIAL PRIMARY KEY
  -- Other columns will be defined in pg database migrations
);


-- Create content_strategies table
CREATE TABLE IF NOT EXISTS "content_strategies" (
  "id" SERIAL PRIMARY KEY
  -- Other columns will be defined in pg database migrations
);


-- Create media_files table
CREATE TABLE IF NOT EXISTS "media_files" (
  "id" SERIAL PRIMARY KEY
  -- Other columns will be defined in pg database migrations
);


-- Create verification_documents table
CREATE TABLE IF NOT EXISTS "verification_documents" (
  "id" SERIAL PRIMARY KEY
  -- Other columns will be defined in pg database migrations
);


-- Create subscriptions table
CREATE TABLE IF NOT EXISTS "subscriptions" (
  "id" SERIAL PRIMARY KEY
  -- Other columns will be defined in pg database migrations
);


-- Create appointments table
CREATE TABLE IF NOT EXISTS "appointments" (
  "id" SERIAL PRIMARY KEY
  -- Other columns will be defined in pg database migrations
);


-- Create messages table
CREATE TABLE IF NOT EXISTS "messages" (
  "id" SERIAL PRIMARY KEY
  -- Other columns will be defined in pg database migrations
);


-- Create conversations table
CREATE TABLE IF NOT EXISTS "conversations" (
  "id" SERIAL PRIMARY KEY
  -- Other columns will be defined in pg database migrations
);


-- Create conversation_participants table
CREATE TABLE IF NOT EXISTS "conversation_participants" (
  "id" SERIAL PRIMARY KEY
  -- Other columns will be defined in pg database migrations
);


-- Create notifications table
CREATE TABLE IF NOT EXISTS "notifications" (
  "id" SERIAL PRIMARY KEY
  -- Other columns will be defined in pg database migrations
);


-- Create rent_men_settings table
CREATE TABLE IF NOT EXISTS "rent_men_settings" (
  "id" SERIAL PRIMARY KEY
  -- Other columns will be defined in pg database migrations
);


-- Create analytics table
CREATE TABLE IF NOT EXISTS "analytics" (
  "id" SERIAL PRIMARY KEY
  -- Other columns will be defined in pg database migrations
);


-- Create communication_templates table
CREATE TABLE IF NOT EXISTS "communication_templates" (
  "id" SERIAL PRIMARY KEY
  -- Other columns will be defined in pg database migrations
);


-- Create communication_history table
CREATE TABLE IF NOT EXISTS "communication_history" (
  "id" SERIAL PRIMARY KEY
  -- Other columns will be defined in pg database migrations
);

