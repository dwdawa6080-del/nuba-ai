const express = require('express');
const { chat } = require('../controllers/chatController');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

router.post('/', authMiddleware, chat);

module.exports = router;
