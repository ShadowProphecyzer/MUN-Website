const mongoose = require('mongoose');
const { getConferenceDb } = require('./services/getConferenceDb');
const ParticipantSchema = require('./models/Participant');
const User = require('./models/User');
require('dotenv').config({ path: './config.env' });

async function addAdminToConference() {
  try {
    // Connect to main database first
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to main database');
    
    const conferenceCode = '811375503366';
    const adminEmail = 'test3@gmail.com'; // Correct email for test3
    
    console.log(`[DEBUG] Adding ${adminEmail} as administrator to conference ${conferenceCode}`);
    
    // Check if user exists
    const user = await User.findOne({ email: adminEmail });
    if (!user) {
      console.log('[ERROR] User not found:', adminEmail);
      console.log('[DEBUG] Available users:');
      const allUsers = await User.find({}, 'email username');
      allUsers.forEach(u => console.log(`  - ${u.email} (${u.username})`));
      return;
    }
    
    console.log('[DEBUG] Found user:', user.username);
    
    // Get conference database
    const db = getConferenceDb(conferenceCode);
    const Participant = db.models.Participant || db.model('Participant', ParticipantSchema);
    
    // Check if already a participant
    const existing = await Participant.findOne({ email: adminEmail });
    if (existing) {
      console.log('[DEBUG] Already a participant with role:', existing.role);
      return;
    }
    
    // Add as administrator
    await Participant.create({
      email: adminEmail,
      name: user.username,
      role: 'Administrator',
      isLocked: false
    });
    
    console.log('[DEBUG] Successfully added as administrator');
    
    // List all participants
    const allParticipants = await Participant.find();
    console.log('[DEBUG] All participants:', allParticipants.map(p => ({ email: p.email, role: p.role, name: p.name })));
    
  } catch (error) {
    console.error('[ERROR] Failed to add admin:', error);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from database');
  }
}

addAdminToConference(); 