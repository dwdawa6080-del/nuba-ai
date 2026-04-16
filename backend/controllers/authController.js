const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const makeToken = (userId) =>
  jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' });

const userPayload = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  avatar: user.avatar || null,
});

// ─── Email / password register ────────────────────────────────────────────────
exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password)
      return res.status(400).json({ message: 'جميع الحقول مطلوبة' });
    if (name.trim().length < 2)
      return res.status(400).json({ message: 'الاسم يجب أن يكون حرفين على الأقل' });
    if (!EMAIL_REGEX.test(email))
      return res.status(400).json({ message: 'صيغة البريد الإلكتروني غير صحيحة' });
    if (password.length < 8)
      return res.status(400).json({ message: 'كلمة المرور يجب أن تكون 8 أحرف على الأقل' });

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing)
      return res.status(400).json({ message: 'البريد الإلكتروني مستخدم بالفعل' });

    const hashed = await bcrypt.hash(password, 12);
    const user = await new User({
      name: name.trim(),
      email: email.toLowerCase(),
      password: hashed,
    }).save();

    res.status(201).json({ token: makeToken(user._id), user: userPayload(user) });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'خطأ في الخادم' });
  }
};

// ─── Email / password login ───────────────────────────────────────────────────
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ message: 'البريد الإلكتروني وكلمة المرور مطلوبان' });
    if (!EMAIL_REGEX.test(email))
      return res.status(400).json({ message: 'صيغة البريد الإلكتروني غير صحيحة' });

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user)
      return res.status(400).json({ message: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' });

    if (!user.password)
      return res.status(400).json({ message: 'هذا الحساب مرتبط بـ Google — استخدم تسجيل الدخول بـ Google' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(400).json({ message: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' });

    res.json({ token: makeToken(user._id), user: userPayload(user) });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'خطأ في الخادم' });
  }
};

// ─── Google OAuth ─────────────────────────────────────────────────────────────
exports.googleAuth = async (req, res) => {
  if (!process.env.GOOGLE_CLIENT_ID)
    return res.status(503).json({ message: 'تسجيل الدخول بـ Google غير مفعّل — يرجى إضافة GOOGLE_CLIENT_ID' });

  try {
    const { credential } = req.body;
    if (!credential)
      return res.status(400).json({ message: 'بيانات Google مطلوبة' });

    const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const { sub: googleId, email, name, picture } = ticket.getPayload();

    if (!email)
      return res.status(400).json({ message: 'لم يتم الحصول على البريد الإلكتروني من Google' });

    let user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      // New user — create account
      user = await new User({
        name,
        email: email.toLowerCase(),
        googleId,
        avatar: picture,
      }).save();
    } else {
      // Existing user — link Google if not already linked
      let changed = false;
      if (!user.googleId) { user.googleId = googleId; changed = true; }
      if (!user.avatar && picture) { user.avatar = picture; changed = true; }
      if (changed) await user.save();
    }

    res.json({ token: makeToken(user._id), user: userPayload(user) });
  } catch (error) {
    console.error('Google auth error:', error);
    if (error.message?.includes('Invalid token'))
      return res.status(401).json({ message: 'رمز Google غير صالح' });
    res.status(500).json({ message: 'خطأ في الخادم' });
  }
};

// ─── Get current user ─────────────────────────────────────────────────────────
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    if (!user) return res.status(404).json({ message: 'المستخدم غير موجود' });
    res.json(user);
  } catch (error) {
    console.error('GetMe error:', error);
    res.status(500).json({ message: 'خطأ في الخادم' });
  }
};
