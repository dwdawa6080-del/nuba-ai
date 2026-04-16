const dns = require('dns');
const mongoose = require('mongoose');

// بعض شبكات الإنترنت المحلية لا تدعم استعلامات DNS من نوع SRV
// المطلوبة لـ mongodb+srv:// — نستخدم Google DNS كحل احتياطي
dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);

const MONGO_OPTIONS = {
  serverSelectionTimeoutMS: 10000, // fail fast if Atlas unreachable
  socketTimeoutMS: 45000,
  maxPoolSize: 10,
};

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, MONGO_OPTIONS);
  } catch (err) {
    console.error('❌ فشل الاتصال بـ MongoDB Atlas:', err.message);
    process.exit(1);
  }
};

mongoose.connection.on('connected', () => {
  console.log('✅ متصل بـ MongoDB Atlas');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ خطأ في MongoDB:', err.message);
});

mongoose.connection.on('disconnected', () => {
  console.warn('⚠️  انقطع الاتصال بـ MongoDB — سيحاول Mongoose إعادة الاتصال تلقائياً');
});

// إغلاق الاتصال بشكل آمن عند إيقاف الخادم
const gracefulShutdown = async (signal) => {
  console.log(`\n${signal} received — إغلاق اتصال MongoDB...`);
  await mongoose.connection.close();
  console.log('MongoDB connection closed.');
  process.exit(0);
};

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

module.exports = connectDB;
