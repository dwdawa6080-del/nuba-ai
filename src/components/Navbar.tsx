import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate, useLocation } from 'react-router-dom';

const NAV_LINKS = [
  { to: '/', label: 'الرئيسية' },
  { to: '/translate', label: '🌐 الترجمة' },
  { to: '/blind-assist', label: '👁 مساعدة المكفوفين' },
  { to: '/chat', label: '💬 المساعد الذكي' },
];

const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav style={{
      background: '#0f172a',
      padding: '0.8rem 1.5rem',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      direction: 'rtl',
      borderBottom: '1px solid rgba(255,255,255,0.07)',
      flexWrap: 'wrap',
      gap: '0.5rem',
    }}>
      <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
        {NAV_LINKS.map(({ to, label }) => {
          const active = location.pathname === to;
          return (
            <Link
              key={to}
              to={to}
              style={{
                color: active ? 'white' : '#94a3b8',
                textDecoration: 'none',
                padding: '0.4rem 0.9rem',
                borderRadius: '0.6rem',
                background: active ? 'rgba(37,99,235,0.25)' : 'transparent',
                fontWeight: active ? 600 : 400,
                fontSize: '0.95rem',
                transition: '0.15s',
              }}
            >
              {label}
            </Link>
          );
        })}
      </div>

      <div>
        {user ? (
          <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'center' }}>
            {user.avatar
              ? <img src={user.avatar} alt={user.name} style={{ width: 30, height: 30, borderRadius: '50%', objectFit: 'cover' }} />
              : null}
            <span style={{ color: '#94a3b8', fontSize: '0.9rem' }}>مرحباً، {user.name}</span>
            <button
              onClick={handleLogout}
              style={{
                background: 'rgba(220,38,38,0.15)',
                border: '1px solid rgba(220,38,38,0.3)',
                padding: '0.4rem 0.9rem',
                borderRadius: '0.6rem',
                cursor: 'pointer',
                color: '#f87171',
                fontSize: '0.9rem',
              }}
            >
              تسجيل خروج
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: '0.6rem' }}>
            <Link to="/login" style={{ color: '#94a3b8', textDecoration: 'none', padding: '0.4rem 0.9rem' }}>تسجيل دخول</Link>
            <Link to="/register" style={{ color: 'white', textDecoration: 'none', padding: '0.4rem 0.9rem', background: 'rgba(37,99,235,0.25)', borderRadius: '0.6rem' }}>إنشاء حساب</Link>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
