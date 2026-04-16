import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '0.8rem', marginBottom: '1rem',
  borderRadius: '0.5rem', border: 'none',
  background: '#0f172a', color: 'white', boxSizing: 'border-box',
};

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, googleLogin } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err: any) {
      setError(err?.response?.data?.message || 'فشل تسجيل الدخول. تحقق من البريد وكلمة المرور.');
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
      setError(err?.response?.data?.message || 'فشل تسجيل الدخول بـ Google');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '2rem auto', padding: '2rem', background: '#1e293b', borderRadius: '1rem', direction: 'rtl' }}>
      <h2 style={{ textAlign: 'center', marginBottom: '1.5rem' }}>تسجيل الدخول</h2>

      {error && <p style={{ color: '#ff4444', textAlign: 'center', marginBottom: '1rem' }}>{error}</p>}

      <form onSubmit={handleSubmit}>
        <input type="email" placeholder="البريد الإلكتروني" value={email}
          onChange={(e) => setEmail(e.target.value)} required style={inputStyle} />
        <input type="password" placeholder="كلمة المرور" value={password}
          onChange={(e) => setPassword(e.target.value)} required style={inputStyle} />
        <button type="submit" disabled={loading} style={{
          width: '100%', padding: '0.8rem',
          background: loading ? '#6b7280' : '#2d5bff',
          color: 'white', border: 'none', borderRadius: '0.5rem',
          cursor: loading ? 'not-allowed' : 'pointer', marginBottom: '1rem',
          fontSize: '1rem', fontWeight: 600,
        }}>
          {loading ? 'جارٍ الدخول...' : 'دخول'}
        </button>
      </form>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', margin: '1rem 0' }}>
        <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.1)' }} />
        <span style={{ color: '#64748b', fontSize: '0.85rem' }}>أو</span>
        <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.1)' }} />
      </div>

      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <GoogleLogin
          onSuccess={handleGoogleSuccess}
          onError={() => setError('فشل تسجيل الدخول بـ Google')}
          text="signin_with"
          shape="rectangular"
          theme="filled_blue"
          width="350"
        />
      </div>

      <p style={{ textAlign: 'center', marginTop: '1.2rem', color: '#94a3b8' }}>
        ليس لديك حساب؟ <Link to="/register" style={{ color: '#2d5bff' }}>إنشاء حساب</Link>
      </p>
    </div>
  );
};

export default Login;
