const Tenant = require('../models/Tenant');

module.exports = async (req, res, next) => {
  const slug = req.header('X-Tenant-Slug');
  if (!slug) return res.status(400).json({ message: 'X-Tenant-Slug header required' });

  try {
    const tenant = await Tenant.findOne({ slug });
    if (!tenant) return res.status(404).json({ message: 'Tenant not found' });

    const isOwner = tenant.ownerId.equals(req.userId);
    const member  = tenant.members.find(m => m.userId.equals(req.userId));

    if (!isOwner && !member) {
      return res.status(403).json({ message: 'Not a member of this tenant' });
    }

    req.tenant     = tenant;
    req.tenantRole = isOwner ? 'owner' : member.role;
    next();
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};
