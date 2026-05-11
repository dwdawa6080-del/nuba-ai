const mongoose = require('mongoose');

const ragDocumentSchema = new mongoose.Schema(
  {
    text:      { type: String, required: true },
    embedding: { type: [Number], required: true },  // 384-dim all-MiniLM-L6-v2
    metadata:  { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  {
    timestamps: true,
    collection: 'rag_documents',  // match the collection used by rag_agent.py
  }
);

module.exports = mongoose.model('RagDocument', ragDocumentSchema);
