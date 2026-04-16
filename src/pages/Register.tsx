import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '0.8rem', marginBottom: '1rem',
  borderRadius: '0.5rem', border: 'none',
  background: '#0f172a', color: 'white', boxSizing: 'border-box',
};

const Register: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register, googleLogin } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password.length < 8) {
      setError('كلمة المرور يجب أن تكون 8 أحرف على الأقل');
      return;
    }
    setLoading(true);
    try {
      await register(name, email, password);
      navigate('/');
    } catch (err: any) {
      setError(err?.response?.data?.message || 'فشل إنشاء الحساب. تأكد من صحة البيانات.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse: any) => {
    setError('');
    setLoading(true);
    try {
      await googleLogin(credentialResponse.credential);
      navigate('/');
    } catch (err: any) {
      setError(err?.response?.data?.message || 'فشل التسجيل بـ Google');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '2rem auto', padding: '2rem', background: '#1e293b', borderRadius: '1rem', direction: 'rtl' }}>
      <h2 style={{ textAlign: 'center', marginBottom: '1.5rem' }}>إنشاء حساب جديد</h2>

      {error && <p style={{ color: '#ff4444', textAlign: 'center', marginBottom: '1rem' }}>{error}</p>}

      {/* Quick Google sign-up at the top */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
        <GoogleLogin
          onSuccess={handleGoogleSuccess}
          onError={() => setError('فشل التسجيل بـ Google')}
          text="signup_with"
          shape="rectangular"
          theme="filled_blue"
          width="350"
        />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', margin: '1rem 0' }}>
        <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.1)' }} />
        <span style={{ color: '#64748b', fontSize: '0.85rem' }}>أو سجّل بالبريد</span>
        <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.1)' }} />
      </div>

      <form onSubmit={handleSubmit}>
        <input type="text" placeholder="الاسم الكامل" value={name}
          onChange={(e) => setName(e.target.value)} required style={inputStyle} />
        <input type="email" placeholder="البريد الإلكتروني" value={email}
          onChange={(e) => setEmail(e.target.value)} required style={inputStyle} />
        <input type="password" placeholder="كلمة المرور (8 أحرف على الأقل)" value={password}
          onChange={(e) => setPassword(e.target.value)} required minLength={8} style={inputStyle} />
        <button type="submit" disabled={loading} style={{
          width: '100%', padding: '0.8rem',
          background: loading ? '#6b7280' : '#2d5bff',
          color: 'white', border: 'none', borderRadius: '0.5rem',
          cursor: loading ? 'not-allowed' : 'pointer',
          fontSize: '1rem', fontWeight: 600,
        }}>
          {loading ? 'جارٍ التسجيل...' : 'تسجيل'}
        </button>
      </form>

      <p style={{ textAlign: 'center', marginTop: '1.2rem', color: '#94a3b8' }}>
        لديك حساب بالفعل؟ <Link to="/login" style={{ color: '#2d5bff' }}>تسجيل الدخول</Link>
      </p>
    </div>
  );
};

export default Register;
