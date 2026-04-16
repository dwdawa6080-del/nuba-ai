const express = require('express');
const { translate, getLanguages } = require('../controllers/translateController');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

router.get('/languages', authMiddleware, getLanguages);
router.post('/', authMiddleware, translate);

module.exports = router;
