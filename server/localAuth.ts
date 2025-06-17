
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import connectPg from "connect-pg-simple";
import { storage } from "./storage";
import bcrypt from "bcrypt";

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  return session({
    secret: process.env.SESSION_SECRET || "bakery-management-secret-key-2024",
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: sessionTtl,
      sameSite: 'lax'
    },
  });
}

export async function setupAuth(app: Express) {
  try {
    console.log("🔧 Setting up authentication...");
    
    app.use(getSession());
    app.use(passport.initialize());
    app.use(passport.session());

    // Configure local strategy
    passport.use(new LocalStrategy({
      usernameField: 'email',
      passwordField: 'password'
    }, async (email, password, done) => {
      try {
        console.log('🔍 Attempting login for email:', email);
        
        const user = await storage.getUserByEmail(email);
        if (!user) {
          console.log('❌ User not found:', email);
          return done(null, false, { message: 'Invalid email or password' });
        }

        if (!user.password) {
          console.log('❌ User has no password set:', email);
          return done(null, false, { message: 'Invalid email or password' });
        }

        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
          console.log('❌ Invalid password for user:', email);
          return done(null, false, { message: 'Invalid email or password' });
        }

        console.log('✅ Login successful for user:', email);
        return done(null, user);
      } catch (error) {
        console.error('❌ Login error:', error);
        return done(error);
      }
    }));

    // Serialize user for session
    passport.serializeUser((user: any, done) => {
      done(null, user.id);
    });

    // Deserialize user from session
    passport.deserializeUser(async (id: string, done) => {
      try {
        const user = await storage.getUserById(id);
        done(null, user);
      } catch (error) {
        done(error);
      }
    });

    // Login route
    app.post('/api/login', (req, res, next) => {
      console.log('🔐 Login attempt for:', req.body.email);
      
      passport.authenticate('local', (err: any, user: any, info: any) => {
        if (err) {
          console.error('❌ Authentication error:', err);
          return res.status(500).json({ message: 'Authentication error' });
        }
        
        if (!user) {
          console.log('❌ Authentication failed:', info?.message);
          return res.status(401).json({ message: info?.message || 'Invalid credentials' });
        }
        
        req.logIn(user, (err) => {
          if (err) {
            console.error('❌ Login error:', err);
            return res.status(500).json({ message: 'Login error' });
          }
          
          console.log('✅ User logged in successfully:', user.email);
          res.json({ user: { id: user.id, email: user.email, role: user.role } });
        });
      })(req, res, next);
    });

    // Logout route
    app.post('/api/logout', (req, res) => {
      req.logout((err) => {
        if (err) {
          console.error('❌ Logout error:', err);
          return res.status(500).json({ message: 'Logout error' });
        }
        res.json({ message: 'Logged out successfully' });
      });
    });

    console.log("✅ Authentication setup completed");
  } catch (error) {
    console.error("❌ Authentication setup failed:", error);
    throw error;
  }
}

export const isAuthenticated: RequestHandler = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: 'Authentication required' });
};
