import { pgTable, text, serial, integer, boolean, timestamp, json, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users Table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  fullName: text("full_name").notNull(),
  phone: text("phone"),
  role: text("role").default("client").notNull(), // 'admin' or 'client'
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  plan: text("plan"), // 'basic', 'pro', 'premium'
  onboardingStatus: text("onboarding_status").default("incomplete"), // 'incomplete', 'complete'
  onboardingStep: integer("onboarding_step").default(1),
  verificationStatus: text("verification_status").default("pending"), // 'pending', 'verified', 'rejected'
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
});

// Profiles Table
export const profiles = pgTable("profiles", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  preferredContactMethod: text("preferred_contact_method"),
  preferredCheckInTime: text("preferred_check_in_time"),
  timezone: text("timezone"),
  brandDescription: text("brand_description"),
  voiceTone: text("voice_tone"),
  doNotSayTerms: text("do_not_say_terms"),
  uploadFrequency: text("upload_frequency"), // 'daily', 'weekly', 'biweekly'
  birthDate: text("birth_date"),
});

// Platform Accounts Table
export const platformAccounts = pgTable("platform_accounts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  platformType: text("platform_type").notNull(), // 'OnlyFans', 'Instagram', etc.
  username: text("username"),
  password: text("password"), // Should be encrypted in a real app
  needsCreation: boolean("needs_creation").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Content Strategy Table
export const contentStrategies = pgTable("content_strategies", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  growthGoals: json("growth_goals").notNull(),
  contentTypes: json("content_types").notNull(),
  doNotSayTerms: text("do_not_say_terms"),
  existingContent: text("existing_content"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Media Files Table
export const mediaFiles = pgTable("media_files", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  description: text("description"),
  fileType: text("file_type").notNull(), // 'image', 'video', etc.
  storagePath: text("storage_path").notNull(),
  thumbnailPath: text("thumbnail_path"),
  status: text("status").default("pending").notNull(), // 'pending', 'approved', 'rejected'
  uploadDate: timestamp("upload_date").defaultNow().notNull(),
  scheduledDate: timestamp("scheduled_date"),
  tags: json("tags"),
});

// Verification Documents
export const verificationDocuments = pgTable("verification_documents", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  documentType: text("document_type").notNull(), // 'id_front', 'id_back', 'selfie'
  storagePath: text("storage_path").notNull(),
  uploadDate: timestamp("upload_date").defaultNow().notNull(),
  status: text("status").default("pending").notNull(), // 'pending', 'verified', 'rejected'
});

// Subscriptions Table
export const subscriptions = pgTable("subscriptions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  planType: text("plan_type").notNull(), // 'basic', 'pro', 'premium'
  stripeSubscriptionId: text("stripe_subscription_id").notNull(),
  status: text("status").default("active").notNull(), // 'active', 'canceled', 'past_due'
  startDate: timestamp("start_date").defaultNow().notNull(),
  endDate: timestamp("end_date"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Appointments Table
export const appointments = pgTable("appointments", {
  id: serial("id").primaryKey(),
  adminId: integer("admin_id").notNull().references(() => users.id),
  clientId: integer("client_id").notNull().references(() => users.id),
  appointmentDate: timestamp("appointment_date").notNull(),
  duration: integer("duration").notNull(), // in minutes
  location: text("location").notNull(),
  details: text("details"),
  amount: varchar("amount", { length: 50 }),
  photoUrl: text("photo_url"),
  status: text("status").default("pending").notNull(), // 'pending', 'approved', 'declined', 'canceled'
  notificationSent: boolean("notification_sent").default(false),
  notificationMethod: text("notification_method"), // 'email', 'sms', 'in-app', 'all'
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Messages Table
export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  conversationId: integer("conversation_id").notNull().references(() => conversations.id),
  senderId: integer("sender_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  readAt: timestamp("read_at"),
  attachments: json("attachments"),
});

// Conversations Table
export const conversations = pgTable("conversations", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  lastMessagePreview: text("last_message_preview"),
});

// Conversation Participants Table
export const conversationParticipants = pgTable("conversation_participants", {
  id: serial("id").primaryKey(),
  conversationId: integer("conversation_id").notNull().references(() => conversations.id),
  userId: integer("user_id").notNull().references(() => users.id),
  joinedAt: timestamp("joined_at").defaultNow().notNull(),
});

// Notifications Table
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  type: text("type").notNull(), // 'content', 'appointment', 'message', etc.
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  readAt: timestamp("read_at"),
  deliveryMethod: text("delivery_method").notNull(), // 'email', 'in-app'
});

// RentMen Settings Table
export const rentMenSettings = pgTable("rent_men_settings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  geographicAvailability: text("geographic_availability"),
  minimumRate: text("minimum_rate"),
  clientScreeningPreferences: text("client_screening_preferences"),
  servicesOffered: json("services_offered"),
  approvalProcess: text("approval_process").default("manual"), // 'auto', 'manual'
  bookingSummaryPreferences: json("booking_summary_preferences"),
  availabilityTimes: json("availability_times"),
  receiveBookingAlerts: boolean("receive_booking_alerts").default(true),
  showOnlyVerifiedClients: boolean("show_only_verified_clients").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Create Zod schemas for validation

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  onboardingStatus: true,
  onboardingStep: true,
  verificationStatus: true,
  stripeCustomerId: true,
  stripeSubscriptionId: true,
});

export const insertProfileSchema = createInsertSchema(profiles).omit({
  id: true
});

export const insertPlatformAccountSchema = createInsertSchema(platformAccounts).omit({
  id: true,
  createdAt: true
});

export const insertContentStrategySchema = createInsertSchema(contentStrategies).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertMediaFileSchema = createInsertSchema(mediaFiles).omit({
  id: true,
  uploadDate: true,
  status: true
});

export const insertVerificationDocumentSchema = createInsertSchema(verificationDocuments).omit({
  id: true,
  uploadDate: true,
  status: true
});

export const insertSubscriptionSchema = createInsertSchema(subscriptions).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertAppointmentSchema = createInsertSchema(appointments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  status: true,
  notificationSent: true
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  createdAt: true,
  readAt: true
});

export const insertConversationSchema = createInsertSchema(conversations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  lastMessagePreview: true
});

export const insertRentMenSettingsSchema = createInsertSchema(rentMenSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
  readAt: true
});

// Type exports
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertProfile = z.infer<typeof insertProfileSchema>;
export type Profile = typeof profiles.$inferSelect;

export type InsertPlatformAccount = z.infer<typeof insertPlatformAccountSchema>;
export type PlatformAccount = typeof platformAccounts.$inferSelect;

export type InsertContentStrategy = z.infer<typeof insertContentStrategySchema>;
export type ContentStrategy = typeof contentStrategies.$inferSelect;

export type InsertMediaFile = z.infer<typeof insertMediaFileSchema>;
export type MediaFile = typeof mediaFiles.$inferSelect;

export type InsertVerificationDocument = z.infer<typeof insertVerificationDocumentSchema>;
export type VerificationDocument = typeof verificationDocuments.$inferSelect;

export type InsertSubscription = z.infer<typeof insertSubscriptionSchema>;
export type Subscription = typeof subscriptions.$inferSelect;

export type InsertAppointment = z.infer<typeof insertAppointmentSchema>;
export type Appointment = typeof appointments.$inferSelect;

export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof messages.$inferSelect;

export type InsertConversation = z.infer<typeof insertConversationSchema>;
export type Conversation = typeof conversations.$inferSelect;

export type InsertRentMenSettings = z.infer<typeof insertRentMenSettingsSchema>;
export type RentMenSettings = typeof rentMenSettings.$inferSelect;

export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Notification = typeof notifications.$inferSelect;
