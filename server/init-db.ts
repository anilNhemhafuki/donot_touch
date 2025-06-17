
import { storage } from "./storage";

async function initializeDatabase() {
  try {
    console.log('🔄 Initializing database...');
    
    // Ensure default users exist
    await storage.ensureDefaultAdmin();
    
    console.log('✅ Database initialization completed successfully');
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    throw error;
  }
}

// Run initialization if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  initializeDatabase()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

export { initializeDatabase };
