# Session Storage in ManageTheFans Portal

## Overview

This document explains how session storage works in the ManageTheFans Portal application.

## Session Storage Implementation

### Database Connection
A PostgreSQL database connection is established in `server/db.ts` using the node-postgres Pool, which efficiently manages database connections.

### Session Storage Strategy
The application uses a dynamic session storage strategy:

1. **Development Environment**: Uses in-memory session storage
   - Simple and requires no database configuration
   - Sessions are lost when the server restarts
   - Automatically used when `NODE_ENV` is not "production"

2. **Production Environment**: Uses PostgreSQL session storage
   - Persistent sessions across server restarts
   - Requires `DATABASE_URL` environment variable to be set
   - Uses the `connect-pg-simple` package with the PostgreSQL connection pool
   - Creates a session table automatically if one doesn't exist

### Implementation Details

The session configuration is set up in `server/auth.ts`:

```javascript
// Session options configuration
const sessionOptions = {
  secret: process.env.SESSION_SECRET || "mtf-secret-key",
  resave: true,
  saveUninitialized: true,
  cookie: {
    secure: process.env.NODE_ENV === "production",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    httpOnly: true,
    sameSite: 'lax'
  },
  store: process.env.NODE_ENV === "production" && process.env.DATABASE_URL
    ? new PgStore({
        pool: db, // Database connection pool
        createTableIfMissing: true,
        tableName: 'session' // Default table name
      })
    : new MemoryStore({
        checkPeriod: 86400000 // Prune expired entries every 24h
      })
};
```

## Benefits

1. **Development Simplicity**: No database setup needed for local development
2. **Production Reliability**: Persistent sessions in production for better user experience
3. **Automatic Fallback**: Will use in-memory storage if database connection is unavailable
4. **Security**: Sessions configured with secure cookies in production

## Maintenance Notes

- The session table (`session`) is created automatically in the database
- Session data is automatically pruned based on the cookie expiration time
- No manual session cleanup is needed