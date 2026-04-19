const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// Ø§Ù„ØªØ­Ù‚Ù‚ Ù…Ù† Ø§Ù„Ù…ØªØºÙŠØ±Ø§Øª Ø§Ù„Ø¨ÙŠØ¦ÙŠØ© Ø§Ù„Ù…Ø·Ù„ÙˆØ¨Ø©
const requiredEnvVars = ['MONGODB_URI', 'JWT_SECRET'];
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`âŒ Ø§Ù„Ù…ØªØºÙŠØ± Ø§Ù„Ø¨ÙŠØ¦ÙŠ Ø§Ù„Ù…Ø·Ù„ÙˆØ¨ ØºÙŠØ± Ù…ÙˆØ¬ÙˆØ¯: ${envVar}`);
    process.exit(1);
  }
}
if (process.env.JWT_SECRET.length < 32) {
  console.error('âŒ JWT_SECRET ÙŠØ¬Ø¨ Ø£Ù† ÙŠÙƒÙˆÙ† 32 Ø­Ø±ÙØ§Ù‹ Ø¹Ù„Ù‰ Ø§Ù„Ø£Ù‚Ù„');
  process.exit(1);
}

const app = express();

// Ø¥Ø¹Ø¯Ø§Ø¯ CORS
const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000').split(',');
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('ØºÙŠØ± Ù…Ø³Ù…ÙˆØ­ Ù…Ù† Ù‡Ø°Ø§ Ø§Ù„Ù…ØµØ¯Ø±'));
      }
    },
    credentials: true,
  })
);

app.use(express.json({ limit: '10mb' })); // 10mb Ù„Ø¯Ø¹Ù… Ø±ÙØ¹ Ø§Ù„ØµÙˆØ±

// Ù…Ø­Ø¯Ø¯Ø§Øª Ù…Ø¹Ø¯Ù„ Ø§Ù„Ø·Ù„Ø¨Ø§Øª
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { message: 'Ø¹Ø¯Ø¯ ÙƒØ¨ÙŠØ± Ù…Ù† Ø§Ù„Ø·Ù„Ø¨Ø§ØªØŒ Ø­Ø§ÙˆÙ„ Ù…Ø¬Ø¯Ø¯Ø§Ù‹ Ø¨Ø¹Ø¯ 15 Ø¯Ù‚ÙŠÙ‚Ø©' },
  standardHeaders: true,
  legacyHeaders: false,
});

const translateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  message: { message: 'Ø¹Ø¯Ø¯ ÙƒØ¨ÙŠØ± Ù…Ù† Ø·Ù„Ø¨Ø§Øª Ø§Ù„ØªØ±Ø¬Ù…Ø©ØŒ Ø­Ø§ÙˆÙ„ Ø¨Ø¹Ø¯ Ø¯Ù‚ÙŠÙ‚Ø©' },
  standardHeaders: true,
  legacyHeaders: false,
});

const visionLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { message: 'Ø¹Ø¯Ø¯ ÙƒØ¨ÙŠØ± Ù…Ù† Ø·Ù„Ø¨Ø§Øª ÙˆØµÙ Ø§Ù„ØµÙˆØ±ØŒ Ø­Ø§ÙˆÙ„ Ø¨Ø¹Ø¯ Ø¯Ù‚ÙŠÙ‚Ø©' },
  standardHeaders: true,
  legacyHeaders: false,
});

const chatLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  message: { message: 'Ø¹Ø¯Ø¯ ÙƒØ¨ÙŠØ± Ù…Ù† Ø±Ø³Ø§Ø¦Ù„ Ø§Ù„Ù…Ø­Ø§Ø¯Ø«Ø©ØŒ Ø­Ø§ÙˆÙ„ Ø¨Ø¹Ø¯ Ø¯Ù‚ÙŠÙ‚Ø©' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Ø§Ù„Ù…Ø³Ø§Ø±Ø§Øª
const authRoutes = require('./routes/authRoutes');
const translateRoutes = require('./routes/translateRoutes');
const visionRoutes = require('./routes/visionRoutes');
const chatRoutes = require('./routes/chatRoutes');
const connectDB = require('./config/db');

app.use('/api/auth', authLimiter, authRoutes);
const productRoutes = require('./routes/productRoutes');
app.use('/api/products', productRoutes);

app.use('/api/translate', translateLimiter, translateRoutes);
app.use('/api/vision', visionLimiter, visionRoutes);
app.use('/api/chat', chatLimiter, chatRoutes);

app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'Ø®Ø§Ø¯Ù… Ù†ÙˆØ¨Ø© AI ÙŠØ¹Ù…Ù„ Ø¨Ù†Ø¬Ø§Ø­' });
});

// Ù…Ø¹Ø§Ù„Ø¬ Ø§Ù„Ø£Ø®Ø·Ø§Ø¡ Ø§Ù„Ø¹Ø§Ù…
app.use((err, req, res, next) => {
  console.error('Server error:', err.message);
  res.status(500).json({ message: 'Ø®Ø·Ø£ ÙÙŠ Ø§Ù„Ø®Ø§Ø¯Ù…' });
});

// Ø§Ù„Ø§ØªØµØ§Ù„ Ø¨Ù‚Ø§Ø¹Ø¯Ø© Ø§Ù„Ø¨ÙŠØ§Ù†Ø§Øª Ø«Ù… Ø¨Ø¯Ø¡ Ø§Ù„Ø®Ø§Ø¯Ù…
connectDB().then(() => {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`ðŸš€ Ø§Ù„Ø®Ø§Ø¯Ù… ÙŠØ¹Ù…Ù„ Ø¹Ù„Ù‰ Ø§Ù„Ù…Ù†ÙØ° ${PORT}`);
  });
});

