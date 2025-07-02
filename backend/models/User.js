const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: [3, 'Username must be at least 3 characters long'],
    maxlength: [30, 'Username cannot exceed 30 characters'],
    match: [/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores']
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    match: [
      /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
      'Please enter a valid email address'
    ]
  },
  password: {
    type: String,
    required: true,
    minlength: [6, 'Password must be at least 6 characters long']
  },

  role: {
    type: String,
    enum: ['user', 'admin', 'moderator'],
    default: 'user'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date,
    default: null
  },
  loginAttempts: {
    type: Number,
    default: 0
  },
  lockUntil: {
    type: Date,
    default: null
  }
}, {
  timestamps: true,
  collection: 'users' // Store in 'users' collection
});

// Index for efficient queries
userSchema.index({ username: 1 });
userSchema.index({ email: 1 });
userSchema.index({ username: 1, email: 1 });

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) return next();
  
  try {
    // Hash password with salt rounds of 12
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    console.error('Error in user pre-save hook:', error);
    next(error);
  }
});

// Instance method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  console.log('[DEBUG] Comparing password for user:', this.username);
  const result = await bcrypt.compare(candidatePassword, this.password);
  console.log('[DEBUG] Password comparison result:', result);
  return result;
};

// Instance method to check if account is locked
userSchema.methods.isLocked = function() {
  const locked = !!(this.lockUntil && this.lockUntil > Date.now());
  console.log('[DEBUG] Account lock check for user:', this.username, 'locked:', locked);
  return locked;
};

// Instance method to increment login attempts
userSchema.methods.incLoginAttempts = function() {
  console.log('[DEBUG] Incrementing login attempts for user:', this.username, 'current attempts:', this.loginAttempts);
  // If we have a previous lock that has expired, restart at 1
  if (this.lockUntil && this.lockUntil < Date.now()) {
    console.log('[DEBUG] Previous lock expired, restarting attempts at 1');
    return this.updateOne({
      $unset: { lockUntil: 1 },
      $set: { loginAttempts: 1 }
    });
  }
  
  const updates = { $inc: { loginAttempts: 1 } };
  
  // Lock account after 5 failed attempts for 2 hours
  if (this.loginAttempts + 1 >= 5 && !this.isLocked()) {
    console.log('[DEBUG] Locking account due to too many failed attempts');
    updates.$set = { lockUntil: Date.now() + 2 * 60 * 60 * 1000 };
  }
  
  return this.updateOne(updates);
};

// Static method to reset login attempts
userSchema.statics.resetLoginAttempts = function(username) {
  console.log('[DEBUG] Resetting login attempts for user:', username);
  return this.updateOne(
    { username },
    { 
      $unset: { lockUntil: 1, loginAttempts: 1 },
      $set: { lastLogin: new Date() }
    }
  );
};

// Static method to find user by email or username
userSchema.statics.findByEmailOrUsername = function(identifier) {
  console.log('[DEBUG] Finding user by identifier:', identifier);
  return this.findOne({
    $or: [
      { email: identifier.toLowerCase() },
      { username: identifier }
    ]
  });
};

// Virtual for display name
userSchema.virtual('displayName').get(function() {
  return this.username;
});

// Ensure virtual fields are serialized
userSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    delete ret.password;
    delete ret.loginAttempts;
    delete ret.lockUntil;
    return ret;
  }
});

module.exports = mongoose.model('User', userSchema); 