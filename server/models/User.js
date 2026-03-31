const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto'); // Built-in Node module for generating strings

const userSchema = new mongoose.Schema({
  // --- Personal Information ---
  firstName: { type: String, required: true, trim: true },
  lastName: { type: String, required: true, trim: true },
  designation: { type: String, required: true }, // e.g., "Senior Credit Officer"
  profileImage: { type: String, default: 'default-avatar.png' }, // URL or File path
  
  // --- Contact & Location ---
  email: { type: String, required: true, unique: true, lowercase: true },
  phoneNumber: { type: String, required: true },
  address: {
    street: String,
    city: String,
    district: { type: String, required: true } // Important for IDB reporting
  },

  // --- System & Auth ---
  password: { type: String, required: true }, // This will store the HASHED version
  role: { type: mongoose.Schema.Types.ObjectId, ref: 'Role', required: true },
  isActive: { type: Boolean, default: true },
  
  // --- Security Workflow ---
  passwordChangedAt: Date,
  isTemporaryPassword: { type: Boolean, default: true } // Force user to change password on first login
}, { timestamps: true });

// ENCRYPTION MIDDLEWARE: Runs before saving
// ENCRYPTION MIDDLEWARE: Updated for modern Mongoose async/await
userSchema.pre('save', async function() {
  // 1. Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) return;

  // 2. Hash the password - No 'next()' needed because it's an async function
  this.password = await bcrypt.hash(this.password, 12);
});

// STATIC METHOD: To generate a random secure password for new recruits
userSchema.statics.generateTempPassword = function() {
  // Generates an 8-character random string (e.g., "aB3x9kP2")
  return crypto.randomBytes(4).toString('hex');
};

module.exports = mongoose.model('User', userSchema);