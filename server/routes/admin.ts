import { Router, Request, Response } from 'express';
import { storage } from '../storage';
import { sendWelcomeEmail, sendVerificationEmail } from '../utils/email';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { insertUserSchema } from '@shared/schema';

// Initialize router
const router = Router();

// Middleware to ensure user is admin
function ensureAdmin(req: Request, res: Response, next: Function) {
  if (!req.isAuthenticated() || req.user?.role !== 'admin') {
    return res.status(403).json({ message: 'Unauthorized access' });
  }
  next();
}

// Apply admin check to all routes in this router
router.use(ensureAdmin);

// Get all users
router.get('/users', async (req: Request, res: Response) => {
  try {
    const users = await storage.getAllUsers();
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Error fetching users' });
  }
});

// Get user by ID
router.get('/users/:id', async (req: Request, res: Response) => {
  try {
    const user = await storage.getUser(parseInt(req.params.id));
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Get associated profile if exists
    const profile = await storage.getProfileByUserId(user.id);
    
    // Get platform accounts
    const platforms = await storage.getPlatformAccountsByUserId(user.id);
    
    res.json({
      user,
      profile,
      platforms
    });
  } catch (error) {
    console.error('Error fetching user details:', error);
    res.status(500).json({ message: 'Error fetching user details' });
  }
});

// Create new client
router.post('/clients', async (req: Request, res: Response) => {
  try {
    const { user: userData, platformType, preferredContactMethod, notes } = req.body;
    
    // Validate user data
    const userValidation = insertUserSchema.safeParse(userData);
    if (!userValidation.success) {
      return res.status(400).json({ 
        message: 'Invalid user data', 
        errors: userValidation.error.format() 
      });
    }
    
    // Check if username or email already exists
    const existingUserByUsername = await storage.getUserByUsername(userData.username);
    if (existingUserByUsername) {
      return res.status(400).json({ message: 'Username already exists' });
    }
    
    const existingUserByEmail = await storage.getUserByEmail(userData.email);
    if (existingUserByEmail) {
      return res.status(400).json({ message: 'Email already exists' });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    
    // Create user
    const createdUser = await storage.createUser({
      ...userData,
      password: hashedPassword,
      role: 'client',
    });
    
    // Create profile if contact method is provided
    if (preferredContactMethod) {
      await storage.createProfile({
        userId: createdUser.id,
        preferredContactMethod,
      });
    }
    
    // Create platform account if provided
    if (platformType && platformType !== 'Both') {
      await storage.createPlatformAccount({
        userId: createdUser.id,
        platformType,
        username: userData.username,
        password: '', // We don't store actual platform passwords in plaintext
        needsCreation: true,
      });
    } else if (platformType === 'Both') {
      // Create both platform accounts
      await storage.createPlatformAccount({
        userId: createdUser.id,
        platformType: 'OnlyFans',
        username: userData.username,
        password: '',
        needsCreation: true,
      });
      
      await storage.createPlatformAccount({
        userId: createdUser.id,
        platformType: 'RentMen',
        username: userData.username,
        password: '',
        needsCreation: true,
      });
    }
    
    // Send welcome email
    sendWelcomeEmail(createdUser.email, createdUser.fullName)
      .then(success => {
        if (!success) {
          console.warn(`Welcome email could not be sent to ${createdUser.email}`);
        }
      })
      .catch(error => {
        console.error('Error sending welcome email:', error);
      });
    
    // Return the created user without the password
    const { password, ...userWithoutPassword } = createdUser;
    res.status(201).json(userWithoutPassword);
  } catch (error) {
    console.error('Error creating client:', error);
    res.status(500).json({ message: 'Error creating client' });
  }
});

// Update user verification status
router.patch('/users/:id/verification', async (req: Request, res: Response) => {
  try {
    const { status } = req.body;
    
    // Validate the status
    if (!z.enum(['pending', 'verified', 'rejected']).safeParse(status).success) {
      return res.status(400).json({ message: 'Invalid verification status' });
    }
    
    const userId = parseInt(req.params.id);
    const user = await storage.getUser(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Update user verification status
    const updatedUser = await storage.updateUser(userId, {
      verificationStatus: status
    });
    
    // If the user was verified, send a verification email
    if (status === 'verified') {
      sendVerificationEmail(user.email, user.fullName)
        .then(success => {
          if (!success) {
            console.warn(`Verification email could not be sent to ${user.email}`);
          }
        })
        .catch(error => {
          console.error('Error sending verification email:', error);
        });
    }
    
    res.json({ message: 'Verification status updated', status });
  } catch (error) {
    console.error('Error updating verification status:', error);
    res.status(500).json({ message: 'Error updating verification status' });
  }
});

// Get all subscriptions
router.get('/subscriptions', async (req: Request, res: Response) => {
  try {
    // This endpoint would get all subscriptions from the database
    // For now, we'll return an empty array as a placeholder
    res.json([]);
  } catch (error) {
    console.error('Error fetching subscriptions:', error);
    res.status(500).json({ message: 'Error fetching subscriptions' });
  }
});

// Get all invoices
router.get('/invoices', async (req: Request, res: Response) => {
  try {
    // This endpoint would get all invoices from the database
    // For now, we'll return an empty array as a placeholder
    res.json([]);
  } catch (error) {
    console.error('Error fetching invoices:', error);
    res.status(500).json({ message: 'Error fetching invoices' });
  }
});

// Get all media files
router.get('/media-files', async (req: Request, res: Response) => {
  try {
    // This endpoint would get all media files from the database
    // For now, we'll return an empty array as a placeholder
    res.json([]);
  } catch (error) {
    console.error('Error fetching media files:', error);
    res.status(500).json({ message: 'Error fetching media files' });
  }
});

export default router;