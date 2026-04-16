const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// التحقق من المتغيرات البيئية المطلوبة
const requiredEnvVars = ['MONGODB_URI', 'JWT_SECRET'];
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`❌ المتغير البيئي المطلوب غير موجود: ${envVar}`);
    process.exit(1);
  }
}
if (process.env.JWT_SECRET.length < 32) {
  console.error('❌ JWT_SECRET يجب أن يكون 32 حرفاً على الأقل');
  process.exit(1);
}

const app = express();

// إعداد CORS
const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000').split(',');
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('غير مسموح من هذا المصدر'));
      }
    },
    credentials: true,
  })
);

app.use(express.json({ limit: '10mb' })); // 10mb لدعم رفع الصور

// محددات معدل الطلبات
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { message: 'عدد كبير من الطلبات، حاول مجدداً بعد 15 دقيقة' },
  standardHeaders: true,
  legacyHeaders: false,
});

const translateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  message: { message: 'عدد كبير من طلبات الترجمة، حاول بعد دقيقة' },
  standardHeaders: true,
  legacyHeaders: false,
});

const visionLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { message: 'عدد كبير من طلبات وصف الصور، حاول بعد دقيقة' },
  standardHeaders: true,
  legacyHeaders: false,
});

const chatLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  message: { message: 'عدد كبير من رسائل المحادثة، حاول بعد دقيقة' },
  standardHeaders: true,
  legacyHeaders: false,
});

// المسارات
const authRoutes = require('./routes/authRoutes');
const translateRoutes = require('./routes/translateRoutes');
const visionRoutes = require('./routes/visionRoutes');
const chatRoutes = require('./routes/chatRoutes');

app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/translate', translateLimiter, translateRoutes);
app.use('/api/vision', visionLimiter, visionRoutes);
app.use('/api/chat', chatLimiter, chatRoutes);

app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'خادم نوبة AI يعمل بنجاح' });
});

// معالج الأخطاء العام
app.use((err, req, res, next) => {
  console.error('Server error:', err.message);
  res.status(500).json({ message: 'خطأ في الخادم' });
});

// الاتصال بقاعدة البيانات ثم بدء الخادم
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('✅ متصل بـ MongoDB');
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`🚀 الخادم يعمل على المنفذ ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('❌ فشل الاتصال بقاعدة البيانات:', err.message);
    process.exit(1);
  });
