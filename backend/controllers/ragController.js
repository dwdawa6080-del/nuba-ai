const Groq        = require('groq-sdk');
const { pipeline } = require('@xenova/transformers');
const RagDocument  = require('../models/RagDocument');

const groq      = new Groq({ apiKey: process.env.GROQ_API_KEY });
const LLM_MODEL = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';
const TOP_K     = 5;

const _SYSTEM = (
  'You are Nuba, a helpful AI assistant. ' +
  'Answer using only the provided context. ' +
  'If the context does not contain the answer, say so clearly.'
);

// Singleton — model downloads once (~90 MB) then is cached
let _embedder = null;
async function getEmbedder() {
  if (!_embedder) {
    _embedder = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
  }
  return _embedder;
}

exports.chat = async (req, res) => {
  const { question } = req.body;
  if (!question || typeof question !== 'string' || !question.trim()) {
    return res.status(400).json({ message: 'question is required' });
  }

  try {
    // 1. Embed the query
    const embedder = await getEmbedder();
    const output   = await embedder(question.trim(), { pooling: 'mean', normalize: true });
    const queryVector = Array.from(output.data);

    // 2. Atlas Vector Search
    const docs = await RagDocument.aggregate([
      {
        $vectorSearch: {
          index:         'vector_index',
          path:          'embedding',
          queryVector,
          numCandidates: TOP_K * 10,
          limit:         TOP_K,
        },
      },
      { $project: { _id: 0, text: 1 } },
    ]);

    const context = docs.length
      ? docs.map((d) => d.text).join('\n\n---\n\n')
      : 'No relevant context found.';

    // 3. Generate with Groq
    const completion = await groq.chat.completions.create({
      model:    LLM_MODEL,
      messages: [
        { role: 'system', content: _SYSTEM },
        { role: 'user',   content: `Context:\n${context}\n\nQuestion: ${question}` },
      ],
      temperature: 0.1,
      max_tokens:  1024,
    });

    res.json({ answer: completion.choices[0].message.content });
  } catch (err) {
    console.error('RAG error:', err.message);
    res.status(500).json({ message: 'RAG error' });
  }
};
