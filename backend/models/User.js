const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name:      { type: String, required: true },
  email:     { type: String, required: true, unique: true },
  password:  { type: String },          // optional — not set for Google-only accounts
  googleId:  { type: String },          // set when user registers via Google
  avatar:    { type: String },          // Google profile picture URL
  tenantId:  { type: String, ref: 'Tenant' },
  role:      { type: String, enum: ['admin', 'user'], default: 'user' },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('User', userSchema);
