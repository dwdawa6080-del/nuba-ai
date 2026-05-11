const express = require('express');
const router = express.Router();
const tenantMiddleware = require('../middleware/tenant');
const {
  register,
  login,
  getMe,
  getUsage,
  updateBranding,
  getApiKey,
  regenerateApiKey,
} = require('../controllers/tenantController');

// Public routes (no tenant middleware)
router.post('/register', register);
router.post('/login', login);

// Protected routes (tenant middleware verifies JWT + quota)
router.get('/me', tenantMiddleware, getMe);
router.get('/usage', tenantMiddleware, getUsage);
router.put('/branding', tenantMiddleware, updateBranding);
router.get('/apikey', tenantMiddleware, getApiKey);
router.post('/apikey/regenerate', tenantMiddleware, regenerateApiKey);

module.exports = router;
