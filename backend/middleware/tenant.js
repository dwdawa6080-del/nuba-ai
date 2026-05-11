const jwt = require('jsonwebtoken');
const Tenant = require('../models/Tenant');

async function trackTokenUsage(tenantId, tokensUsed) {
  try {
    await Tenant.findOneAndUpdate(
      { tenantId },
      { $inc: { usedTokens: tokensUsed } }
    );
    console.log(`✅ Tracked ${tokensUsed} tokens for tenant: ${tenantId}`);
  } catch (err) {
    console.error('❌ Token tracking error:', err.message);
  }
}

async function tenantMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, error: 'Token required' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!decoded.tenantId) {
      return res.status(401).json({ success: false, error: 'Tenant token required' });
    }

    const tenant = await Tenant.findOne({ tenantId: decoded.tenantId });
    if (!tenant) {
      return res.status(404).json({ success: false, error: 'Tenant not found' });
    }
    if (!tenant.isActive) {
      return res.status(403).json({ success: false, error: 'Tenant is inactive' });
    }

    // Reset quota if billing period has rolled over
    if (new Date() >= tenant.resetDate) {
      const now = new Date();
      tenant.usedTokens = 0;
      tenant.resetDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      await tenant.save();
      console.log(`🚀 Token quota reset for tenant: ${tenant.tenantId}`);
    }

    if (tenant.usedTokens >= tenant.monthlyTokenQuota) {
      return res.status(429).json({ success: false, error: 'Token quota exceeded' });
    }

    req.tenant = tenant;
    req.userId = decoded.userId;
    next();
  } catch (err) {
    console.error('❌ Tenant middleware error:', err.message);
    return res.status(401).json({ success: false, error: 'Invalid token' });
  }
}

module.exports = tenantMiddleware;
module.exports.trackTokenUsage = trackTokenUsage;
