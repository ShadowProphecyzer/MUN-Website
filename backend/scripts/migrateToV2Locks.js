const mongoose = require('mongoose');
require('dotenv').config({ path: './config.env' });
const { getConferenceDb } = require('../services/getConferenceDb');
const ParticipantSchema = require('../models/Participant');

async function migrateToV2Locks() {
  try {
    // Connect to main database
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    // Get all conference codes from the conferences directory
    const fs = require('fs');
    const path = require('path');
    const conferencesDir = path.join(__dirname, '../../conferences');
    
    if (!fs.existsSync(conferencesDir)) {
      console.log('❌ Conferences directory not found');
      return;
    }

    const conferenceCodes = fs.readdirSync(conferencesDir).filter(dir => 
      fs.statSync(path.join(conferencesDir, dir)).isDirectory()
    );

    console.log(`📁 Found ${conferenceCodes.length} conferences:`, conferenceCodes);

    for (const code of conferenceCodes) {
      console.log(`\n🔄 Processing conference: ${code}`);
      
      try {
        const db = getConferenceDb(code);
        const Participant = db.models.Participant || db.model('Participant', ParticipantSchema);
        
        // Get all participants
        const participants = await Participant.find({});
        console.log(`   Found ${participants.length} participants`);
        
        let updatedCount = 0;
        
        for (const participant of participants) {
          let lock1 = false, lock2 = false;
          
          // Set lock1 and lock2 based on role
          if (['god', 'owner'].includes(participant.role.toLowerCase())) {
            lock1 = true;
            lock2 = true;
          } else if (['administrator'].includes(participant.role.toLowerCase())) {
            lock2 = true;
          }
          
          // Update participant with V2 locks
          await Participant.updateOne(
            { _id: participant._id },
            { 
              $set: { 
                lock1: lock1,
                lock2: lock2
              }
            }
          );
          
          updatedCount++;
          console.log(`   ✅ Updated ${participant.email} (${participant.role}) - lock1: ${lock1}, lock2: ${lock2}`);
        }
        
        console.log(`   📊 Updated ${updatedCount} participants in conference ${code}`);
        
      } catch (error) {
        console.error(`   ❌ Error processing conference ${code}:`, error.message);
      }
    }

    console.log('\n✅ Migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run migration if called directly
if (require.main === module) {
  migrateToV2Locks();
}

module.exports = migrateToV2Locks; 