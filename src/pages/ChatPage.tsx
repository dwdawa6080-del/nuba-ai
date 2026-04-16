import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const S: Record<string, React.CSSProperties> = {
  page: {
    color: '#e2e8f0',
    direction: 'rtl',
    fontFamily: "'Cairo', 'Segoe UI', sans-serif",
    display: 'flex',
    flexDirection: 'column',
    height: 'calc(100vh - 120px)',
    minHeight: 500,
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '1rem',
    flexShrink: 0,
  },
  title: { fontSize: '1.6rem', fontWeight: 700 },
  clearBtn: {
    background: 'rgba(255,255,255,0.07)',
    border: '1px solid rgba(255,255,255,0.12)',
    color: '#94a3b8',
    borderRadius: '0.8rem',
    padding: '0.45rem 1rem',
    cursor: 'pointer',
    fontSize: '0.9rem',
  },
  messagesWrap: {
    flex: 1,
    overflowY: 'auto' as const,
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '0.9rem',
    padding: '1rem',
    background: 'rgba(15,23,42,0.6)',
    borderRadius: '1.2rem',
    border: '1px solid rgba(255,255,255,0.06)',
    marginBottom: '1rem',
  },
  empty: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    color: '#475569',
    gap: '0.8rem',
  },
  typingDot: {
    display: 'inline-block',
    width: 7,
    height: 7,
    borderRadius: '50%',
    background: '#94a3b8',
    margin: '0 2px',
    animation: 'bounce 1.2s infinite',
  },
  inputRow: {
    display: 'flex',
    gap: '0.7rem',
    alignItems: 'flex-end',
    flexShrink: 0,
  },
  textarea: {
    flex: 1,
    background: 'rgba(15,23,42,0.8)',
    border: '1px solid #334155',
    borderRadius: '1rem',
    padding: '0.85rem 1.1rem',
    color: 'white',
    fontSize: '1rem',
    resize: 'none' as const,
    minHeight: 50,
    maxHeight: 140,
    lineHeight: 1.5,
    fontFamily: "'Cairo', 'Segoe UI', sans-serif",
    overflowY: 'auto' as const,
  },
  sendBtn: {
    width: 50,
    height: 50,
    borderRadius: '1rem',
    border: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1.3rem',
    cursor: 'pointer',
    flexShrink: 0,
    transition: '0.2s',
  },
  sendActive: { background: 'linear-gradient(135deg, #2563eb, #4f46e5)', color: 'white' },
  sendDisabled: { background: 'rgba(255,255,255,0.06)', color: '#475569', cursor: 'not-allowed' },
  error: {
    color: '#f87171',
    background: 'rgba(248,113,113,0.1)',
    border: '1px solid rgba(248,113,113,0.2)',
    borderRadius: '0.8rem',
    padding: '0.6rem 1rem',
    fontSize: '0.9rem',
    marginBottom: '0.6rem',
    flexShrink: 0,
  },
};

const bubbleRowStyle = (isUser: boolean): React.CSSProperties => ({
  display: 'flex',
  justifyContent: isUser ? 'flex-start' : 'flex-end',
  alignItems: 'flex-end',
  gap: '0.6rem',
});

const bubbleStyle = (isUser: boolean): React.CSSProperties => ({
  maxWidth: '72%',
  padding: '0.75rem 1.1rem',
  borderRadius: isUser ? '1.2rem 1.2rem 0.3rem 1.2rem' : '1.2rem 1.2rem 1.2rem 0.3rem',
  background: isUser ? 'linear-gradient(135deg, #2563eb, #4f46e5)' : 'rgba(30,41,59,0.95)',
  color: isUser ? 'white' : '#e2e8f0',
  fontSize: '1rem',
  lineHeight: 1.65,
  border: isUser ? 'none' : '1px solid rgba(255,255,255,0.07)',
  whiteSpace: 'pre-wrap' as const,
  wordBreak: 'break-word' as const,
});

const avatarStyle = (isUser: boolean): React.CSSProperties => ({
  width: 34,
  height: 34,
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '1rem',
  flexShrink: 0,
  background: isUser ? 'linear-gradient(135deg, #2563eb, #4f46e5)' : 'rgba(30,41,59,0.9)',
  border: '1px solid rgba(255,255,255,0.1)',
});

const WELCOME: Message = {
  role: 'assistant',
  content: 'مرحباً! أنا مساعد نوبة AI. كيف يمكنني مساعدتك اليوم؟\nيمكنني مساعدتك في استخدام ميزات الترجمة، مساعدة المكفوفين، أو الإجابة عن أي سؤال حول التطبيق.',
};

const TypingIndicator: React.FC = () => (
  <div style={bubbleRowStyle(false)}>
    <div style={avatarStyle(false)}>🤖</div>
    <div style={{ ...bubbleStyle(false), padding: '0.75rem 1rem' }}>
      <style>{`@keyframes bounce{0%,80%,100%{transform:translateY(0)}40%{transform:translateY(-6px)}}`}</style>
      {[0, 1, 2].map((i) => (
        <span key={i} style={{ ...S.typingDot, animationDelay: `${i * 0.2}s` }} />
      ))}
    </div>
  </div>
);

const ChatPage: React.FC = () => {
  const { token, user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([WELCOME]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Scroll to bottom whenever messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Auto-resize textarea
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    const ta = textareaRef.current;
    if (ta) {
      ta.style.height = 'auto';
      ta.style.height = Math.min(ta.scrollHeight, 140) + 'px';
    }
  };

  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: Message = { role: 'user', content: text };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setError('');
    setLoading(true);
    if (textareaRef.current) textareaRef.current.style.height = 'auto';

    // Exclude the static welcome message from history sent to API
    const historyForApi = newMessages.filter((m) => m !== WELCOME);

    try {
      const res = await fetch(`${API_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ messages: historyForApi }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'فشل في الحصول على رد');
      setMessages((prev) => [...prev, { role: 'assistant', content: data.reply }]);
    } catch (err: any) {
      setError(err.message || 'حدث خطأ، حاول مجدداً');
      // Remove the user message we optimistically added
      setMessages(newMessages.slice(0, -1));
    } finally {
      setLoading(false);
    }
  }, [input, loading, messages, token]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => {
    setMessages([WELCOME]);
    setError('');
  };

  const canSend = input.trim().length > 0 && !loading;
  const userInitial = user?.name?.charAt(0) ?? '؟';

  return (
    <div style={S.page}>
      <div style={S.header}>
        <h2 style={S.title}>💬 المساعد الذكي</h2>
        <button style={S.clearBtn} onClick={clearChat}>
          ↺ محادثة جديدة
        </button>
      </div>

      <div style={S.messagesWrap}>
        {messages.map((msg, i) => {
          const isUser = msg.role === 'user';
          return (
            <div key={i} style={bubbleRowStyle(isUser)}>
              {!isUser && <div style={avatarStyle(false)}>🤖</div>}
              <div style={bubbleStyle(isUser)}>{msg.content}</div>
              {isUser && <div style={avatarStyle(true)}>{userInitial}</div>}
            </div>
          );
        })}
        {loading && <TypingIndicator />}
        <div ref={bottomRef} />
      </div>

      {error && <div style={S.error}>⚠ {error}</div>}

      <div style={S.inputRow}>
        <textarea
          ref={textareaRef}
          style={S.textarea}
          placeholder="اكتب رسالتك... (Enter للإرسال، Shift+Enter لسطر جديد)"
          value={input}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          rows={1}
          disabled={loading}
        />
        <button
          style={{ ...S.sendBtn, ...(canSend ? S.sendActive : S.sendDisabled) }}
          onClick={sendMessage}
          disabled={!canSend}
          aria-label="إرسال"
        >
          ➤
        </button>
      </div>
    </div>
  );
};

export default ChatPage;
