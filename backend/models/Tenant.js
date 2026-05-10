const mongoose = require('mongoose');

const memberSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  role:   { type: String, enum: ['admin', 'member'], default: 'member' },
}, { _id: false });

const tenantSchema = new mongoose.Schema({
  name:    { type: String, required: true },
  slug:    { type: String, required: true, unique: true, lowercase: true, trim: true },
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  members: [memberSchema],
}, { timestamps: true });

module.exports = mongoose.model('Tenant', tenantSchema);
