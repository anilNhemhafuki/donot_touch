
import { storage } from './storage';

async function initializeDatabase() {
  console.log('🚀 Initializing database...');
  
  try {
    // Ensure default users exist
    await storage.ensureDefaultAdmin();
    
    console.log('✅ Database initialization completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    process.exit(1);
  }
}

initializeDatabase();
