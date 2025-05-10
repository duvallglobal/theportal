import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, hashPassword } from "./auth";
import { insertUserSchema, insertProfileSchema, insertPlatformAccountSchema, insertContentStrategySchema, insertMediaFileSchema, insertVerificationDocumentSchema, insertAppointmentSchema, insertMessageSchema, insertRentMenSettingsSchema, insertAnalyticsSchema, insertCommunicationTemplateSchema, insertCommunicationHistorySchema } from "@shared/schema";
import { z } from "zod";
import Stripe from "stripe";
import bcrypt from "bcryptjs";
import multer from "multer";
import path from "path";
import fs from "fs";
import { Resend } from "resend";
import { handleUpdateOnboardingStep, getOnboardingProgress } from "./routes/onboarding";
import adminRoutes from './routes/admin';
import appointmentsRoutes from './routes/appointments';
import { WebSocketServer, WebSocket } from 'ws';
import twilio from 'twilio';
import { supabase } from './supabase';
import passport from 'passport';
import { sendEmail } from './utils/email';

// Initialize Stripe if API key exists
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
let stripe: Stripe | undefined;
if (stripeSecretKey) {
  stripe = new Stripe(stripeSecretKey, {
    apiVersion: "2023-10-16" as any,
  });
}

// Initialize Resend if API key exists
const resendApiKey = process.env.RESEND_API_KEY;
let resend: Resend | undefined;
if (resendApiKey) {
  resend = new Resend(resendApiKey);
}

// Initialize Twilio if API keys exist
const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID;
const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;
let twilioClient: twilio.Twilio | undefined;

if (twilioAccountSid && twilioAuthToken && twilioAccountSid.startsWith('AC')) {
  try {
    twilioClient = twilio(twilioAccountSid, twilioAuthToken);
    console.log("Twilio client initialized");
  } catch (error) {
    console.error("Error initializing Twilio client:", error);
  }
} else {
  console.warn("Twilio credentials missing or invalid. SMS functionality will be unavailable.");
}

// Configure file uploads with personalized user directories
const baseUploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(baseUploadDir)) {
  fs.mkdirSync(baseUploadDir, { recursive: true });
}

const storage_multer = multer.diskStorage({
  destination: function (req, file, cb) {
    // Create user-specific directory if authenticated
    if (req.user && req.user.id) {
      const userDir = path.join(baseUploadDir, `user_${req.user.id}`);
      if (!fs.existsSync(userDir)) {
        fs.mkdirSync(userDir, { recursive: true });
      }
      cb(null, userDir);
    } else {
      // Fallback to base upload directory if no user ID (should never happen with validateSession)
      cb(null, baseUploadDir);
    }
  },
  filename: function (req, file, cb) {
    // Create a secure filename with content type prefix for better organization
    const contentTypePrefix = file.mimetype.startsWith('image/') ? 'img' : 'vid';
    const sanitizedOriginalName = file.originalname.replace(/[^a-zA-Z0-9.]/g, '_');
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, `${contentTypePrefix}-${uniqueSuffix}-${sanitizedOriginalName}`);
  },
});

const upload = multer({ storage: storage_multer });

// Session validation middleware
const validateSession = (req: Request, res: Response, next: NextFunction) => {
  if (!req.isAuthenticated() || !req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  
  // User data is already attached to req.user by Passport
  next();
};

// Admin validation middleware
const validateAdmin = async (req: any, res: any, next: any) => {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ message: "Forbidden" });
  }
  next();
};

// Utility to format phone number for Twilio
function formatPhoneNumber(phoneNumber: string): string {
  // Remove all non-numeric characters
  const digitsOnly = phoneNumber.replace(/\D/g, '');
  
  // Ensure it has country code, add +1 (US) if needed
  if (digitsOnly.length === 10) {
    return `+1${digitsOnly}`;
  } else if (digitsOnly.length > 10 && !phoneNumber.startsWith('+')) {
    return `+${digitsOnly}`;
  }
  
  // If already has +, just return the cleaned version
  return phoneNumber.startsWith('+') ? phoneNumber : `+${digitsOnly}`;
}

// Function to send SMS notifications
async function sendSmsNotification(to: string, message: string): Promise<boolean> {
  if (!twilioClient || !twilioPhoneNumber) {
    console.warn("Twilio not configured. SMS not sent.");
    return false;
  }

  try {
    // Format the phone number for Twilio
    const formattedNumber = formatPhoneNumber(to);
    
    const result = await twilioClient.messages.create({
      body: message,
      from: twilioPhoneNumber,
      to: formattedNumber
    });
    
    console.log(`SMS sent successfully: ${result.sid}`);
    return true;
  } catch (error) {
    console.error("Error sending SMS:", error);
    return false;
  }
}

// WebSocket clients store
interface WSClient {
  userId: number;
  username: string;
  role: string;
  connection: WebSocket;
}

let wsClients: WSClient[] = [];

// WebSocket message types
type WSMessageType = 'message' | 'notification' | 'status' | 'typing' | 'read' | 'appointment';

interface WSMessage {
  type: WSMessageType;
  data: any;
  sender: {
    id: number;
    username: string;
  };
  timestamp: number;
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication with Passport
  const authMiddleware = setupAuth(app);
  
  // Register admin routes
  app.use('/api/admin', authMiddleware.isAdmin, adminRoutes);
  
  // Register appointments routes
  app.use('/api/appointments', validateSession, appointmentsRoutes);
  
  // Legacy Admin API Routes
  app.get("/api/admin/users", authMiddleware.isAdmin, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      
      // Remove sensitive data
      const sanitizedUsers = users.map(user => {
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
      });
      
      res.json(sanitizedUsers);
    } catch (error) {
      console.error("Error fetching all users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });
  
  // Get pending verifications (admin only)
  app.get("/api/admin/verifications/pending", authMiddleware.isAdmin, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      const pendingVerifications = users
        .filter(user => user.verificationStatus === "pending")
        .map(user => {
          const { password, ...userWithoutPassword } = user;
          return userWithoutPassword;
        });
      
      res.json(pendingVerifications);
    } catch (error) {
      console.error("Error fetching pending verifications:", error);
      res.status(500).json({ message: "Failed to fetch pending verifications" });
    }
  });
  
  // Get pending content (admin only)
  app.get("/api/admin/content/pending", authMiddleware.isAdmin, async (req, res) => {
    try {
      // Get all media files that are pending approval
      const allMedia = await Promise.all(
        (await storage.getAllUsers()).map(async user => {
          const media = await storage.getMediaFilesByUserId(user.id);
          return media.filter(m => m.status === "pending").map(m => ({
            ...m,
            user: {
              id: user.id,
              username: user.username,
              fullName: user.fullName
            }
          }));
        })
      );
      
      // Flatten the array of arrays
      const pendingContent = allMedia.flat();
      
      res.json(pendingContent);
    } catch (error) {
      console.error("Error fetching pending content:", error);
      res.status(500).json({ message: "Failed to fetch pending content" });
    }
  });
  // Auth routes are handled in auth.ts
  // Removing duplicate routes to avoid conflicts
  
  // Note: These endpoints are already defined in auth.ts:
  // - POST /api/auth/register
  // - POST /api/auth/login
  // - POST /api/auth/logout
  // - GET /api/auth/me
  
  // General user routes for the client management page
  app.get("/api/users", authMiddleware.isAuthenticated, async (req, res) => {
    try {
      // Only admins can see all users
      if (req.user.role !== "admin") {
        return res.status(403).json({ message: "Not authorized" });
      }
      
      const users = await storage.getAllUsers();
      
      // Remove sensitive data
      const sanitizedUsers = users.map(user => {
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
      });
      
      res.json(sanitizedUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });
  
  app.post("/api/users", authMiddleware.isAdmin, async (req, res) => {
    try {
      // Check if username or email already exists
      const existingUser = await storage.getUserByUsername(req.body.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }
      
      const emailExists = await storage.getUserByEmail(req.body.email);
      if (emailExists) {
        return res.status(400).json({ message: "Email already exists" });
      }
      
      // Use the imported hashPassword function from auth.ts
      const hashedPassword = await hashPassword(req.body.password);
      
      // Create new user
      const newUser = await storage.createUser({
        ...req.body,
        password: hashedPassword,
        role: req.body.role || "client" // Default to client role
      });
      
      // Remove password from response
      const { password, ...userWithoutPassword } = newUser;
      
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      console.error("Error creating user:", error);
      res.status(500).json({ message: "Failed to create user" });
    }
  });
  
  app.put("/api/users/:id", authMiddleware.isAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      
      // Verify user exists
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // If changing username, check if it's unique
      if (req.body.username && req.body.username !== user.username) {
        const existingUser = await storage.getUserByUsername(req.body.username);
        if (existingUser && existingUser.id !== userId) {
          return res.status(400).json({ message: "Username already exists" });
        }
      }
      
      // If changing email, check if it's unique
      if (req.body.email && req.body.email !== user.email) {
        const emailExists = await storage.getUserByEmail(req.body.email);
        if (emailExists && emailExists.id !== userId) {
          return res.status(400).json({ message: "Email already exists" });
        }
      }
      
      // Handle password update if provided
      let updateData = { ...req.body };
      if (req.body.password) {
        updateData.password = await hashPassword(req.body.password);
      } else {
        delete updateData.password;
      }
      
      // Update user
      const updatedUser = await storage.updateUser(userId, updateData);
      
      // Remove password from response
      const { password, ...userWithoutPassword } = updatedUser;
      
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ message: "Failed to update user" });
    }
  });
  
  app.delete("/api/users/:id", authMiddleware.isAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      
      // Verify user exists
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Don't allow deleting the main admin account
      if (user.username === "admin") {
        return res.status(403).json({ message: "Cannot delete the main admin account" });
      }
      
      // Delete user
      await storage.deleteUser(userId);
      
      res.json({ success: true, message: "User deleted successfully" });
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ message: "Failed to delete user" });
    }
  });

  // Profile routes
  app.get("/api/profile", validateSession, async (req, res) => {
    try {
      const profile = await storage.getProfileByUserId(req.user.id);
      if (!profile) {
        return res.status(404).json({ message: "Profile not found" });
      }
      res.json(profile);
    } catch (error) {
      console.error("Get profile error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put("/api/profile/personal-info", validateSession, async (req, res) => {
    try {
      const { fullName, email, phone, birthDate, timezone, preferredCheckInTime, preferredContactMethod } = req.body;
      
      // Update user
      await storage.updateUser(req.user.id, { fullName, email });
      
      // Update or create profile
      let profile = await storage.getProfileByUserId(req.user.id);
      if (profile) {
        profile = await storage.updateProfile(profile.id, {
          birthDate, timezone, preferredCheckInTime, preferredContactMethod
        });
      } else {
        profile = await storage.createProfile({
          userId: req.user.id,
          birthDate, timezone, preferredCheckInTime, preferredContactMethod
        });
      }
      
      res.json({ message: "Profile updated successfully" });
    } catch (error) {
      console.error("Update profile error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put("/api/profile/account-credentials", validateSession, async (req, res) => {
    try {
      const { platforms } = req.body;
      
      for (const platform of platforms) {
        const existingAccount = await storage.getPlatformAccountByUserIdAndType(req.user.id, platform.platform);
        
        if (existingAccount) {
          await storage.updatePlatformAccount(existingAccount.id, {
            username: platform.username,
            password: platform.password,
            needsCreation: platform.needsCreation
          });
        } else {
          await storage.createPlatformAccount({
            userId: req.user.id,
            platformType: platform.platform,
            username: platform.username,
            password: platform.password,
            needsCreation: platform.needsCreation
          });
        }
      }
      
      res.json({ message: "Account credentials updated successfully" });
    } catch (error) {
      console.error("Update account credentials error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Brand strategy routes
  app.get("/api/brand-strategy", validateSession, async (req, res) => {
    try {
      const strategy = await storage.getContentStrategyByUserId(req.user.id);
      if (!strategy) {
        return res.status(404).json({ message: "Content strategy not found" });
      }
      res.json(strategy);
    } catch (error) {
      console.error("Get brand strategy error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put("/api/brand-strategy", validateSession, async (req, res) => {
    try {
      const { growthGoals, contentTypes, brandDescription, voiceTone, doNotSayTerms, uploadFrequency, existingContent } = req.body;
      
      // Update profile for brand-related fields
      let profile = await storage.getProfileByUserId(req.user.id);
      if (profile) {
        profile = await storage.updateProfile(profile.id, {
          brandDescription, voiceTone, doNotSayTerms, uploadFrequency
        });
      } else {
        profile = await storage.createProfile({
          userId: req.user.id,
          brandDescription, voiceTone, doNotSayTerms, uploadFrequency
        });
      }
      
      // Update or create content strategy
      let strategy = await storage.getContentStrategyByUserId(req.user.id);
      if (strategy) {
        strategy = await storage.updateContentStrategy(strategy.id, {
          growthGoals, contentTypes, doNotSayTerms, existingContent
        });
      } else {
        strategy = await storage.createContentStrategy({
          userId: req.user.id,
          growthGoals, contentTypes, doNotSayTerms, existingContent
        });
      }
      
      res.json({ message: "Brand strategy updated successfully" });
    } catch (error) {
      console.error("Update brand strategy error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Onboarding routes
  app.post("/api/onboarding/tooltip/:step", validateSession, handleUpdateOnboardingStep);
  
  app.post("/api/onboarding/step/:stepNumber", validateSession, async (req, res) => {
    try {
      const { stepNumber } = req.params;
      const step = parseInt(stepNumber);
      
      if (isNaN(step) || step < 1 || step > 8) {
        return res.status(400).json({ message: "Invalid step number" });
      }
      
      // Process step data
      switch (step) {
        case 1: // Identity
          const { fullName, dateOfBirth, email, phone } = req.body;
          try {
            // First update basic user info
            await storage.updateUser(req.user.id, { 
              fullName: fullName || '', 
              email: email || req.user.email // Keep existing email if none provided
            });
            
            // Then update or create profile with additional details
            let profile = await storage.getProfileByUserId(req.user.id);
            if (profile) {
              await storage.updateProfile(profile.id, {
                birthDate: dateOfBirth || null,
                phone: phone || null
              });
            } else {
              await storage.createProfile({
                userId: req.user.id,
                birthDate: dateOfBirth || null,
                phone: phone || null
              });
            }
          } catch (error) {
            console.error("Error saving identity information:", error);
            return res.status(500).json({ message: "Error saving identity information" });
          }
          break;
          
        case 2: // Account Access
          try {
            // Handle OnlyFans account
            const { 
              onlyFansUsername, 
              onlyFansPassword, 
              needsOnlyFansCreation,
              instagramUsername,
              needsInstagramCreation,
              tiktokUsername,
              needsTiktokCreation,
              twitterUsername,
              needsTwitterCreation,
              snapchatUsername,
              needsSnapchatCreation,
              redditUsername,
              needsRedditCreation,
              preferredHandles
            } = req.body;
            
            // Store OnlyFans account - always save this regardless of values
            let platformType = "OnlyFans";
            let existingAccount = await storage.getPlatformAccountByUserIdAndType(req.user.id, platformType);
            
            if (existingAccount) {
              await storage.updatePlatformAccount(existingAccount.id, {
                username: onlyFansUsername || null,
                password: onlyFansPassword || null,
                needsCreation: needsOnlyFansCreation === true
              });
            } else {
              await storage.createPlatformAccount({
                userId: req.user.id,
                platformType,
                username: onlyFansUsername || null,
                password: onlyFansPassword || null,
                needsCreation: needsOnlyFansCreation === true
              });
            }
            
            // Social media platforms with same handling pattern
            const socialPlatforms = [
              { type: "Instagram", username: instagramUsername, needsCreation: needsInstagramCreation },
              { type: "TikTok", username: tiktokUsername, needsCreation: needsTiktokCreation },
              { type: "Twitter", username: twitterUsername, needsCreation: needsTwitterCreation },
              { type: "Snapchat", username: snapchatUsername, needsCreation: needsSnapchatCreation },
              { type: "Reddit", username: redditUsername, needsCreation: needsRedditCreation }
            ];
            
            // Process each social platform - only create/update if there's data
            for (const platform of socialPlatforms) {
              if (platform.username || platform.needsCreation) {
                existingAccount = await storage.getPlatformAccountByUserIdAndType(req.user.id, platform.type);
                
                if (existingAccount) {
                  await storage.updatePlatformAccount(existingAccount.id, {
                    username: platform.username || null,
                    needsCreation: platform.needsCreation === true
                  });
                } else {
                  await storage.createPlatformAccount({
                    userId: req.user.id,
                    platformType: platform.type,
                    username: platform.username || null,
                    needsCreation: platform.needsCreation === true
                  });
                }
              }
            }
            
            // Store preferred handles in profile
            let profile = await storage.getProfileByUserId(req.user.id);
            if (profile) {
              await storage.updateProfile(profile.id, {
                preferredHandles: preferredHandles || null
              });
            } else {
              await storage.createProfile({
                userId: req.user.id,
                preferredHandles: preferredHandles || null
              });
            }
          } catch (error) {
            console.error("Error saving account access information:", error);
            return res.status(500).json({ message: "Error saving account access information" });
          }
          
          break;
          
        case 3: // Brand Strategy
          const { growthGoals, contentTypes, brandDescription, voiceTone, doNotSayTerms } = req.body;
          
          // First, ensure the JSON data is properly formatted
          const formattedGrowthGoals = Array.isArray(growthGoals) ? JSON.stringify(growthGoals) : JSON.stringify([]);
          const formattedContentTypes = Array.isArray(contentTypes) ? JSON.stringify(contentTypes) : JSON.stringify([]);
          
          // Update profile information
          profile = await storage.getProfileByUserId(req.user.id);
          if (profile) {
            await storage.updateProfile(profile.id, {
              brandDescription,
              voiceTone,
              doNotSayTerms
            });
          } else {
            await storage.createProfile({
              userId: req.user.id,
              brandDescription,
              voiceTone,
              doNotSayTerms
            });
          }
          
          // Update content strategy
          const existingStrategy = await storage.getContentStrategyByUserId(req.user.id);
          if (existingStrategy) {
            await storage.updateContentStrategy(existingStrategy.id, {
              growthGoals: formattedGrowthGoals,
              contentTypes: formattedContentTypes,
              doNotSayTerms // Also store in content strategy for reference
            });
          } else {
            await storage.createContentStrategy({
              userId: req.user.id,
              growthGoals: formattedGrowthGoals,
              contentTypes: formattedContentTypes,
              doNotSayTerms
            });
          }
          break;
          
        case 4: // Communication
          const { notificationPreferences, bestContactMethod, preferredCheckInTime, timezone } = req.body;
          
          // Ensure preferences is stored as JSON if it's an array
          const formattedNotificationPreferences = Array.isArray(notificationPreferences) 
            ? JSON.stringify(notificationPreferences) 
            : JSON.stringify([]);
          
          profile = await storage.getProfileByUserId(req.user.id);
          if (profile) {
            await storage.updateProfile(profile.id, {
              preferredContactMethod: bestContactMethod,
              preferredCheckInTime,
              timezone
            });
          } else {
            await storage.createProfile({
              userId: req.user.id,
              preferredContactMethod: bestContactMethod,
              preferredCheckInTime,
              timezone
            });
          }
          
          // Also store notification preferences in a user-specific settings table if applicable
          // For now we'll add this data to the same profile record
          
          break;
          
        case 5: // Content Strategy
          const { uploadFrequency, existingContent } = req.body;
          
          // First update the profile with the upload frequency
          profile = await storage.getProfileByUserId(req.user.id);
          if (profile) {
            await storage.updateProfile(profile.id, {
              uploadFrequency
            });
          } else {
            await storage.createProfile({
              userId: req.user.id,
              uploadFrequency
            });
          }

          // Then update the content strategy with existing content
          const contentStrategy = await storage.getContentStrategyByUserId(req.user.id);
          if (contentStrategy) {
            await storage.updateContentStrategy(contentStrategy.id, {
              existingContent
            });
          } else {
            // If no content strategy exists yet, create one with default values for required fields
            await storage.createContentStrategy({
              userId: req.user.id,
              existingContent,
              growthGoals: JSON.stringify([]),
              contentTypes: JSON.stringify([])
            });
          }
          break;
          
        case 6: // Verification
          // This would typically upload files to a secure storage service
          // We'll just update the verification status for now
          await storage.updateUser(req.user.id, {
            verificationStatus: "pending"
          });
          break;
          
        case 7: // Concierge (Rent.Men)
          const rentMenData = req.body;
          
          const existingRentMenSettings = await storage.getRentMenSettingsByUserId(req.user.id);
          if (existingRentMenSettings) {
            await storage.updateRentMenSettings(existingRentMenSettings.id, rentMenData);
          } else {
            await storage.createRentMenSettings({
              userId: req.user.id,
              ...rentMenData
            });
          }
          break;
          
        case 8: // Legal & Consent
          // Update onboarding status to complete
          await storage.updateUser(req.user.id, {
            onboardingStatus: "complete",
            onboardingStep: 8
          });
          break;
      }
      
      // Update onboarding step
      if (step > req.user.onboardingStep) {
        await storage.updateUser(req.user.id, {
          onboardingStep: step
        });
      }
      
      res.json({ success: true, message: `Step ${step} completed successfully` });
    } catch (error) {
      console.error(`Onboarding step ${req.params.stepNumber} error:`, error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/onboarding/progress", validateSession, getOnboardingProgress);

  // Content upload and management routes
  app.post("/api/content/upload", validateSession, upload.array("files"), async (req, res) => {
    try {
      const files = req.files as Express.Multer.File[];
      const { contentType, platform, caption, tags, scheduled, scheduledDate } = req.body;
      
      if (!files || files.length === 0) {
        return res.status(400).json({ message: "No files uploaded" });
      }
      
      const uploadedFiles = [];
      
      for (const file of files) {
        const fileType = file.mimetype.startsWith("image/") ? "image" : "video";
        
        // Store the path to the uploaded file in the user's specific directory
        const storagePath = file.path;
        
        // Generate a thumbnail path for images (in a real app, you would generate thumbnails)
        const thumbnailPath = file.mimetype.startsWith("image/") 
          ? storagePath 
          : undefined;
        
        // Create the media file record with user-specific path
        const mediaFile = await storage.createMediaFile({
          userId: req.user.id,
          title: caption || file.originalname,
          description: caption || "",
          fileType,
          storagePath,
          thumbnailPath,
          status: "pending",
          scheduledDate: scheduled && scheduledDate ? new Date(scheduledDate) : undefined,
          tags: tags ? (typeof tags === 'string' ? JSON.parse(tags) : tags) : []
        });
        
        uploadedFiles.push(mediaFile);
      }
      
      // Create a notification for admins about new content uploaded
      const admins = await storage.getAllUsers().then(users => users.filter(user => user.role === 'admin'));
      for (const admin of admins) {
        await storage.createNotification({
          userId: admin.id,
          type: "content",
          content: `New content uploaded by ${req.user.username} for review.`,
          deliveryMethod: "in-app",
          read: false
        });
      }
      
      res.status(201).json({
        message: "Files uploaded successfully",
        files: uploadedFiles
      });
    } catch (error) {
      console.error("Content upload error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Get user's own content files
  app.get("/api/content", validateSession, async (req, res) => {
    try {
      const mediaFiles = await storage.getMediaFilesByUserId(req.user.id);
      
      // Map to safe URLs and exclude sensitive path information
      const safeMediaFiles = mediaFiles.map(file => ({
        id: file.id,
        title: file.title,
        description: file.description,
        fileType: file.fileType,
        status: file.status,
        uploadDate: file.uploadDate,
        scheduledDate: file.scheduledDate,
        tags: file.tags,
        // Create web-accessible URLs instead of filesystem paths
        url: `/api/content/file/${file.id}`,
        thumbnailUrl: file.thumbnailPath ? `/api/content/thumbnail/${file.id}` : undefined
      }));
      
      res.json(safeMediaFiles);
    } catch (error) {
      console.error("Get content error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Secure file serving routes - only allows access to authorized files
  app.get("/api/content/file/:id", validateSession, async (req, res) => {
    try {
      const fileId = parseInt(req.params.id);
      const mediaFile = await storage.getMediaFile(fileId);
      
      if (!mediaFile) {
        return res.status(404).json({ message: "File not found" });
      }
      
      // Access control: Only allow access to user's own files or admin access
      if (mediaFile.userId !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({ message: "Unauthorized access to this file" });
      }
      
      // Serve the file
      res.sendFile(mediaFile.storagePath);
      
    } catch (error) {
      console.error("Serve content file error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Secure thumbnail serving
  app.get("/api/content/thumbnail/:id", validateSession, async (req, res) => {
    try {
      const fileId = parseInt(req.params.id);
      const mediaFile = await storage.getMediaFile(fileId);
      
      if (!mediaFile || !mediaFile.thumbnailPath) {
        return res.status(404).json({ message: "Thumbnail not found" });
      }
      
      // Access control: Only allow access to user's own files or admin access
      if (mediaFile.userId !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({ message: "Unauthorized access to this thumbnail" });
      }
      
      // Serve the thumbnail
      res.sendFile(mediaFile.thumbnailPath);
      
    } catch (error) {
      console.error("Serve thumbnail error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/content/user/:userId", validateSession, async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      
      // Only allow users to view their own content or admins to view any content
      if (req.user.id !== userId && req.user.role !== "admin") {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      const mediaFiles = await storage.getMediaFilesByUserId(userId);
      res.json(mediaFiles);
    } catch (error) {
      console.error("Get content error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete("/api/content/:id", validateSession, async (req, res) => {
    try {
      const mediaId = parseInt(req.params.id);
      const mediaFile = await storage.getMediaFile(mediaId);
      
      if (!mediaFile) {
        return res.status(404).json({ message: "File not found" });
      }
      
      // Only allow users to delete their own content or admins to delete any content
      if (mediaFile.userId !== req.user.id && req.user.role !== "admin") {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      await storage.deleteMediaFile(mediaId);
      
      // Delete the actual file (in a real app this would be from a storage service)
      if (fs.existsSync(mediaFile.storagePath)) {
        fs.unlinkSync(mediaFile.storagePath);
      }
      
      res.json({ message: "File deleted successfully" });
    } catch (error) {
      console.error("Delete content error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Payment routes (Stripe)
  if (stripe) {
    app.post("/api/create-payment-intent", validateSession, async (req, res) => {
      try {
        const { amount } = req.body;
        
        const paymentIntent = await stripe.paymentIntents.create({
          amount: Math.round(amount * 100), // Convert to cents
          currency: "usd",
        });
        
        res.json({ clientSecret: paymentIntent.client_secret });
      } catch (error: any) {
        console.error("Create payment intent error:", error);
        res.status(500).json({ message: "Error creating payment intent: " + error.message });
      }
    });
    
    // API endpoint to create a setup intent for updating payment method
    app.post('/api/create-setup-intent', validateSession, async (req, res) => {
      try {
        const userId = req.user.id;
        const user = await storage.getUser(userId);
        
        // Check if user has a Stripe customer ID
        let customerId = user.stripeCustomerId;
        
        // If user doesn't have a Stripe customer ID, create one
        if (!customerId) {
          const customer = await stripe.customers.create({
            email: user.email,
            name: user.fullName || user.username,
            metadata: {
              userId: userId.toString()
            }
          });
          
          customerId = customer.id;
          
          // Update the user record with the Stripe customer ID
          await storage.updateUser(userId, {
            stripeCustomerId: customer.id
          });
        }
        
        // Create a SetupIntent
        const setupIntent = await stripe.setupIntents.create({
          customer: customerId,
          payment_method_types: ['card'],
        });
        
        res.json({
          clientSecret: setupIntent.client_secret
        });
      } catch (error: any) {
        console.error("Error creating setup intent:", error);
        res.status(500).json({ 
          message: "Error creating setup intent: " + error.message 
        });
      }
    });
    
    // API endpoint to update a payment method
    app.post('/api/update-payment-method', validateSession, async (req, res) => {
      try {
        const userId = req.user.id;
        const { paymentMethodId } = req.body;
        
        // Get the user's customer ID
        const user = await storage.getUser(userId);
        const customerId = user.stripeCustomerId;
        
        if (!customerId) {
          return res.status(400).json({ 
            message: "User does not have a Stripe customer ID" 
          });
        }
        
        // Get the user's subscription
        const subscription = await storage.getSubscriptionByUserId(userId);
        
        // If the user has an active subscription, update the payment method
        if (subscription?.stripeSubscriptionId) {
          await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
            default_payment_method: paymentMethodId
          });
        }
        
        // Set the payment method as the default for the customer
        await stripe.customers.update(customerId, {
          invoice_settings: {
            default_payment_method: paymentMethodId
          }
        });
        
        res.json({ 
          success: true,
          message: "Payment method updated successfully" 
        });
      } catch (error: any) {
        console.error("Error updating payment method:", error);
        res.status(500).json({ 
          message: "Error updating payment method: " + error.message 
        });
      }
    });

    app.post('/api/create-subscription', validateSession, async (req, res) => {
      try {
        const { planId } = req.body;
        
        if (!planId) {
          return res.status(400).json({ message: "Plan ID is required" });
        }
        
        // Check if user already has a Stripe customer ID
        let customerId = req.user.stripeCustomerId;
        
        if (!customerId) {
          // Create a new customer
          const customer = await stripe.customers.create({
            email: req.user.email,
            name: req.user.fullName,
          });
          
          customerId = customer.id;
          
          // Update user with Stripe customer ID
          await storage.updateUser(req.user.id, {
            stripeCustomerId: customerId
          });
        }
        
        // Create subscription
        const subscription = await stripe.subscriptions.create({
          customer: customerId,
          items: [{
            price: planId,
          }],
          payment_behavior: 'default_incomplete',
          expand: ['latest_invoice.payment_intent'],
        });
        
        // Update user with subscription ID
        await storage.updateUser(req.user.id, {
          stripeSubscriptionId: subscription.id
        });
        
        // Create subscription record
        await storage.createSubscription({
          userId: req.user.id,
          planType: getPlanTypeFromPriceId(planId),
          stripeSubscriptionId: subscription.id,
          status: subscription.status,
          startDate: new Date(subscription.current_period_start * 1000),
          endDate: new Date(subscription.current_period_end * 1000)
        });
        
        res.json({
          subscriptionId: subscription.id,
          clientSecret: (subscription.latest_invoice as any)?.payment_intent?.client_secret,
        });
      } catch (error: any) {
        console.error("Create subscription error:", error);
        res.status(500).json({ message: "Error creating subscription: " + error.message });
      }
    });
    
    // API endpoint to get user's subscription details
    app.get('/api/subscription', validateSession, async (req, res) => {
      try {
        const userId = req.user.id;
        const subscription = await storage.getSubscriptionByUserId(userId);
        
        if (!subscription) {
          return res.json(null);
        }
        
        // Get the user to include payment method details if available
        const user = await storage.getUser(userId);
        
        // If we have a Stripe subscription ID and Stripe is configured, fetch latest details
        if (subscription.stripeSubscriptionId && stripe && 
            !subscription.stripeSubscriptionId.startsWith('pending_')) {
          try {
            const stripeSubscription = await stripe.subscriptions.retrieve(
              subscription.stripeSubscriptionId,
              { 
                expand: ['default_payment_method']
              }
            );
            
            // Enhance response with Stripe data
            const paymentMethod = stripeSubscription.default_payment_method;
            const enhancedSubscription = {
              ...subscription,
              status: stripeSubscription.status,
              currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
              defaultPaymentMethod: paymentMethod ? {
                brand: paymentMethod.card.brand,
                last4: paymentMethod.card.last4,
                expMonth: paymentMethod.card.exp_month,
                expYear: paymentMethod.card.exp_year
              } : null
            };
            
            return res.json(enhancedSubscription);
          } catch (stripeError) {
            console.error("Error fetching Stripe subscription:", stripeError);
            // Continue to return the database subscription if Stripe fetch fails
          }
        }
        
        // Return the basic subscription from the database
        return res.json(subscription);
      } catch (error) {
        console.error("Error fetching subscription:", error);
        res.status(500).json({ message: "Failed to fetch subscription" });
      }
    });

    // Helper function to determine plan type from price ID
    function getPlanTypeFromPriceId(priceId: string): string {
      // In a real app, you would have a mapping of price IDs to plan types
      // This is just a placeholder implementation
      if (priceId.includes("basic")) return "basic";
      if (priceId.includes("pro")) return "pro";
      if (priceId.includes("premium")) return "premium";
      return "basic";
    }
  }

  // Appointments routes
  
  // Analytics routes
  app.get("/api/analytics", validateSession, async (req, res) => {
    try {
      // For clients, return only their own analytics
      if (req.user.role === "client") {
        const analytics = await storage.getAnalyticsByUserId(req.user.id);
        res.json(analytics);
      } 
      // For admins, return all analytics
      else if (req.user.role === "admin") {
        // Get all users (excluding admin users)
        const users = (await storage.getAllUsers()).filter(user => user.role === "client");
        
        // For each user, get their latest analytics record
        const allAnalytics = [];
        for (const user of users) {
          const analytics = await storage.getLatestAnalyticsByUserId(user.id);
          if (analytics) {
            allAnalytics.push({
              ...analytics,
              userName: user.fullName,
              userEmail: user.email
            });
          }
        }
        
        res.json(allAnalytics);
      } else {
        res.status(403).json({ message: "Unauthorized" });
      }
    } catch (error) {
      console.error("Get analytics error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.get("/api/analytics/:userId", validateSession, validateAdmin, async (req, res) => {
    try {
      const { userId } = req.params;
      const analytics = await storage.getAnalyticsByUserId(parseInt(userId));
      
      // Get user info to include with analytics
      const user = await storage.getUser(parseInt(userId));
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json({
        analytics,
        user: {
          id: user.id,
          fullName: user.fullName,
          email: user.email
        }
      });
    } catch (error) {
      console.error("Get user analytics error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.post("/api/analytics/:userId", validateSession, validateAdmin, async (req, res) => {
    try {
      const { userId } = req.params;
      const analyticsData = req.body;
      
      // Validate input data
      const validatedData = insertAnalyticsSchema.parse({
        ...analyticsData,
        userId: parseInt(userId)
      });
      
      // Create analytics record
      const analytics = await storage.createAnalytics(validatedData);
      
      res.status(201).json(analytics);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error("Create analytics error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.put("/api/analytics/:id", validateSession, validateAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const analyticsData = req.body;
      
      // Verify analytics record exists
      const existingAnalytics = await storage.getAnalytics(parseInt(id));
      if (!existingAnalytics) {
        return res.status(404).json({ message: "Analytics record not found" });
      }
      
      // Update analytics
      const updatedAnalytics = await storage.updateAnalytics(parseInt(id), analyticsData);
      
      res.json(updatedAnalytics);
    } catch (error) {
      console.error("Update analytics error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Admin creates an appointment proposal
  app.post("/api/appointments/propose", validateSession, validateAdmin, async (req, res) => {
    try {
      const { clientId, appointmentDate, appointmentTime, duration, location, details, amount, photoUrl, notificationMethod } = req.body;
      
      // Check if client exists
      const client = await storage.getUser(parseInt(clientId));
      if (!client) {
        return res.status(404).json({ message: "Client not found" });
      }
      
      // Create appointment proposal with date and time combined
      const appointment = await storage.createAppointment({
        adminId: req.user.id,
        clientId: parseInt(clientId),
        appointmentDate: new Date(appointmentDate),
        duration,
        location,
        details,
        amount,
        photoUrl,
        notificationMethod
      });
      
      // Format appointment details for notifications
      const formattedDate = new Date(appointmentDate).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric'
      });
      
      const appointmentSummary = `New appointment proposal for ${formattedDate} at ${location}. Duration: ${duration} minutes. Amount: $${amount}.`;
      
      // Send notifications based on selected methods
      if (notificationMethod === 'email' || notificationMethod === 'all') {
        // Implement email notification with SendGrid
        try {
          await sendEmail({
            to: client.email,
            from: 'appointments@managethefans.com',
            subject: 'New Appointment Proposal',
            text: `${appointmentSummary}\n\nPlease log in to your account to approve or decline this appointment.`,
            html: `
              <div style="font-family: Arial, sans-serif; color: #333;">
                <h2>New Appointment Proposal</h2>
                <p>${appointmentSummary}</p>
                <p>Please log in to your account to approve or decline this appointment.</p>
                <a href="${process.env.APP_URL || 'http://localhost:5000'}/appointments" style="background-color: #0ea5e9; color: white; padding: 10px 15px; text-decoration: none; border-radius: 4px; display: inline-block; margin-top: 15px;">View Appointment</a>
              </div>
            `
          });
          
          console.log(`Email notification sent to ${client.email} about appointment ${appointment.id}`);
        } catch (emailError) {
          console.error("Failed to send email notification:", emailError);
        }
        
        // Create a notification record
        await storage.createNotification({
          userId: parseInt(clientId),
          type: 'appointment',
          content: appointmentSummary,
          deliveryMethod: 'email'
        });
      }
      
      if (notificationMethod === 'sms' || notificationMethod === 'all') {
        // Send SMS notification with Twilio
        if (client.phone) {
          try {
            const smsMessage = `ManageTheFans: ${appointmentSummary} Login to your account to respond.`;
            const smsResult = await sendSmsNotification(client.phone, smsMessage);
            
            if (smsResult) {
              console.log(`SMS notification sent to ${client.phone} about appointment ${appointment.id}`);
            } else {
              console.error(`Failed to send SMS to ${client.phone}`);
            }
          } catch (smsError) {
            console.error("SMS notification error:", smsError);
          }
          
          // Create a notification record
          await storage.createNotification({
            userId: parseInt(clientId),
            type: 'appointment',
            content: appointmentSummary,
            deliveryMethod: 'sms'
          });
        }
      }
      
      // Always create in-app notification
      await storage.createNotification({
        userId: parseInt(clientId),
        type: 'appointment',
        content: appointmentSummary,
        deliveryMethod: 'in-app'
      });
      
      // Mark notification as sent
      await storage.updateAppointment(appointment.id, { notificationSent: true });
      
      res.status(201).json(appointment);
    } catch (error) {
      console.error("Create appointment proposal error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get all client users (for admin to select from)
  app.get("/api/users/clients", validateSession, validateAdmin, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      const clients = users.filter(user => user.role === "client");
      
      // Return only necessary info (don't include password or sensitive data)
      const clientsInfo = clients.map(client => ({
        id: client.id,
        fullName: client.fullName,
        email: client.email,
        username: client.username,
        phone: client.phone,
        verificationStatus: client.verificationStatus
      }));
      
      res.json(clientsInfo);
    } catch (error) {
      console.error("Get clients error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get appointments for a client
  app.get("/api/appointments/client", validateSession, async (req, res) => {
    try {
      const appointments = await storage.getAppointmentsByClientId(req.user.id);
      res.json(appointments);
    } catch (error) {
      console.error("Get client appointments error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Get all appointments (admin only)
  app.get("/api/appointments/admin", validateSession, validateAdmin, async (req, res) => {
    try {
      const appointments = await storage.getAppointmentsByAdminId(req.user.id);
      res.json(appointments);
    } catch (error) {
      console.error("Get admin appointments error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Client responds to appointment proposal (approve/decline)
  app.put("/api/appointments/:id/respond", validateSession, async (req, res) => {
    try {
      const appointmentId = parseInt(req.params.id);
      const { status } = req.body;
      
      if (status !== 'approved' && status !== 'declined') {
        return res.status(400).json({ message: "Status must be 'approved' or 'declined'" });
      }
      
      const appointment = await storage.getAppointment(appointmentId);
      
      if (!appointment) {
        return res.status(404).json({ message: "Appointment not found" });
      }
      
      // Only allow the client to respond to their own appointment proposals
      if (appointment.clientId !== req.user.id) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      const updatedAppointment = await storage.updateAppointment(appointmentId, { status });
      
      // Notify admin about the client's response
      await storage.createNotification({
        userId: appointment.adminId,
        type: 'appointment',
        content: `Client ${req.user.fullName} has ${status} your appointment proposal.`,
        deliveryMethod: 'in-app'
      });
      
      res.json(updatedAppointment);
    } catch (error) {
      console.error("Respond to appointment error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get a specific appointment
  app.get("/api/appointments/:id", validateSession, async (req, res) => {
    try {
      const appointmentId = parseInt(req.params.id);
      const appointment = await storage.getAppointment(appointmentId);
      
      if (!appointment) {
        return res.status(404).json({ message: "Appointment not found" });
      }
      
      // Only allow users to view appointments they're involved in (as admin or client)
      if (appointment.adminId !== req.user.id && appointment.clientId !== req.user.id) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      res.json(appointment);
    } catch (error) {
      console.error("Get appointment error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Conversations routes
  app.get("/api/conversations", validateSession, async (req, res) => {
    try {
      // Get all conversations where the user is a participant
      const userConversations = await storage.getConversationsByUserId(req.user.id);
      res.json(userConversations);
    } catch (error) {
      console.error("Get conversations error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.post("/api/conversations", validateSession, async (req, res) => {
    try {
      const { title, participantIds } = req.body;
      
      if (!participantIds || !Array.isArray(participantIds)) {
        return res.status(400).json({ message: "participantIds must be an array" });
      }
      
      // Ensure the current user is part of the conversation
      if (!participantIds.includes(req.user.id)) {
        participantIds.push(req.user.id);
      }
      
      // Create the conversation
      const conversation = await storage.createConversation({
        title: title || "New Conversation",
        createdAt: new Date(),
        updatedAt: new Date(),
        lastMessagePreview: ""
      });
      
      // Add all participants to the conversation
      for (const participantId of participantIds) {
        await storage.addUserToConversation(conversation.id, participantId);
      }
      
      // Get the full conversation with participants
      const fullConversation = await storage.getConversation(conversation.id);
      
      // Get all participants for this conversation
      const participants = await Promise.all(
        participantIds.map(async (id) => {
          const user = await storage.getUser(id);
          if (!user) return null;
          
          return {
            id: user.id,
            username: user.username,
            fullName: user.fullName,
            email: user.email,
            role: user.role
          };
        })
      );
      
      // Add participants to the conversation response
      const conversationWithParticipants = {
        ...fullConversation,
        participants: participants.filter(Boolean)
      };
      
      res.status(201).json(conversationWithParticipants);
    } catch (error) {
      console.error("Create conversation error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

// Messages routes
  app.post("/api/messages", validateSession, async (req, res) => {
    try {
      const { conversationId, content, attachments } = req.body;
      
      // Check if user is part of the conversation
      const isParticipant = await storage.isUserInConversation(req.user.id, parseInt(conversationId));
      
      if (!isParticipant) {
        return res.status(403).json({ message: "You are not part of this conversation" });
      }
      
      const message = await storage.createMessage({
        conversationId: parseInt(conversationId),
        senderId: req.user.id,
        content,
        attachments
      });
      
      // Update the conversation with the last message preview
      await storage.updateConversation(parseInt(conversationId), {
        lastMessagePreview: content.substring(0, 50) + (content.length > 50 ? "..." : "")
      });
      
      res.status(201).json(message);
    } catch (error) {
      console.error("Create message error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/messages/conversation/:conversationId", validateSession, async (req, res) => {
    try {
      const conversationId = parseInt(req.params.conversationId);
      
      // Check if user is part of the conversation
      const isParticipant = await storage.isUserInConversation(req.user.id, conversationId);
      
      if (!isParticipant && req.user.role !== "admin") {
        return res.status(403).json({ message: "You are not part of this conversation" });
      }
      
      const messages = await storage.getMessagesByConversationId(conversationId);
      res.json(messages);
    } catch (error) {
      console.error("Get messages error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.patch("/api/messages/:id/read", validateSession, async (req, res) => {
    try {
      const messageId = parseInt(req.params.id);
      
      const message = await storage.getMessage(messageId);
      
      if (!message) {
        return res.status(404).json({ message: "Message not found" });
      }
      
      // Check if user is part of the conversation
      const isParticipant = await storage.isUserInConversation(req.user.id, message.conversationId);
      
      if (!isParticipant && req.user.role !== "admin") {
        return res.status(403).json({ message: "You are not part of this conversation" });
      }
      
      // Only mark as read if the user is not the sender
      if (message.senderId !== req.user.id) {
        await storage.markMessageAsRead(messageId);
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error("Mark message as read error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Notifications routes
  app.post("/api/notifications/send", validateSession, validateAdmin, async (req, res) => {
    try {
      const { userId, type, content, deliveryMethod } = req.body;
      
      // Create notification
      const notification = await storage.createNotification({
        userId: parseInt(userId),
        type,
        content,
        deliveryMethod
      });
      
      // If delivery method is email and Resend API is available, send email
      if (deliveryMethod === "email" && resend) {
        const user = await storage.getUser(parseInt(userId));
        
        if (user && user.email) {
          await resend.emails.send({
            from: "noreply@managethefans.com",
            to: user.email,
            subject: `ManageTheFans Notification: ${getNotificationSubject(type)}`,
            html: `<div>
              <h1>ManageTheFans Notification</h1>
              <p>${content}</p>
              <p>Log in to your account to view more details.</p>
            </div>`
          });
        }
      }
      
      res.status(201).json(notification);
    } catch (error) {
      console.error("Send notification error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Helper function for notification subjects
  function getNotificationSubject(type: string): string {
    switch (type) {
      case "content": return "Content Update";
      case "appointment": return "Appointment Update";
      case "message": return "New Message";
      case "billing": return "Billing Update";
      default: return "New Notification";
    }
  }

  // Get current user's notifications
  app.get("/api/notifications", validateSession, async (req, res) => {
    try {
      const notifications = await storage.getNotificationsByUserId(req.user.id);
      // The notifications are already formatted correctly by the raw SQL query
      res.json(notifications);
    } catch (error) {
      console.error("Get notifications error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/notifications/user/:userId", validateSession, async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      
      // Only allow users to view their own notifications or admins to view any notifications
      if (req.user.id !== userId && req.user.role !== "admin") {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      const notifications = await storage.getNotificationsByUserId(userId);
      res.json(notifications);
    } catch (error) {
      console.error("Get notifications error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.patch("/api/notifications/:id/read", validateSession, async (req, res) => {
    try {
      const notificationId = parseInt(req.params.id);
      
      const notification = await storage.getNotification(notificationId);
      
      if (!notification) {
        return res.status(404).json({ message: "Notification not found" });
      }
      
      // Only allow users to mark their own notifications as read or admins to mark any notifications
      if (notification.recipientId !== req.user.id && req.user.role !== "admin") {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      await storage.markNotificationAsRead(notificationId);
      res.json({ success: true });
    } catch (error) {
      console.error("Mark notification as read error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Mark all notifications as read
  app.post("/api/notifications/mark-all-read", validateSession, async (req, res) => {
    try {
      const userId = req.user.id;
      
      // Get all unread notifications for user
      const notifications = await storage.getNotificationsByUserId(userId);
      const unreadNotifications = notifications.filter(n => !n.isRead);
      
      // Mark each as read
      await Promise.all(
        unreadNotifications.map(n => storage.markNotificationAsRead(n.id))
      );
      
      res.status(200).json({ message: "All notifications marked as read" });
    } catch (error) {
      console.error("Mark all notifications as read error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Admin routes
  app.get("/api/admin/users", validateSession, validateAdmin, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error("Get all users error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put("/api/admin/users/:id", validateSession, validateAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const userData = req.body;
      
      const updatedUser = await storage.updateUser(userId, userData);
      res.json(updatedUser);
    } catch (error) {
      console.error("Update user error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put("/api/admin/content/:id/approve", validateSession, validateAdmin, async (req, res) => {
    try {
      const mediaId = parseInt(req.params.id);
      
      const mediaFile = await storage.getMediaFile(mediaId);
      
      if (!mediaFile) {
        return res.status(404).json({ message: "File not found" });
      }
      
      await storage.updateMediaFile(mediaId, { status: "approved" });
      
      // Notify the user
      await storage.createNotification({
        userId: mediaFile.userId,
        type: "content",
        content: `Your content "${mediaFile.title}" has been approved.`,
        deliveryMethod: "in-app"
      });
      
      res.json({ message: "Content approved successfully" });
    } catch (error) {
      console.error("Approve content error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put("/api/admin/content/:id/reject", validateSession, validateAdmin, async (req, res) => {
    try {
      const mediaId = parseInt(req.params.id);
      const { reason } = req.body;
      
      const mediaFile = await storage.getMediaFile(mediaId);
      
      if (!mediaFile) {
        return res.status(404).json({ message: "File not found" });
      }
      
      await storage.updateMediaFile(mediaId, { status: "rejected" });
      
      // Notify the user
      await storage.createNotification({
        userId: mediaFile.userId,
        type: "content",
        content: `Your content "${mediaFile.title}" has been rejected. Reason: ${reason || "No reason provided."}`,
        deliveryMethod: "in-app"
      });
      
      res.json({ message: "Content rejected successfully" });
    } catch (error) {
      console.error("Reject content error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // RentMen specific routes
  app.get("/api/rent-men/profile", validateSession, async (req, res) => {
    try {
      const settings = await storage.getRentMenSettingsByUserId(req.user.id);
      
      if (!settings) {
        return res.status(404).json({ message: "Rent.Men settings not found" });
      }
      
      res.json(settings);
    } catch (error) {
      console.error("Get Rent.Men profile error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put("/api/rent-men/profile", validateSession, async (req, res) => {
    try {
      const rentMenData = req.body;
      
      const existingSettings = await storage.getRentMenSettingsByUserId(req.user.id);
      
      if (existingSettings) {
        const updatedSettings = await storage.updateRentMenSettings(existingSettings.id, rentMenData);
        res.json(updatedSettings);
      } else {
        const newSettings = await storage.createRentMenSettings({
          userId: req.user.id,
          ...rentMenData
        });
        res.json(newSettings);
      }
    } catch (error) {
      console.error("Update Rent.Men profile error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Admin API routes
  app.get("/api/admin/users", validateSession, validateAdmin, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });
  
  app.get("/api/admin/users/:id", validateSession, validateAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Remove sensitive data from response
      const { password, ...userWithoutPassword } = user;
      
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });
  
  // Message API endpoints
  app.get("/api/messages/:conversationId", validateSession, async (req, res) => {
    try {
      const { conversationId } = req.params;
      
      // Get messages for conversation
      const messages = await storage.getMessagesByConversationId(parseInt(conversationId));
      
      // Check if user is part of this conversation
      const isUserInConversation = await storage.isUserInConversation(req.user.id, parseInt(conversationId));
      if (!isUserInConversation) {
        return res.status(403).json({ message: "You are not authorized to view this conversation" });
      }
      
      res.json(messages);
    } catch (error) {
      console.error("Get messages error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.post("/api/messages", validateSession, async (req, res) => {
    try {
      const { content, recipientId, conversationId } = req.body;
      
      // Create message in our database
      const message = await storage.createMessage({
        senderId: req.user.id,
        recipientId: parseInt(recipientId),
        conversationId: conversationId ? parseInt(conversationId) : null,
        content,
        isRead: false
      });
      
      // If supabase is configured, insert the message there for real-time delivery
      if (supabase) {
        try {
          const { error } = await supabase
            .from('messages')
            .insert([{
              id: message.id.toString(),
              sender_id: req.user.id,
              recipient_id: recipientId,
              conversation_id: conversationId || null,
              content,
              is_read: false
            }]);
            
          if (error) {
            console.error("Supabase message insert error:", error);
          }
        } catch (supabaseError) {
          console.error("Supabase message insert exception:", supabaseError);
        }
      }
      
      // Create notification
      const sender = await storage.getUser(req.user.id);
      await storage.createNotification({
        userId: parseInt(recipientId),
        type: 'message',
        content: `New message from ${sender?.username || 'a user'}`,
        isRead: false,
        linkUrl: `/messages/${conversationId || ''}`
      });
      
      // Try to send SMS notification if recipient has a phone number
      try {
        const recipient = await storage.getUser(parseInt(recipientId));
        if (recipient && recipient.phone) {
          const smsMessage = `ManageTheFans: New message from ${sender?.username || 'a user'}. Check your portal for details.`;
          await sendSmsNotification(recipient.phone, smsMessage);
        }
      } catch (smsError) {
        console.error("SMS notification error:", smsError);
      }
      
      res.status(201).json(message);
    } catch (error) {
      console.error("Create message error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.put("/api/messages/:messageId/read", validateSession, async (req, res) => {
    try {
      const { messageId } = req.params;
      
      // Get the message
      const message = await storage.getMessage(parseInt(messageId));
      if (!message) {
        return res.status(404).json({ message: "Message not found" });
      }
      
      // Ensure user is the recipient
      if (message.recipientId !== req.user.id) {
        return res.status(403).json({ message: "Not authorized to mark this message as read" });
      }
      
      // Mark as read in our database
      await storage.markMessageAsRead(parseInt(messageId));
      
      // If supabase is configured, update the message there for real-time status
      if (supabase) {
        try {
          const { error } = await supabase
            .from('messages')
            .update({ is_read: true })
            .eq('id', messageId);
            
          if (error) {
            console.error("Supabase message update error:", error);
          }
        } catch (supabaseError) {
          console.error("Supabase message update exception:", supabaseError);
        }
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error("Mark message as read error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.patch("/api/admin/users/:id", validateSession, validateAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const updatedUser = await storage.updateUser(userId, req.body);
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ message: "Failed to update user" });
    }
  });
  
  app.get("/api/admin/verifications/pending", validateSession, validateAdmin, async (req, res) => {
    try {
      // Get all verification documents with status "pending"
      const allDocuments = await Promise.all(
        (await storage.getAllUsers())
          .filter(user => user.verificationStatus === "pending")
          .map(async user => {
            const docs = await storage.getVerificationDocumentsByUserId(user.id);
            return docs.map(doc => ({
              ...doc,
              userFullName: user.fullName,
            }));
          })
      );
      
      // Flatten the array of arrays
      const pendingDocuments = allDocuments.flat();
      
      res.json(pendingDocuments);
    } catch (error) {
      console.error("Error fetching pending verifications:", error);
      res.status(500).json({ message: "Failed to fetch pending verifications" });
    }
  });
  
  app.get("/api/admin/content/pending", validateSession, validateAdmin, async (req, res) => {
    try {
      // Get all media files with status "pending"
      const allFiles = await Promise.all(
        (await storage.getAllUsers())
          .filter(user => user.role === "client")
          .map(async user => {
            const files = await storage.getMediaFilesByUserId(user.id);
            return files
              .filter(file => file.status === "pending")
              .map(file => ({
                ...file,
                userFullName: user.fullName,
              }));
          })
      );
      
      // Flatten the array of arrays
      const pendingFiles = allFiles.flat();
      
      res.json(pendingFiles);
    } catch (error) {
      console.error("Error fetching pending content:", error);
      res.status(500).json({ message: "Failed to fetch pending content" });
    }
  });
  
  app.get("/api/profiles/user/:userId", validateSession, validateAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const profile = await storage.getProfileByUserId(userId);
      
      if (!profile) {
        return res.status(404).json({ message: "Profile not found" });
      }
      
      res.json(profile);
    } catch (error) {
      console.error("Error fetching profile:", error);
      res.status(500).json({ message: "Failed to fetch profile" });
    }
  });
  
  app.get("/api/platform-accounts/user/:userId", validateSession, validateAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const accounts = await storage.getPlatformAccountsByUserId(userId);
      res.json(accounts);
    } catch (error) {
      console.error("Error fetching platform accounts:", error);
      res.status(500).json({ message: "Failed to fetch platform accounts" });
    }
  });

  // Communication Templates routes
  app.get("/api/communication-templates", validateSession, async (req, res) => {
    try {
      const templates = await storage.getAllCommunicationTemplates();
      res.json(templates);
    } catch (error) {
      console.error("Error fetching communication templates:", error);
      res.status(500).json({ message: "Failed to fetch communication templates" });
    }
  });

  app.get("/api/communication-templates/:id", validateSession, async (req, res) => {
    try {
      const templateId = parseInt(req.params.id);
      const template = await storage.getCommunicationTemplate(templateId);
      
      if (!template) {
        return res.status(404).json({ message: "Template not found" });
      }
      
      res.json(template);
    } catch (error) {
      console.error("Error fetching communication template:", error);
      res.status(500).json({ message: "Failed to fetch communication template" });
    }
  });

  app.get("/api/communication-templates/type/:type", validateSession, async (req, res) => {
    try {
      const type = req.params.type;
      const templates = await storage.getCommunicationTemplatesByType(type);
      res.json(templates);
    } catch (error) {
      console.error("Error fetching communication templates by type:", error);
      res.status(500).json({ message: "Failed to fetch communication templates" });
    }
  });

  app.get("/api/communication-templates/category/:category", validateSession, async (req, res) => {
    try {
      const category = req.params.category;
      const templates = await storage.getCommunicationTemplatesByCategory(category);
      res.json(templates);
    } catch (error) {
      console.error("Error fetching communication templates by category:", error);
      res.status(500).json({ message: "Failed to fetch communication templates" });
    }
  });

  app.get("/api/communication-templates/default/:type/:category", validateSession, async (req, res) => {
    try {
      const { type, category } = req.params;
      const template = await storage.getDefaultCommunicationTemplate(type, category);
      
      if (!template) {
        return res.status(404).json({ message: "Default template not found" });
      }
      
      res.json(template);
    } catch (error) {
      console.error("Error fetching default communication template:", error);
      res.status(500).json({ message: "Failed to fetch default communication template" });
    }
  });

  app.post("/api/communication-templates", validateSession, validateAdmin, async (req, res) => {
    try {
      const validatedData = insertCommunicationTemplateSchema.parse(req.body);
      
      // Ensure the createdBy is set to the current user's ID
      const template = await storage.createCommunicationTemplate({
        ...validatedData,
        createdBy: req.user.id
      });
      
      res.status(201).json(template);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error("Error creating communication template:", error);
      res.status(500).json({ message: "Failed to create communication template" });
    }
  });

  app.put("/api/communication-templates/:id", validateSession, validateAdmin, async (req, res) => {
    try {
      const templateId = parseInt(req.params.id);
      const template = await storage.getCommunicationTemplate(templateId);
      
      if (!template) {
        return res.status(404).json({ message: "Template not found" });
      }
      
      const updatedTemplate = await storage.updateCommunicationTemplate(templateId, req.body);
      res.json(updatedTemplate);
    } catch (error) {
      console.error("Error updating communication template:", error);
      res.status(500).json({ message: "Failed to update communication template" });
    }
  });

  app.delete("/api/communication-templates/:id", validateSession, validateAdmin, async (req, res) => {
    try {
      const templateId = parseInt(req.params.id);
      const template = await storage.getCommunicationTemplate(templateId);
      
      if (!template) {
        return res.status(404).json({ message: "Template not found" });
      }
      
      await storage.deleteCommunicationTemplate(templateId);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting communication template:", error);
      res.status(500).json({ message: "Failed to delete communication template" });
    }
  });

  // Communication History routes
  app.get("/api/communication-history", validateSession, validateAdmin, async (req, res) => {
    try {
      const recipientId = req.query.recipientId ? parseInt(req.query.recipientId as string) : undefined;
      const senderId = req.query.senderId ? parseInt(req.query.senderId as string) : undefined;
      const type = req.query.type as string | undefined;
      
      let history: any[] = [];
      
      if (recipientId) {
        history = await storage.getCommunicationHistoryByRecipientId(recipientId);
      } else if (senderId) {
        history = await storage.getCommunicationHistoryBySenderId(senderId);
      } else if (type) {
        history = await storage.getCommunicationHistoryByType(type);
      } else {
        return res.status(400).json({ message: "Missing query parameter. Please provide recipientId, senderId, or type." });
      }
      
      res.json(history);
    } catch (error) {
      console.error("Error fetching communication history:", error);
      res.status(500).json({ message: "Failed to fetch communication history" });
    }
  });

  app.get("/api/communication-history/:id", validateSession, async (req, res) => {
    try {
      const historyId = parseInt(req.params.id);
      const history = await storage.getCommunicationHistory(historyId);
      
      if (!history) {
        return res.status(404).json({ message: "Communication history not found" });
      }
      
      // Check if user has permission to view this history record
      if (req.user.role !== "admin" && req.user.id !== history.recipientId && req.user.id !== history.senderId) {
        return res.status(403).json({ message: "You don't have permission to view this communication history" });
      }
      
      res.json(history);
    } catch (error) {
      console.error("Error fetching communication history:", error);
      res.status(500).json({ message: "Failed to fetch communication history" });
    }
  });

  app.post("/api/communication-history", validateSession, async (req, res) => {
    try {
      const validatedData = insertCommunicationHistorySchema.parse(req.body);
      
      // Ensure the senderId is set to the current user's ID
      const historyEntry = await storage.createCommunicationHistory({
        ...validatedData,
        senderId: req.user.id
      });
      
      res.status(201).json(historyEntry);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error("Error creating communication history:", error);
      res.status(500).json({ message: "Failed to create communication history" });
    }
  });
  
  // Endpoint to send communications using templates
  app.post("/api/send-communication", validateSession, validateAdmin, async (req, res) => {
    try {
      // Validate request body
      const { templateId, recipientId, customParams = {} } = req.body;
      
      if (!templateId || !recipientId) {
        return res.status(400).json({ message: "Template ID and recipient ID are required" });
      }
      
      // Get the template
      const template = await storage.getCommunicationTemplate(parseInt(templateId));
      if (!template) {
        return res.status(404).json({ message: "Template not found" });
      }
      
      // Get the recipient
      const recipient = await storage.getUser(parseInt(recipientId));
      if (!recipient) {
        return res.status(404).json({ message: "Recipient not found" });
      }
      
      // Process template content with custom parameters
      let content = template.content;
      let subject = template.subject;
      
      // Replace placeholder variables with values from customParams
      Object.entries(customParams).forEach(([key, value]) => {
        const placeholder = new RegExp(`{{${key}}}`, 'g');
        content = content.replace(placeholder, value as string);
        if (subject) {
          subject = subject.replace(placeholder, value as string);
        }
      });
      
      // Default placeholders
      content = content
        .replace(/{{recipientName}}/g, recipient.fullName)
        .replace(/{{recipientEmail}}/g, recipient.email)
        .replace(/{{date}}/g, new Date().toLocaleDateString())
        .replace(/{{time}}/g, new Date().toLocaleTimeString());
      
      if (subject) {
        subject = subject
          .replace(/{{recipientName}}/g, recipient.fullName)
          .replace(/{{recipientEmail}}/g, recipient.email)
          .replace(/{{date}}/g, new Date().toLocaleDateString())
          .replace(/{{time}}/g, new Date().toLocaleTimeString());
      }
      
      // Send the communication based on template type
      let status = "failed";
      let statusMessage = null;
      
      try {
        switch(template.type) {
          case "email":
            if (!subject) {
              subject = `ManageTheFans: ${template.name}`;
            }
            
            const emailSent = await sendEmail(recipient.email, subject, content, content);
            status = emailSent ? "sent" : "failed";
            break;
            
          case "sms":
            if (recipient.phone) {
              const smsSent = await sendSmsNotification(recipient.phone, content);
              status = smsSent ? "sent" : "failed";
            } else {
              status = "failed";
              statusMessage = "Recipient has no phone number";
            }
            break;
            
          case "notification":
            // Create in-app notification for the recipient
            await storage.createNotification({
              userId: recipient.id,
              type: template.category,
              content: content,
              deliveryMethod: "in-app"
            });
            status = "sent";
            break;
            
          default:
            status = "failed";
            statusMessage = "Invalid template type";
        }
      } catch (error) {
        console.error(`Error sending ${template.type} communication:`, error);
        status = "failed";
        statusMessage = `Error: ${error instanceof Error ? error.message : String(error)}`;
      }
      
      // Create communication history record
      const historyEntry = await storage.createCommunicationHistory({
        templateId: template.id,
        recipientId: recipient.id,
        senderId: req.user.id,
        type: template.type,
        subject: subject || null,
        content: content,
        status: status,
        statusMessage: statusMessage
      });
      
      // Return result to client
      return res.status(201).json({
        success: status === "sent",
        historyEntry,
        message: status === "sent" 
          ? `${template.type} sent successfully` 
          : `Failed to send ${template.type}${statusMessage ? ': ' + statusMessage : ''}`
      });
      
    } catch (error) {
      console.error("Error sending communication:", error);
      return res.status(500).json({ 
        message: "Failed to send communication", 
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
