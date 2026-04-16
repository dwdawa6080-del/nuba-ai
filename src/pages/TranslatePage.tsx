import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const LANGUAGES: Record<string, string> = {
  ar: 'العربية',
  en: 'English',
  fr: 'Français',
  es: 'Español',
  de: 'Deutsch',
  tr: 'Türkçe',
  zh: '中文',
  ru: 'Русский',
};

const LANG_BCP47: Record<string, string> = {
  ar: 'ar-SA',
  en: 'en-US',
  fr: 'fr-FR',
  es: 'es-ES',
  de: 'de-DE',
  tr: 'tr-TR',
  zh: 'zh-CN',
  ru: 'ru-RU',
};

type Tab = 'text' | 'voice';

const S: Record<string, React.CSSProperties> = {
  page: { color: '#e2e8f0', direction: 'rtl', fontFamily: "'Cairo', 'Segoe UI', sans-serif" },
  tabs: { display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' },
  tab: { padding: '0.6rem 1.5rem', borderRadius: '2rem', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '1rem', transition: 'all 0.2s' },
  tabActive: { background: 'linear-gradient(135deg, #2563eb, #4f46e5)', color: 'white' },
  tabInactive: { background: 'rgba(255,255,255,0.07)', color: '#94a3b8' },
  card: { background: 'rgba(30,41,59,0.8)', borderRadius: '1.5rem', padding: '1.5rem', border: '1px solid rgba(255,255,255,0.07)', marginBottom: '1.2rem' },
  langRow: { display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '1.2rem', flexWrap: 'wrap' as const },
  select: { background: '#0f172a', color: 'white', border: '1px solid #334155', borderRadius: '0.8rem', padding: '0.5rem 1rem', fontSize: '1rem', cursor: 'pointer', flex: 1, minWidth: 120 },
  swapBtn: { background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)', color: 'white', borderRadius: '50%', width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '1.2rem', flexShrink: 0 },
  grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.2rem' },
  textareaWrap: { position: 'relative' as const },
  textarea: { width: '100%', minHeight: 180, background: '#0f172a', border: '1px solid #334155', borderRadius: '1rem', padding: '1rem', color: 'white', fontSize: '1.1rem', resize: 'vertical' as const, boxSizing: 'border-box' as const },
  textareaOut: { width: '100%', minHeight: 180, background: 'rgba(37,99,235,0.08)', border: '1px solid rgba(37,99,235,0.3)', borderRadius: '1rem', padding: '1rem', color: '#e2e8f0', fontSize: '1.1rem', resize: 'vertical' as const, boxSizing: 'border-box' as const },
  iconBar: { display: 'flex', gap: '0.5rem', marginTop: '0.5rem', justifyContent: 'flex-end' },
  iconBtn: { background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8', borderRadius: '0.6rem', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '1rem' },
  charCount: { fontSize: '0.78rem', color: '#64748b', textAlign: 'left' as const },
  translateBtn: { display: 'block', margin: '0 auto', padding: '0.85rem 3rem', background: 'linear-gradient(135deg, #2563eb, #4f46e5)', color: 'white', border: 'none', borderRadius: '3rem', fontWeight: 700, fontSize: '1.1rem', cursor: 'pointer', transition: '0.2s' },
  error: { color: '#f87171', background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)', borderRadius: '0.8rem', padding: '0.8rem 1.2rem', marginBottom: '1rem', textAlign: 'center' as const },
  voiceCenter: { textAlign: 'center' as const, padding: '2rem 1rem' },
  micBtn: { width: 100, height: 100, borderRadius: '50%', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem', cursor: 'pointer', margin: '0 auto 1.5rem', transition: 'all 0.2s' },
  micActive: { background: 'linear-gradient(135deg, #dc2626, #b91c1c)', boxShadow: '0 0 0 12px rgba(220,38,38,0.2)' },
  micInactive: { background: 'linear-gradient(135deg, #2563eb, #4f46e5)', boxShadow: '0 8px 25px rgba(37,99,235,0.4)' },
  transcript: { background: '#0f172a', borderRadius: '1rem', padding: '1rem', minHeight: 80, color: '#e2e8f0', fontSize: '1.1rem', textAlign: 'center' as const, marginBottom: '1rem' },
  result: { background: 'rgba(37,99,235,0.08)', border: '1px solid rgba(37,99,235,0.25)', borderRadius: '1rem', padding: '1rem', minHeight: 80, color: '#93c5fd', fontSize: '1.1rem', textAlign: 'center' as const },
};

const TranslatePage: React.FC = () => {
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('text');

  // Text translation state
  const [fromLang, setFromLang] = useState('ar');
  const [toLang, setToLang] = useState('en');
  const [inputText, setInputText] = useState('');
  const [outputText, setOutputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  // Voice tab state
  const [isListening, setIsListening] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [voiceResult, setVoiceResult] = useState('');
  const [voiceLoading, setVoiceLoading] = useState(false);
  const recognitionRef = useRef<any>(null);

  // stop recognition if tab changes
  useEffect(() => {
    if (activeTab !== 'voice' && isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    }
  }, [activeTab]); // eslint-disable-line react-hooks/exhaustive-deps

  const callTranslate = async (text: string, from: string, to: string): Promise<string> => {
    const res = await fetch(`${API_URL}/api/translate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ text, from, to }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'فشل في الترجمة');
    return data.translatedText;
  };

  const handleTranslate = async () => {
    if (!inputText.trim() || loading) return;
    setLoading(true);
    setError('');
    setOutputText('');
    try {
      const result = await callTranslate(inputText, fromLang, toLang);
      setOutputText(result);
    } catch (err: any) {
      setError(err.message || 'حدث خطأ في الترجمة');
    } finally {
      setLoading(false);
    }
  };

  const handleSwap = () => {
    setFromLang(toLang);
    setToLang(fromLang);
    setInputText(outputText);
    setOutputText(inputText);
    setError('');
  };

  const handleCopy = () => {
    if (!outputText) return;
    navigator.clipboard.writeText(outputText).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const speak = (text: string, lang: string) => {
    if (!('speechSynthesis' in window) || !text) return;
    window.speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance(text);
    utt.lang = LANG_BCP47[lang] || lang;
    window.speechSynthesis.speak(utt);
  };

  const handleMicToggle = useCallback(async () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      setError('المتصفح لا يدعم التعرف على الصوت. استخدم Chrome أو Edge.');
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      return;
    }

    setVoiceTranscript('');
    setVoiceResult('');
    setError('');

    const recognition = new SR();
    recognition.lang = LANG_BCP47[fromLang] || fromLang;
    recognition.interimResults = true;
    recognition.continuous = false;

    recognition.onresult = (e: any) => {
      const transcript = Array.from(e.results as any[])
        .map((r: any) => r[0].transcript)
        .join('');
      setVoiceTranscript(transcript);
    };

    recognition.onend = async () => {
      setIsListening(false);
      const finalText = recognitionRef.current?._lastTranscript;
      if (finalText) {
        setVoiceLoading(true);
        try {
          const translated = await callTranslate(finalText, fromLang, toLang);
          setVoiceResult(translated);
          speak(translated, toLang);
        } catch (err: any) {
          setError(err.message || 'فشل في الترجمة');
        } finally {
          setVoiceLoading(false);
        }
      }
    };

    recognition.onerror = (e: any) => {
      setIsListening(false);
      if (e.error !== 'no-speech') {
        setError('حدث خطأ في التعرف على الصوت: ' + e.error);
      }
    };

    // track last transcript for onend callback
    recognition.addEventListener('result', (e: any) => {
      const last = e.results[e.results.length - 1];
      if (last.isFinal) {
        recognition._lastTranscript = last[0].transcript;
      }
    });

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  }, [isListening, fromLang, toLang, token]); // eslint-disable-line react-hooks/exhaustive-deps

  const renderTextTab = () => (
    <>
      {/* Language selector row */}
      <div style={S.langRow}>
        <select
          value={fromLang}
          onChange={(e) => { setFromLang(e.target.value); setOutputText(''); }}
          style={S.select}
        >
          {Object.entries(LANGUAGES).map(([code, name]) => (
            <option key={code} value={code}>{name}</option>
          ))}
        </select>

        <button style={S.swapBtn} onClick={handleSwap} title="تبديل اللغتين">⇄</button>

        <select
          value={toLang}
          onChange={(e) => { setToLang(e.target.value); setOutputText(''); }}
          style={S.select}
        >
          {Object.entries(LANGUAGES).map(([code, name]) => (
            <option key={code} value={code}>{name}</option>
          ))}
        </select>
      </div>

      {error && <div style={S.error}>{error}</div>}

      {/* Two-column input/output */}
      <div style={S.grid}>
        {/* Input */}
        <div>
          <div style={S.textareaWrap}>
            <textarea
              style={{ ...S.textarea, direction: fromLang === 'ar' ? 'rtl' : 'ltr' }}
              placeholder="أدخل النص للترجمة..."
              value={inputText}
              maxLength={500}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && e.ctrlKey) handleTranslate(); }}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={S.charCount}>{inputText.length} / 500</span>
            <div style={S.iconBar}>
              <button
                style={{ ...S.iconBtn, color: isListening ? '#f87171' : '#94a3b8' }}
                onClick={() => { setActiveTab('voice'); }}
                title="الإدخال الصوتي"
              >🎤</button>
              <button style={S.iconBtn} onClick={() => { setInputText(''); setOutputText(''); }} title="مسح">✕</button>
            </div>
          </div>
        </div>

        {/* Output */}
        <div>
          <div style={S.textareaWrap}>
            <textarea
              style={{ ...S.textareaOut, direction: toLang === 'ar' ? 'rtl' : 'ltr' }}
              placeholder={loading ? 'جارٍ الترجمة...' : 'النص المترجم'}
              value={loading ? '' : outputText}
              readOnly
            />
          </div>
          <div style={S.iconBar}>
            <button
              style={{ ...S.iconBtn, color: copied ? '#4ade80' : '#94a3b8' }}
              onClick={handleCopy}
              title="نسخ"
              disabled={!outputText}
            >{copied ? '✓' : '📋'}</button>
            <button
              style={S.iconBtn}
              onClick={() => speak(outputText, toLang)}
              title="قراءة بصوت عالٍ"
              disabled={!outputText}
            >🔊</button>
          </div>
        </div>
      </div>

      <button
        style={{ ...S.translateBtn, opacity: loading || !inputText.trim() ? 0.6 : 1 }}
        onClick={handleTranslate}
        disabled={loading || !inputText.trim()}
      >
        {loading ? '⏳ جارٍ الترجمة...' : '⟵ ترجم'}
      </button>
    </>
  );

  const renderVoiceTab = () => (
    <div style={S.voiceCenter}>
      <div style={S.langRow}>
        <select value={fromLang} onChange={(e) => setFromLang(e.target.value)} style={S.select}>
          {Object.entries(LANGUAGES).map(([code, name]) => (
            <option key={code} value={code}>{name}</option>
          ))}
        </select>
        <button style={S.swapBtn} onClick={handleSwap}>⇄</button>
        <select value={toLang} onChange={(e) => setToLang(e.target.value)} style={S.select}>
          {Object.entries(LANGUAGES).map(([code, name]) => (
            <option key={code} value={code}>{name}</option>
          ))}
        </select>
      </div>

      {error && <div style={S.error}>{error}</div>}

      <p style={{ color: '#94a3b8', marginBottom: '1.5rem' }}>
        {isListening ? '🔴 يستمع... تحدث الآن' : 'اضغط على الميكروفون وتحدث'}
      </p>

      <button
        style={{ ...S.micBtn, ...(isListening ? S.micActive : S.micInactive) }}
        onClick={handleMicToggle}
        aria-label={isListening ? 'إيقاف التسجيل' : 'بدء التسجيل'}
      >
        {isListening ? '⏹' : '🎤'}
      </button>

      {voiceTranscript && (
        <div>
          <p style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: '0.4rem' }}>ما سمعته:</p>
          <div style={S.transcript}>{voiceTranscript}</div>
        </div>
      )}

      {voiceLoading && <p style={{ color: '#94a3b8' }}>⏳ جارٍ الترجمة...</p>}

      {voiceResult && (
        <div>
          <p style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: '0.4rem' }}>الترجمة:</p>
          <div style={S.result}>{voiceResult}</div>
          <div style={{ ...S.iconBar, justifyContent: 'center', marginTop: '0.8rem' }}>
            <button style={S.iconBtn} onClick={() => speak(voiceResult, toLang)} title="قراءة بصوت عالٍ">🔊</button>
            <button
              style={{ ...S.iconBtn, color: copied ? '#4ade80' : '#94a3b8' }}
              onClick={() => { navigator.clipboard.writeText(voiceResult).catch(() => {}); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
            >{copied ? '✓' : '📋'}</button>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div style={S.page}>
      <h2 style={{ marginBottom: '1.5rem', fontSize: '1.6rem', fontWeight: 700 }}>🌐 خدمة الترجمة</h2>

      <div style={S.tabs}>
        {(['text', 'voice'] as Tab[]).map((t) => (
          <button
            key={t}
            style={{ ...S.tab, ...(activeTab === t ? S.tabActive : S.tabInactive) }}
            onClick={() => setActiveTab(t)}
          >
            {t === 'text' ? '📝 ترجمة نصية' : '🎤 ترجمة صوتية'}
          </button>
        ))}
      </div>

      <div style={S.card}>
        {activeTab === 'text' ? renderTextTab() : renderVoiceTab()}
      </div>

      <p style={{ color: '#475569', fontSize: '0.8rem', textAlign: 'center' }}>
        مدعوم بـ MyMemory Translation API · اضغط Ctrl+Enter للترجمة السريعة
      </p>
    </div>
  );
};

export default TranslatePage;
