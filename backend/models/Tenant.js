const mongoose = require('mongoose');
const { randomUUID, randomBytes } = require('crypto');

const PLAN_QUOTAS = { free: 10000, starter: 100000, pro: 500000 };

function nextMonthFirst() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() + 1, 1);
}

const tenantSchema = new mongoose.Schema({
  tenantId:           { type: String, unique: true, default: () => randomUUID() },
  brandName:          { type: String, required: true },
  logoUrl:            { type: String },
  primaryColor:       { type: String, default: '#C9A84C' },
  plan:               { type: String, enum: ['free', 'starter', 'pro'], default: 'free' },
  monthlyTokenQuota:  { type: Number, default: PLAN_QUOTAS.free },
  usedTokens:         { type: Number, default: 0 },
  resetDate:          { type: Date, default: nextMonthFirst },
  apiKey:             { type: String, unique: true, default: () => randomBytes(32).toString('hex') },
  isActive:           { type: Boolean, default: true },
  createdAt:          { type: Date, default: Date.now },
});

tenantSchema.pre('save', function (next) {
  if (this.isModified('plan')) {
    this.monthlyTokenQuota = PLAN_QUOTAS[this.plan] || PLAN_QUOTAS.free;
  }
  next();
});

module.exports = mongoose.model('Tenant', tenantSchema);
