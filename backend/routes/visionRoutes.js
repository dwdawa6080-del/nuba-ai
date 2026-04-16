const express = require('express');
const { describe } = require('../controllers/visionController');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

router.post('/describe', authMiddleware, describe);

module.exports = router;
