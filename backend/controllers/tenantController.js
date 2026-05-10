const Tenant = require('../models/Tenant');
const User   = require('../models/User');

function makeSlug(name) {
  const base   = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  const suffix = Math.random().toString(36).slice(2, 8);
  return `${base}-${suffix}`;
}

function canManage(role) {
  return role === 'owner' || role === 'admin';
}

exports.createTenant = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ message: 'name is required' });

    const slug   = makeSlug(name);
    const tenant = await Tenant.create({
      name,
      slug,
      ownerId: req.userId,
      members: [{ userId: req.userId, role: 'admin' }],
    });

    res.status(201).json(tenant);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getMyTenants = async (req, res) => {
  try {
    const tenants = await Tenant.find({
      $or: [
        { ownerId: req.userId },
        { 'members.userId': req.userId },
      ],
    });
    res.json(tenants);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getTenant = async (req, res) => {
  res.json(req.tenant);
};

exports.updateTenant = async (req, res) => {
  try {
    if (!canManage(req.tenantRole)) {
      return res.status(403).json({ message: 'Admin or owner access required' });
    }

    const { name } = req.body;
    if (!name) return res.status(400).json({ message: 'name is required' });

    req.tenant.name = name;
    await req.tenant.save();
    res.json(req.tenant);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.addMember = async (req, res) => {
  try {
    if (!canManage(req.tenantRole)) {
      return res.status(403).json({ message: 'Admin or owner access required' });
    }

    const { email, role = 'member' } = req.body;
    if (!email) return res.status(400).json({ message: 'email is required' });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const already = req.tenant.members.some(m => m.userId.equals(user._id));
    if (already || req.tenant.ownerId.equals(user._id)) {
      return res.status(409).json({ message: 'User is already a member' });
    }

    req.tenant.members.push({ userId: user._id, role });
    await req.tenant.save();
    res.status(201).json(req.tenant);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.removeMember = async (req, res) => {
  try {
    if (!canManage(req.tenantRole)) {
      return res.status(403).json({ message: 'Admin or owner access required' });
    }

    const { memberId } = req.params;
    if (req.tenant.ownerId.equals(memberId)) {
      return res.status(400).json({ message: 'Cannot remove the tenant owner' });
    }

    const before = req.tenant.members.length;
    req.tenant.members = req.tenant.members.filter(m => !m.userId.equals(memberId));

    if (req.tenant.members.length === before) {
      return res.status(404).json({ message: 'Member not found' });
    }

    await req.tenant.save();
    res.json({ message: 'Member removed' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};
