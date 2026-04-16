const Groq = require('groq-sdk');

const SYSTEM_PROMPT = `أنت مساعد تطبيق نوبة AI، تتحدث العربية الفصحى الحديثة مع لمسة دافئة ودودة.
هدفك الأساسي هو مساعدة المستخدمين في:
- استخدام ميزات التطبيق: الترجمة النصية والصوتية، مساعدة المكفوفين بوصف الصور، التعرف على لغة الإشارة
- الإجابة عن الأسئلة الشائعة حول إمكانية الوصول والإعاقات
- تقديم نصائح عامة حول أفضل ممارسات الترجمة
- توجيه المستخدم إلى الصفحات المناسبة داخل التطبيق

قواعدك:
- تكون مهذباً وواضحاً وتقدم إجابات مختصرة ومفيدة
- إذا لم تعرف الإجابة، تعتذر بلطف وتوجه المستخدم إلى الدعم الفني
- لا تُجري مكالمات خارج التطبيق أو تترجم مستندات محمية بحقوق النشر
- لا تقدم استشارات طبية أو قانونية
- يمكنك الإجابة باللغة التي يكتب بها المستخدم`;

exports.chat = async (req, res) => {
  if (!process.env.GROQ_API_KEY) {
    return res.status(503).json({ message: 'مفتاح GROQ_API_KEY غير موجود في إعدادات الخادم' });
  }

  try {
    const { messages } = req.body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ message: 'قائمة الرسائل مطلوبة' });
    }

    // Validate each message
    for (const msg of messages) {
      if (!['user', 'assistant'].includes(msg.role)) {
        return res.status(400).json({ message: 'دور الرسالة يجب أن يكون user أو assistant' });
      }
      if (typeof msg.content !== 'string' || !msg.content.trim()) {
        return res.status(400).json({ message: 'محتوى الرسالة لا يمكن أن يكون فارغاً' });
      }
      if (msg.content.length > 4000) {
        return res.status(400).json({ message: 'الرسالة طويلة جداً (4000 حرف كحد أقصى)' });
      }
    }

    // Keep at most the last 20 messages to stay within token limits
    const trimmedMessages = messages.slice(-20);

    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

    const completion = await groq.chat.completions.create({
      model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
      temperature: 0.7,
      max_tokens: 1024,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        ...trimmedMessages.map((m) => ({ role: m.role, content: m.content })),
      ],
    });

    const reply = completion.choices[0]?.message?.content?.trim();
    if (!reply) {
      return res.status(502).json({ message: 'لم يُرجع النموذج رداً' });
    }

    res.json({ reply });
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ message: 'خطأ في الخادم' });
  }
};
