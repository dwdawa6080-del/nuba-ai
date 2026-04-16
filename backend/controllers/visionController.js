const Groq = require('groq-sdk');

const VALID_MIME_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const VISION_MODEL = process.env.GROQ_VISION_MODEL || 'llama-3.2-11b-vision-preview';

exports.describe = async (req, res) => {
  if (!process.env.GROQ_API_KEY) {
    return res.status(503).json({ message: 'مفتاح GROQ_API_KEY غير موجود في إعدادات الخادم' });
  }

  try {
    const { imageBase64, mimeType = 'image/jpeg', language = 'ar' } = req.body;

    if (!imageBase64 || typeof imageBase64 !== 'string') {
      return res.status(400).json({ message: 'بيانات الصورة مطلوبة' });
    }
    if (!VALID_MIME_TYPES.includes(mimeType)) {
      return res.status(400).json({ message: 'صيغة الصورة غير مدعومة (JPEG, PNG, GIF, WebP فقط)' });
    }
    // base64 of a 4 MB image ≈ 5.5 MB of characters — Groq vision limit
    if (imageBase64.length > 6 * 1024 * 1024) {
      return res.status(400).json({ message: 'حجم الصورة كبير جداً (4 ميغابايت كحد أقصى)' });
    }

    const prompt =
      language === 'ar'
        ? 'أنت مساعد لمساعدة الأشخاص ذوي الإعاقة البصرية. صف ما تراه في هذه الصورة بتفصيل دقيق باللغة العربية. اذكر: الأشخاص وملابسهم وأفعالهم، الأشياء والمواد والألوان، البيئة المحيطة، وأي نص مرئي. ابدأ مباشرةً بالوصف دون مقدمات.'
        : 'You are an assistant for visually impaired people. Describe this image in detail: people, objects, colors, environment, any visible text. Start the description directly.';

    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

    const completion = await groq.chat.completions.create({
      model: VISION_MODEL,
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: { url: `data:${mimeType};base64,${imageBase64}` },
            },
            { type: 'text', text: prompt },
          ],
        },
      ],
    });

    const description = completion.choices[0]?.message?.content?.trim();
    if (!description) {
      return res.status(502).json({ message: 'لم يُرجع النموذج وصفاً للصورة' });
    }

    res.json({ description });
  } catch (error) {
    console.error('Vision error:', error);
    res.status(500).json({ message: 'خطأ في الخادم' });
  }
};
