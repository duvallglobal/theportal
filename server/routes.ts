import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { insertUserSchema, insertProfileSchema, insertPlatformAccountSchema, insertContentStrategySchema, insertMediaFileSchema, insertVerificationDocumentSchema, insertAppointmentSchema, insertMessageSchema, insertRentMenSettingsSchema, insertAnalyticsSchema } from "@shared/schema";
import { z } from "zod";
import Stripe from "stripe";
import bcrypt from "bcryptjs";
import multer from "multer";
import path from "path";
import fs from "fs";
import { Resend } from "resend";
import { handleUpdateOnboardingStep } from "./routes/onboarding";
import { WebSocketServer, WebSocket } from 'ws';
import twilio from 'twilio';
import { supabase } from './supabase';
import passport from 'passport';

// Initialize Stripe if API key exists
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
let stripe: Stripe | undefined;
if (stripeSecretKey) {
  stripe = new Stripe(stripeSecretKey, {
    apiVersion: "2023-10-16",
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
  // Auth routes
  app.post("/api/auth/register", async (req, res, next) => {
    try {
      const validatedData = insertUserSchema.parse(req.body);
      
      // Check if user already exists
      const existingUserByEmail = await storage.getUserByEmail(validatedData.email);
      if (existingUserByEmail) {
        return res.status(400).json({ message: "Email is already in use" });
      }
      
      const existingUserByUsername = await storage.getUserByUsername(validatedData.username);
      if (existingUserByUsername) {
        return res.status(400).json({ message: "Username is already taken" });
      }
      
      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(validatedData.password, salt);
      
      // Create user with default onboarding settings
      const user = await storage.createUser({
        ...validatedData,
        password: hashedPassword,
        onboardingStep: 1, // Always start at step 1
        onboardingStatus: "in_progress",
        verificationStatus: "pending",
        stripeCustomerId: null,
        stripeSubscriptionId: null
      });
      
      // Log the user in
      req.login(user, (err: any) => {
        if (err) {
          console.error("Login after registration error:", err);
          return res.status(500).json({ message: "Failed to create session" });
        }
        
        // Return only necessary user data (not password)
        res.status(201).json({
          id: user.id,
          username: user.username,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
          onboardingStatus: user.onboardingStatus,
          onboardingStep: user.onboardingStep
        });
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error("Register error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/auth/login", (req, res, next) => {
    passport.authenticate("local", (err: any, user: Express.User | false | null, info: any) => {
      if (err) {
        console.error("Login error:", err);
        return res.status(500).json({ message: "Internal server error" });
      }
      
      if (!user) {
        return res.status(400).json({ message: info?.message || "Invalid credentials" });
      }
      
      req.login(user, (err: any) => {
        if (err) {
          console.error("Login session error:", err);
          return res.status(500).json({ message: "Failed to create session" });
        }
        
        res.json({
          id: user.id,
          username: user.username,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
          onboardingStatus: user.onboardingStatus,
          onboardingStep: user.onboardingStep || 1, // Default to step 1 for new users
          plan: user.plan
        });
      });
    })(req, res, next);
  });

  app.post("/api/auth/logout", (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ message: "Error logging out" });
      }
      res.json({ success: true, message: "Logged out successfully" });
    });
  });

  app.get("/api/auth/me", validateSession, (req, res) => {
    const user = req.user;
    res.json({
      id: user.id,
      username: user.username,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      onboardingStatus: user.onboardingStatus,
      onboardingStep: user.onboardingStep,
      plan: user.plan
    });
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
          await storage.updateUser(req.user.id, { fullName, email });
          
          let profile = await storage.getProfileByUserId(req.user.id);
          if (profile) {
            await storage.updateProfile(profile.id, {
              birthDate: dateOfBirth,
              phone
            });
          } else {
            await storage.createProfile({
              userId: req.user.id,
              birthDate: dateOfBirth,
              phone
            });
          }
          break;
          
        case 2: // Account Access
          const { onlyFansUsername, onlyFansPassword, needsOnlyFansCreation } = req.body;
          const platformType = "OnlyFans";
          
          const existingAccount = await storage.getPlatformAccountByUserIdAndType(req.user.id, platformType);
          if (existingAccount) {
            await storage.updatePlatformAccount(existingAccount.id, {
              username: onlyFansUsername,
              password: onlyFansPassword,
              needsCreation: needsOnlyFansCreation
            });
          } else {
            await storage.createPlatformAccount({
              userId: req.user.id,
              platformType,
              username: onlyFansUsername,
              password: onlyFansPassword,
              needsCreation: needsOnlyFansCreation
            });
          }
          break;
          
        case 3: // Brand Strategy
          const { growthGoals, contentTypes, brandDescription, voiceTone, doNotSayTerms } = req.body;
          
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
          
          const existingStrategy = await storage.getContentStrategyByUserId(req.user.id);
          if (existingStrategy) {
            await storage.updateContentStrategy(existingStrategy.id, {
              growthGoals,
              contentTypes
            });
          } else {
            await storage.createContentStrategy({
              userId: req.user.id,
              growthGoals,
              contentTypes
            });
          }
          break;
          
        case 4: // Communication
          const { notificationPreferences, bestContactMethod, preferredCheckInTime, timezone } = req.body;
          
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
          break;
          
        case 5: // Content Strategy
          const { uploadFrequency, existingContent } = req.body;
          
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

  app.get("/api/onboarding/progress", validateSession, async (req, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      res.json({
        currentStep: user.onboardingStep,
        status: user.onboardingStatus
      });
    } catch (error) {
      console.error("Get onboarding progress error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

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
      const { clientId, appointmentDate, duration, location, details, amount, photoUrl, notificationMethod } = req.body;
      
      // Check if client exists
      const client = await storage.getUser(clientId);
      if (!client) {
        return res.status(404).json({ message: "Client not found" });
      }
      
      // Create appointment proposal
      const appointment = await storage.createAppointment({
        adminId: req.user.id,
        clientId,
        appointmentDate: new Date(appointmentDate),
        duration,
        location,
        details,
        amount,
        photoUrl,
        notificationMethod
      });
      
      // Send notifications based on selected methods
      if (notificationMethod === 'email' || notificationMethod === 'all') {
        // In a real implementation, you would integrate with an email service like AWS SES
        console.log(`Email notification sent to ${client.email} about appointment ${appointment.id}`);
        
        // Create a notification record
        await storage.createNotification({
          userId: clientId,
          type: 'appointment',
          content: `You have a new appointment proposal. Review it in your dashboard.`,
          deliveryMethod: 'email'
        });
      }
      
      if (notificationMethod === 'sms' || notificationMethod === 'all') {
        // In a real implementation, you would integrate with an SMS service like Twilio
        if (client.phone) {
          console.log(`SMS notification sent to ${client.phone} about appointment ${appointment.id}`);
          
          // Create a notification record
          await storage.createNotification({
            userId: clientId,
            type: 'appointment',
            content: `You have a new appointment proposal. Review it in your dashboard.`,
            deliveryMethod: 'sms'
          });
        }
      }
      
      // Always create in-app notification
      await storage.createNotification({
        userId: clientId,
        type: 'appointment',
        content: `You have a new appointment proposal. Review it in your dashboard.`,
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
      if (notification.userId !== req.user.id && req.user.role !== "admin") {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      await storage.markNotificationAsRead(notificationId);
      res.json({ success: true });
    } catch (error) {
      console.error("Mark notification as read error:", error);
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
      
      res.json(user);
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

  const httpServer = createServer(app);
  return httpServer;
}
