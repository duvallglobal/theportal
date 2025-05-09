import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express, Request, Response, NextFunction } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User } from "@shared/schema";
import createMemoryStore from "memorystore";
import bcrypt from "bcryptjs";

declare global {
  namespace Express {
    // Define the User interface for Express session - matches database User type
    interface User {
      id: number;
      email: string;
      username: string;
      fullName: string;
      phone: string | null;
      role: string;
      password: string;
      onboardingStatus: string | null;
      onboardingStep: number | null;
      plan: string | null;
      verificationStatus: string | null;
      stripeCustomerId: string | null;
      stripeSubscriptionId: string | null;
      createdAt: Date;
      updatedAt: Date;
    }
  }
}

// Create memory session store to match our in-memory user storage
const MemoryStore = createMemoryStore(session);

// Hash password utilities
const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  // Handle bcrypt-style passwords (used in test data)
  if (stored.startsWith('$2a$') || stored.startsWith('$2b$')) {
    return bcrypt.compareSync(supplied, stored);
  }
  
  // Handle scrypt passwords (our regular format)
  try {
    const [hashed, salt] = stored.split(".");
    const hashedBuf = Buffer.from(hashed, "hex");
    const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
    return timingSafeEqual(hashedBuf, suppliedBuf);
  } catch (error) {
    console.error("Password comparison error:", error);
    return false;
  }
}

export function setupAuth(app: Express) {
  // Configure session
  const sessionOptions: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "mtf-secret-key",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      httpOnly: true,
      sameSite: 'lax'
    },
    store: new MemoryStore({
      checkPeriod: 86400000 // Prune expired entries every 24h
    })
  };

  app.use(session(sessionOptions));
  app.use(passport.initialize());
  app.use(passport.session());

  // Configure Passport.js
  passport.use(
    new LocalStrategy(
      {
        usernameField: "email",
        passwordField: "password",
      },
      async (emailOrUsername: string, password: string, done: Function) => {
        try {
          // Try to find user by email or username
          let user = await storage.getUserByEmail(emailOrUsername);
          
          // If not found by email, try username
          if (!user) {
            user = await storage.getUserByUsername(emailOrUsername);
          }
          
          if (!user) {
            return done(null, false, { message: "Incorrect email/username or password" });
          }

          const isValidPassword = await comparePasswords(password, user.password);
          if (!isValidPassword) {
            return done(null, false, { message: "Incorrect email/username or password" });
          }

          return done(null, user);
        } catch (error) {
          console.error("Error during authentication:", error);
          return done(error, false);
        }
      }
    )
  );

  // Serialize/deserialize user
  passport.serializeUser((user: Express.User, done: Function) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: number, done: Function) => {
    try {
      const user = await storage.getUser(id);
      if (!user) {
        console.warn(`User with ID ${id} not found during deserialization`);
        return done(null, null);
      }
      return done(null, user);
    } catch (error) {
      console.error("Error deserializing user:", error);
      return done(error, null);
    }
  });

  // Auth routes
  app.post(
    "/api/auth/login",
    (req: Request, res: Response, next: NextFunction) => {
      passport.authenticate("local", (err: any, user: Express.User | false | null, info: any) => {
        if (err) {
          console.error("Login error:", err);
          return res.status(500).json({ message: "Internal server error" });
        }
        
        if (!user) {
          return res.status(400).json({ message: info?.message || "Invalid credentials" });
        }
        
        req.login(user, (err) => {
          if (err) {
            console.error("Login session error:", err);
            return res.status(500).json({ message: "Failed to create session" });
          }
          
          // Return a sanitized user object (without password)
          const { password, ...userWithoutPassword } = user;
          return res.json(userWithoutPassword);
        });
      })(req, res, next);
    }
  );

  app.post("/api/auth/register", async (req: Request, res: Response) => {
    try {
      const { username, email, password, fullName } = req.body;

      // Check if user already exists
      const existingUserByEmail = await storage.getUserByEmail(email);
      if (existingUserByEmail) {
        return res.status(400).json({ message: "Email is already in use" });
      }

      const existingUserByUsername = await storage.getUserByUsername(username);
      if (existingUserByUsername) {
        return res.status(400).json({ message: "Username is already taken" });
      }

      // Create new user with hashed password
      const hashedPassword = await hashPassword(password);
      const user = await storage.createUser({
        username,
        email,
        password: hashedPassword,
        fullName,
        role: "client", // Default role
        phone: null,
        onboardingStatus: "in_progress",
        onboardingStep: 1,
        plan: null,
        verificationStatus: "pending",
        stripeCustomerId: null,
        stripeSubscriptionId: null
      });

      // Log in the user
      req.login(user, (err: any) => {
        if (err) {
          console.error("Error during login after registration:", err);
          return res.status(500).json({ message: "Error during login after registration" });
        }
        // Return a sanitized user object (without password)
        const { password, ...userWithoutPassword } = user;
        return res.status(201).json(userWithoutPassword);
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ message: "Registration failed" });
    }
  });

  app.post("/api/auth/logout", (req: Request, res: Response) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ message: "Logout failed" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });

  app.get("/api/auth/me", (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    res.json(req.user);
  });

  // Export middleware functions for route-specific auth
  return {
    isAuthenticated: (req: Request, res: Response, next: NextFunction) => {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      next();
    },
    
    isAdmin: (req: Request, res: Response, next: NextFunction) => {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      if (req.user?.role !== "admin") {
        return res.status(403).json({ message: "Forbidden: Admin access required" });
      }
      
      next();
    }
  };
}