
import { db } from "./db.js";
import { storage } from "./storage.js";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is required. Please create a PostgreSQL database in Replit.");
}

export async function initializeDatabase() {
  try {
    console.log("🔄 Initializing database...");
    
    // Ensure default users exist
    console.log("🔄 Setting up default users...");
    await storage.ensureDefaultAdmin();
    console.log("✅ Default users created");
    
    console.log("✅ Database initialization completed");
    
  } catch (error) {
    console.error("❌ Database initialization failed:", error);
    throw error;
  }
}

// Run initialization if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  initializeDatabase().catch(console.error);
}
