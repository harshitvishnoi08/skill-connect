// File: server/jobs/accountCleanup.js
// This is OPTIONAL - automatically deletes accounts after 5 days

const User = require('../models/User');

/**
 * Permanently delete accounts that have been soft-deleted for more than 5 days
 */
async function cleanupExpiredAccounts() {
  try {
    console.log('🧹 Running account cleanup job...');
    
    const fiveDaysAgo = new Date();
    fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);
    
    // Find expired deleted accounts
    const expiredAccounts = await User.find({
      isDeleted: true,
      deletedAt: { $lte: fiveDaysAgo }
    });
    
    console.log(`Found ${expiredAccounts.length} expired accounts to delete permanently`);
    
    // Permanently delete them
    if (expiredAccounts.length > 0) {
      const result = await User.deleteMany({
        isDeleted: true,
        deletedAt: { $lte: fiveDaysAgo }
      });
      
      console.log(`✅ Permanently deleted ${result.deletedCount} expired accounts`);
    }
    
    return expiredAccounts.length;
    
  } catch (error) {
    console.error('❌ Error in account cleanup job:', error);
    throw error;
  }
}

/**
 * Setup the cleanup job to run daily
 * Add this to your server.js file
 */
function setupAccountCleanupJob() {
  // Run cleanup every 24 hours
  const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;
  
  // Run immediately on startup
  cleanupExpiredAccounts().catch(console.error);
  
  // Then run every 24 hours
  setInterval(() => {
    cleanupExpiredAccounts().catch(console.error);
  }, TWENTY_FOUR_HOURS);
  
  console.log('⏰ Account cleanup job scheduled (runs every 24 hours)');
}

module.exports = {
  cleanupExpiredAccounts,
  setupAccountCleanupJob
};

// ============================================
// HOW TO USE IN YOUR server.js:
// ============================================
/*

const { setupAccountCleanupJob } = require('./jobs/accountCleanup');

// After MongoDB connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('✅ MongoDB Connected');
    
    // Setup automatic account cleanup
    setupAccountCleanupJob();
  })
  .catch(err => console.error('❌ MongoDB Connection Error:', err));

*/