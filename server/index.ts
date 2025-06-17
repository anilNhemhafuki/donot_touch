
import express from "express";
import session from "express-session";
import { createServer } from "http";
import { setupVite, serveStatic } from "./vite";
import { setupAuth } from "./localAuth";
import { db } from "./db";
import { initializeDatabase } from "./init-db";
import routes from "./routes";

const app = express();
const server = createServer(app);

// Trust proxy for production
app.set('trust proxy', 1);

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'default-secret-key-change-this',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
  }
}));

// Parse JSON bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Setup authentication
setupAuth(app);

// API routes
app.use("/api", routes);

async function startServer() {
  try {
    console.log("🚀 Starting server...");
    
    // Initialize database
    await initializeDatabase();
    
    const port = parseInt(process.env.PORT || "5000");
    
    if (process.env.NODE_ENV === "development") {
      await setupVite(app, server);
    } else {
      serveStatic(app);
    }
    
    server.listen(port, "0.0.0.0", () => {
      console.log(`✅ Server running on http://0.0.0.0:${port}`);
    });
    
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
}

startServer();
