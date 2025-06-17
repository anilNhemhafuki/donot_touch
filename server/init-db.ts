
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { migrate } from "drizzle-orm/neon-http/migrator";
import { storage } from "./storage";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is required");
}

const sql = neon(process.env.DATABASE_URL);
const db = drizzle(sql);

export async function initializeDatabase() {
  try {
    console.log("🔄 Initializing database...");
    
    // Run migrations
    console.log("🔄 Running database migrations...");
    await migrate(db, { migrationsFolder: "./migrations" });
    console.log("✅ Database migrations completed");
    
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
