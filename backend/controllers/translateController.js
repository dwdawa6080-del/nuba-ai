const Groq = require('groq-sdk');

const SUPPORTED_LANGUAGES = {
  ar: 'العربية',
  en: 'English',
  fr: 'Français',
  es: 'Español',
  de: 'Deutsch',
  tr: 'Türkçe',
  zh: '中文',
  ru: 'Русский',
};

const LANGUAGE_NAMES_EN = {
  ar: 'Arabic',
  en: 'English',
  fr: 'French',
  es: 'Spanish',
  de: 'German',
  tr: 'Turkish',
  zh: 'Chinese',
  ru: 'Russian',
};

exports.translate = async (req, res) => {
  if (!process.env.GROQ_API_KEY) {
    return res.status(503).json({ message: 'مفتاح GROQ_API_KEY غير موجود في إعدادات الخادم' });
  }

  try {
    const { text, from = 'ar', to = 'en' } = req.body;

    if (!text || typeof text !== 'string' || !text.trim()) {
      return res.status(400).json({ message: 'النص مطلوب' });
    }
    if (text.trim().length > 2000) {
      return res.status(400).json({ message: 'النص طويل جداً (2000 حرف كحد أقصى)' });
    }
    if (!SUPPORTED_LANGUAGES[from] || !SUPPORTED_LANGUAGES[to]) {
      return res.status(400).json({ message: 'اللغة غير مدعومة' });
    }
    if (from === to) {
      return res.json({ translatedText: text.trim() });
    }

    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

    const completion = await groq.chat.completions.create({
      model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
      temperature: 0.1,
      max_tokens: 2048,
      messages: [
        {
          role: 'system',
          content:
            'You are a professional translator. Translate the user text accurately from ' +
            LANGUAGE_NAMES_EN[from] +
            ' to ' +
            LANGUAGE_NAMES_EN[to] +
            '. Return ONLY the translated text with no explanations, notes, or quotes.',
        },
        { role: 'user', content: text.trim() },
      ],
    });

    const translatedText = completion.choices[0]?.message?.content?.trim();
    if (!translatedText) {
      return res.status(502).json({ message: 'لم يُرجع النموذج ترجمة' });
    }

    res.json({ translatedText });
  } catch (error) {
    console.error('Translation error:', error);
    res.status(500).json({ message: 'خطأ في الخادم' });
  }
};

exports.getLanguages = (req, res) => {
  res.json(SUPPORTED_LANGUAGES);
};
