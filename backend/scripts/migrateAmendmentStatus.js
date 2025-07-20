const mongoose = require('mongoose');
require('dotenv').config({ path: './config.env' });
const { getConferenceDb } = require('../services/getConferenceDb');
const AmendmentSchema = require('../models/Amendment').schema;

// Helper: Get Amendment model for a conference
function getAmendmentModel(code) {
  const db = getConferenceDb(code);
  return db.models.Amendment || db.model('Amendment', AmendmentSchema);
}

async function migrateAmendmentStatus() {
  try {
    console.log('Starting amendment status migration...');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ MongoDB connected successfully');
    
    // Get all conference codes from the main database
    const mainDb = mongoose.connection;
    const conferences = await mainDb.collection('conferences').find({}).toArray();
    
    console.log(`Found ${conferences.length} conferences to migrate`);
    
    for (const conference of conferences) {
      const conferenceCode = conference.code;
      console.log(`\nMigrating conference: ${conferenceCode}`);
      
      try {
        const Amendment = getAmendmentModel(conferenceCode);
        
        // Find all amendments that still have the old 'accepted' field
        const amendments = await Amendment.find({ accepted: { $exists: true } });
        
        console.log(`Found ${amendments.length} amendments to migrate in ${conferenceCode}`);
        
        for (const amendment of amendments) {
          // Convert accepted field to status
          const newStatus = amendment.accepted ? 'passed' : 'on_hold';
          
          // Update the amendment
          await Amendment.findByIdAndUpdate(amendment._id, {
            $set: { status: newStatus },
            $unset: { accepted: 1 }
          });
          
          console.log(`  - Amendment #${amendment.amendmentId}: ${amendment.accepted ? 'accepted' : 'not accepted'} → ${newStatus}`);
        }
        
        console.log(`✅ Completed migration for ${conferenceCode}`);
        
      } catch (error) {
        console.error(`❌ Error migrating conference ${conferenceCode}:`, error.message);
      }
    }
    
    console.log('\n🎉 Migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('📊 Database connection closed');
  }
}

// Run migration if this script is executed directly
if (require.main === module) {
  migrateAmendmentStatus();
}

module.exports = { migrateAmendmentStatus }; 