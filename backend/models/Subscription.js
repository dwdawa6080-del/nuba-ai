const mongoose = require('mongoose');

/**
 * Stores PayPal subscription records.
 * One document per active or historical subscription per user.
 */
const subscriptionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    // PayPal subscription ID (e.g. "I-BW452GLLEP1G")
    paypalSubscriptionId: {
      type: String,
      required: true,
      unique: true,
    },
    // PayPal plan ID (e.g. "P-XXXXXXXXXX")
    paypalPlanId: {
      type: String,
      required: true,
    },
    plan: {
      type: String,
      enum: ['pro'],
      required: true,
    },
    status: {
      type: String,
      enum: ['APPROVAL_PENDING', 'APPROVED', 'ACTIVE', 'SUSPENDED', 'CANCELLED', 'EXPIRED'],
      default: 'APPROVAL_PENDING',
    },
    startDate: { type: Date },
    nextBillingDate: { type: Date },
    cancelledAt: { type: Date },
    // Raw PayPal webhook payload for auditing
    lastWebhookPayload: { type: mongoose.Schema.Types.Mixed },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Subscription', subscriptionSchema);
