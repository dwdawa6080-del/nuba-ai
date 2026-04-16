import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const S: Record<string, React.CSSProperties> = {
  page: { color: '#e2e8f0', direction: 'rtl', fontFamily: "'Cairo', 'Segoe UI', sans-serif" },
  card: { background: 'rgba(30,41,59,0.8)', borderRadius: '1.5rem', padding: '1.5rem', border: '1px solid rgba(255,255,255,0.07)', marginBottom: '1.2rem' },
  grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' },
  videoWrap: { position: 'relative' as const, background: '#0f172a', borderRadius: '1.2rem', overflow: 'hidden', aspectRatio: '4/3', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px dashed #334155', marginBottom: '1rem' },
  video: { width: '100%', height: '100%', objectFit: 'cover' as const, borderRadius: '1.2rem', display: 'block' },
  placeholder: { textAlign: 'center' as const, color: '#475569' },
  btnRow: { display: 'flex', gap: '0.8rem', flexWrap: 'wrap' as const },
  btn: { flex: 1, padding: '0.75rem 1rem', background: 'linear-gradient(135deg,#2563eb,#4f46e5)', color: 'white', border: 'none', borderRadius: '1rem', fontWeight: 600, cursor: 'pointer', fontSize: '0.95rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', minWidth: 120 },
  btnSecondary: { background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)', color: '#cbd5e1' },
  btnDanger: { background: 'linear-gradient(135deg,#dc2626,#b91c1c)' },
  resultBox: { background: '#0f172a', borderRadius: '1.2rem', padding: '1.2rem', minHeight: 120, color: '#e2e8f0', fontSize: '1.05rem', lineHeight: 1.7, border: '1px solid #1e293b', marginBottom: '1rem' },
  resultPlaceholder: { color: '#475569', textAlign: 'center' as const, paddingTop: '2rem' },
  loading: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.8rem', color: '#94a3b8', paddingTop: '1.5rem' },
  error: { color: '#f87171', background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)', borderRadius: '0.8rem', padding: '0.8rem 1.2rem', marginBottom: '1rem' },
  langToggle: { display: 'flex', gap: '0.5rem', marginBottom: '1rem' },
  langBtn: { padding: '0.4rem 1rem', borderRadius: '2rem', border: 'none', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600 },
  iconBtn: { background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8', borderRadius: '0.6rem', width: 38, height: 38, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '1rem' },
  iconRow: { display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginBottom: '0.8rem' },
};

type Mode = 'idle' | 'camera' | 'preview';

const BlindAssistPage: React.FC = () => {
  const { token } = useAuth();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [mode, setMode] = useState<Mode>('idle');
  const [capturedImage, setCapturedImage] = useState<string | null>(null); // data URL
  const [description, setDescription] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState('');
  const [outputLang, setOutputLang] = useState<'ar' | 'en'>('ar');
  const [copied, setCopied] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // cleanup camera on unmount
  useEffect(() => {
    return () => stopCamera();
  }, []);

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  };

  const startCamera = async () => {
    setError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setMode('camera');
      setCapturedImage(null);
      setDescription('');
    } catch (err: any) {
      if (err.name === 'NotAllowedError') {
        setError('تم رفض الوصول للكاميرا. يرجى السماح للمتصفح باستخدام الكاميرا.');
      } else if (err.name === 'NotFoundError') {
        setError('لا توجد كاميرا متاحة على هذا الجهاز.');
      } else {
        setError('حدث خطأ في تشغيل الكاميرا: ' + err.message);
      }
    }
  };

  const takePhoto = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    setCapturedImage(dataUrl);
    stopCamera();
    setMode('preview');
    setDescription('');
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('الملف المحدد ليس صورة');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('حجم الصورة كبير جداً (5 ميغابايت كحد أقصى)');
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      setCapturedImage(dataUrl);
      stopCamera();
      setMode('preview');
      setDescription('');
      setError('');
    };
    reader.readAsDataURL(file);
    // reset input so same file can be re-selected
    e.target.value = '';
  };

  const analyzeImage = async () => {
    if (!capturedImage) return;
    setAnalyzing(true);
    setError('');
    setDescription('');

    try {
      // Extract base64 from data URL (strip "data:image/jpeg;base64,")
      const commaIdx = capturedImage.indexOf(',');
      const base64 = capturedImage.slice(commaIdx + 1);
      const mimeMatch = capturedImage.match(/data:(image\/[a-z]+);base64/);
      const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';

      const res = await fetch(`${API_URL}/api/vision/describe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ imageBase64: base64, mimeType, language: outputLang }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'فشل في تحليل الصورة');
      setDescription(data.description);
    } catch (err: any) {
      setError(err.message || 'حدث خطأ في تحليل الصورة');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSpeak = () => {
    if (!('speechSynthesis' in window) || !description) return;
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }
    const utt = new SpeechSynthesisUtterance(description);
    utt.lang = outputLang === 'ar' ? 'ar-SA' : 'en-US';
    utt.onstart = () => setIsSpeaking(true);
    utt.onend = () => setIsSpeaking(false);
    utt.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utt);
  };

  const handleCopy = () => {
    if (!description) return;
    navigator.clipboard.writeText(description).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const resetAll = () => {
    stopCamera();
    setMode('idle');
    setCapturedImage(null);
    setDescription('');
    setError('');
    window.speechSynthesis?.cancel();
    setIsSpeaking(false);
  };

  return (
    <div style={S.page}>
      <h2 style={{ marginBottom: '0.5rem', fontSize: '1.6rem', fontWeight: 700 }}>👁 مساعدة المكفوفين</h2>
      <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>
        التقط صورة أو ارفع واحدة وسيصفها لك الذكاء الاصطناعي
      </p>

      {error && <div style={S.error}>{error}</div>}

      <div style={S.grid}>
        {/* Left — camera / image preview */}
        <div>
          <div style={S.videoWrap}>
            {mode === 'camera' && (
              <video ref={videoRef} style={S.video} autoPlay playsInline muted />
            )}
            {mode === 'preview' && capturedImage && (
              <img src={capturedImage} alt="الصورة الملتقطة" style={S.video} />
            )}
            {mode === 'idle' && (
              <div style={S.placeholder}>
                <div style={{ fontSize: '3.5rem', marginBottom: '0.5rem' }}>📷</div>
                <p>ابدأ بتشغيل الكاميرا أو ارفع صورة</p>
              </div>
            )}
          </div>

          {/* Hidden canvas for photo capture */}
          <canvas ref={canvasRef} style={{ display: 'none' }} />

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handleFileUpload}
          />

          <div style={S.btnRow}>
            {mode !== 'camera' && (
              <button style={S.btn} onClick={startCamera}>
                📷 تشغيل الكاميرا
              </button>
            )}
            {mode === 'camera' && (
              <button style={S.btn} onClick={takePhoto}>
                📸 التقاط صورة
              </button>
            )}
            <button
              style={{ ...S.btn, ...S.btnSecondary }}
              onClick={() => fileInputRef.current?.click()}
            >
              🖼 رفع صورة
            </button>
            {mode !== 'idle' && (
              <button style={{ ...S.btn, ...S.btnDanger }} onClick={resetAll}>
                ↺ إعادة تعيين
              </button>
            )}
          </div>
        </div>

        {/* Right — analysis result */}
        <div>
          <div style={S.langToggle}>
            <span style={{ color: '#94a3b8', alignSelf: 'center', fontSize: '0.9rem', marginLeft: '0.4rem' }}>
              لغة الوصف:
            </span>
            {(['ar', 'en'] as const).map((lang) => (
              <button
                key={lang}
                style={{
                  ...S.langBtn,
                  background: outputLang === lang ? 'linear-gradient(135deg,#2563eb,#4f46e5)' : 'rgba(255,255,255,0.07)',
                  color: outputLang === lang ? 'white' : '#94a3b8',
                  border: outputLang === lang ? 'none' : '1px solid rgba(255,255,255,0.1)',
                }}
                onClick={() => setOutputLang(lang)}
              >
                {lang === 'ar' ? 'العربية' : 'English'}
              </button>
            ))}
          </div>

          {description && (
            <div style={S.iconRow}>
              <button
                style={{ ...S.iconBtn, color: isSpeaking ? '#f87171' : '#94a3b8' }}
                onClick={handleSpeak}
                title={isSpeaking ? 'إيقاف القراءة' : 'قراءة الوصف'}
              >
                {isSpeaking ? '⏹' : '🔊'}
              </button>
              <button
                style={{ ...S.iconBtn, color: copied ? '#4ade80' : '#94a3b8' }}
                onClick={handleCopy}
                title="نسخ الوصف"
              >
                {copied ? '✓' : '📋'}
              </button>
            </div>
          )}

          <div style={S.resultBox}>
            {analyzing && (
              <div style={S.loading}>
                <span style={{ fontSize: '1.5rem' }}>🔍</span>
                <span>جارٍ تحليل الصورة...</span>
              </div>
            )}
            {!analyzing && description && (
              <p style={{ margin: 0, direction: outputLang === 'ar' ? 'rtl' : 'ltr' }}>
                {description}
              </p>
            )}
            {!analyzing && !description && (
              <div style={S.resultPlaceholder}>
                <p>سيظهر وصف الصورة هنا</p>
              </div>
            )}
          </div>

          <button
            style={{
              ...S.btn,
              width: '100%',
              opacity: !capturedImage || analyzing ? 0.5 : 1,
              cursor: !capturedImage || analyzing ? 'not-allowed' : 'pointer',
            }}
            onClick={analyzeImage}
            disabled={!capturedImage || analyzing}
          >
            {analyzing ? '⏳ جارٍ التحليل...' : '🤖 وصف الصورة بالذكاء الاصطناعي'}
          </button>

          <p style={{ color: '#475569', fontSize: '0.8rem', textAlign: 'center', marginTop: '0.8rem' }}>
            مدعوم بـ Groq AI (llama-3.2-vision) · يعمل عبر الإنترنت
          </p>
        </div>
      </div>
    </div>
  );
};

export default BlindAssistPage;
