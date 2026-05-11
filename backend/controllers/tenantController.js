const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { randomBytes } = require('crypto');
const Tenant = require('../models/Tenant');
const User = require('../models/User');

const PLAN_QUOTAS = { free: 10000, starter: 100000, pro: 500000 };

function makeTenantToken(userId, tenantId) {
  return jwt.sign({ userId, tenantId }, process.env.JWT_SECRET, { expiresIn: '7d' });
}

exports.register = async (req, res) => {
  try {
    const { brandName, logoUrl, primaryColor, plan, adminName, adminEmail, adminPassword } = req.body;

    if (!brandName || !adminName || !adminEmail || !adminPassword) {
      return res.status(400).json({ success: false, error: 'brandName, adminName, adminEmail, adminPassword are required' });
    }
    if (adminPassword.length < 8) {
      return res.status(400).json({ success: false, error: 'Password must be at least 8 characters' });
    }

    const existing = await User.findOne({ email: adminEmail });
    if (existing) {
      return res.status(400).json({ success: false, error: 'Email already in use' });
    }

    const selectedPlan = ['free', 'starter', 'pro'].includes(plan) ? plan : 'free';

    const tenant = new Tenant({
      brandName,
      logoUrl,
      primaryColor,
      plan: selectedPlan,
      monthlyTokenQuota: PLAN_QUOTAS[selectedPlan],
    });
    await tenant.save();
    console.log(`✅ Tenant created: ${tenant.tenantId}`);

    const hashed = await bcrypt.hash(adminPassword, 12);
    const adminUser = new User({
      name: adminName,
      email: adminEmail,
      password: hashed,
      tenantId: tenant.tenantId,
      role: 'admin',
    });
    await adminUser.save();
    console.log(`✅ Admin user created: ${adminUser._id}`);

    const token = makeTenantToken(adminUser._id, tenant.tenantId);

    return res.status(201).json({
      success: true,
      data: {
        token,
        tenant: {
          tenantId: tenant.tenantId,
          brandName: tenant.brandName,
          plan: tenant.plan,
          monthlyTokenQuota: tenant.monthlyTokenQuota,
        },
        user: { id: adminUser._id, name: adminUser.name, email: adminUser.email, role: adminUser.role },
      },
    });
  } catch (err) {
    console.error('❌ Tenant register error:', err.message);
    return res.status(500).json({ success: false, error: 'Server error' });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password, tenantId } = req.body;

    if (!email || !password || !tenantId) {
      return res.status(400).json({ success: false, error: 'email, password, tenantId are required' });
    }

    const tenant = await Tenant.findOne({ tenantId });
    if (!tenant || !tenant.isActive) {
      return res.status(404).json({ success: false, error: 'Tenant not found or inactive' });
    }

    const user = await User.findOne({ email, tenantId });
    if (!user || !user.password) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    const token = makeTenantToken(user._id, tenant.tenantId);
    console.log(`✅ Tenant login: ${user.email} → ${tenantId}`);

    return res.json({
      success: true,
      data: {
        token,
        user: { id: user._id, name: user.name, email: user.email, role: user.role },
        tenant: { tenantId: tenant.tenantId, brandName: tenant.brandName, plan: tenant.plan },
      },
    });
  } catch (err) {
    console.error('❌ Tenant login error:', err.message);
    return res.status(500).json({ success: false, error: 'Server error' });
  }
};

exports.getMe = async (req, res) => {
  try {
    const t = req.tenant;
    return res.json({
      success: true,
      data: {
        tenantId: t.tenantId,
        brandName: t.brandName,
        logoUrl: t.logoUrl,
        primaryColor: t.primaryColor,
        plan: t.plan,
        isActive: t.isActive,
        usage: {
          usedTokens: t.usedTokens,
          monthlyTokenQuota: t.monthlyTokenQuota,
          remaining: t.monthlyTokenQuota - t.usedTokens,
          resetDate: t.resetDate,
        },
      },
    });
  } catch (err) {
    console.error('❌ Tenant getMe error:', err.message);
    return res.status(500).json({ success: false, error: 'Server error' });
  }
};

exports.getUsage = async (req, res) => {
  try {
    const t = req.tenant;
    const percentUsed = t.monthlyTokenQuota > 0
      ? Math.round((t.usedTokens / t.monthlyTokenQuota) * 100)
      : 0;

    return res.json({
      success: true,
      data: {
        usedTokens: t.usedTokens,
        monthlyTokenQuota: t.monthlyTokenQuota,
        percentUsed,
        resetDate: t.resetDate,
        plan: t.plan,
      },
    });
  } catch (err) {
    console.error('❌ Tenant getUsage error:', err.message);
    return res.status(500).json({ success: false, error: 'Server error' });
  }
};

exports.updateBranding = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Admin access required' });
    }

    const { brandName, logoUrl, primaryColor } = req.body;
    const t = req.tenant;
    if (brandName) t.brandName = brandName;
    if (logoUrl !== undefined) t.logoUrl = logoUrl;
    if (primaryColor) t.primaryColor = primaryColor;
    await t.save();
    console.log(`✅ Branding updated for tenant: ${t.tenantId}`);

    return res.json({
      success: true,
      data: { tenantId: t.tenantId, brandName: t.brandName, logoUrl: t.logoUrl, primaryColor: t.primaryColor },
    });
  } catch (err) {
    console.error('❌ Update branding error:', err.message);
    return res.status(500).json({ success: false, error: 'Server error' });
  }
};

exports.getApiKey = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Admin access required' });
    }
    return res.json({ success: true, data: { apiKey: req.tenant.apiKey } });
  } catch (err) {
    console.error('❌ Get API key error:', err.message);
    return res.status(500).json({ success: false, error: 'Server error' });
  }
};

exports.regenerateApiKey = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Admin access required' });
    }
    req.tenant.apiKey = randomBytes(32).toString('hex');
    await req.tenant.save();
    console.log(`✅ API key regenerated for tenant: ${req.tenant.tenantId}`);
    return res.json({ success: true, data: { apiKey: req.tenant.apiKey } });
  } catch (err) {
    console.error('❌ Regenerate API key error:', err.message);
    return res.status(500).json({ success: false, error: 'Server error' });
  }
};
