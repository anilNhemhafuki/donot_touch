import express from "express";
import session from "express-session";
import { createServer } from "http";
import { setupVite, serveStatic } from "./vite";
import { setupAuth } from "./localAuth";
import { initializeDatabase } from "./init-db";
import { registerRoutes } from "./routes";

const app = express();

// Trust proxy for production
app.set('trust proxy', 1);

// Parse JSON bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

async function startServer() {
  try {
    console.log("🚀 Starting server...");

    // Initialize database first
    await initializeDatabase();

    // Setup authentication
    await setupAuth(app);

    // Register routes
    const server = await registerRoutes(app);

    const port = parseInt(process.env.PORT || "5000");

    if (process.env.NODE_ENV === "development") {
      await setupVite(app, server);
    } else {
      serveStatic(app);
    }

    server.listen(port, "0.0.0.0", () => {
      console.log(`✅ Server running on http://0.0.0.0:${port}`);
      console.log(`📝 Default login credentials:`);
      console.log(`   Admin: admin@sweetreats.com / admin123`);
      console.log(`   Manager: manager@sweetreats.com / manager123`);
      console.log(`   Staff: staff@sweetreats.com / staff123`);
    });

  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
}

startServer();