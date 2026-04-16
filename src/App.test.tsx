import React, { useState } from 'react';
import './App.css';

const App: React.FC = () => {
  const [activeSection, setActiveSection] = useState('translate');
  const [earMode, setEarMode] = useState(0);
  const earModes = ['يسار فقط (الترجمة)', 'يمين فقط (الترجمة)', 'كلتا الأذنين'];

  const handleEarToggle = () => {
    setEarMode((prev) => (prev + 1) % earModes.length);
  };

  return (
    <div className="app-container">
      {/* Header */}
      <div className="header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div className="logo-area">
            <i className="fas fa-brain logo-icon"></i>
            <span className="logo-text">نوبة AI</span>
          </div>
          <div className="verse">وَقُل رَّبِّ زِدْنِي عِلْمًا</div>
        </div>
        <div className="user-menu">
          <i className="fas fa-bell" style={{ color: '#94a3b8', fontSize: '1.3rem' }}></i>
          <i className="fas fa-cog" style={{ color: '#94a3b8', fontSize: '1.3rem' }}></i>
          <div className="avatar">ط</div>
        </div>
      </div>

      {/* Navbar */}
      <div className="navbar">
        <div
          className={`nav-item ${activeSection === 'translate' ? 'active' : ''}`}
          onClick={() => setActiveSection('translate')}
        >
          <i className="fas fa-language"></i> الترجمة
        </div>
        <div
          className={`nav-item ${activeSection === 'sign' ? 'active' : ''}`}
          onClick={() => setActiveSection('sign')}
        >
          <i className="fas fa-sign-language"></i> لغة الإشارة
        </div>
        <div
          className={`nav-item ${activeSection === 'blind' ? 'active' : ''}`}
          onClick={() => setActiveSection('blind')}
        >
          <i className="fas fa-eye"></i> مساعدة المكفوفين
        </div>
        <div
          className={`nav-item ${activeSection === 'calls' ? 'active' : ''}`}
          onClick={() => setActiveSection('calls')}
        >
          <i className="fas fa-phone-alt"></i> المكالمات
        </div>
        <div
          className={`nav-item ${activeSection === 'profile' ? 'active' : ''}`}
          onClick={() => setActiveSection('profile')}
        >
          <i className="fas fa-user"></i> الملف الشخصي
        </div>
      </div>

      {/* Content */}
      <div className="content">
        {/* قسم الترجمة */}
        {activeSection === 'translate' && (
          <div className="card">
            <div className="card-title"><i className="fas fa-exchange-alt"></i> مترجم فوري</div>
            <div className="flex-row" style={{ justifyContent: 'space-between' }}>
              <select style={{ width: '45%' }}>
                <option value="ar" selected>العربية</option>
                <option value="en">الإنجليزية</option>
                <option value="fr">الفرنسية</option>
                <option value="es">الإسبانية</option>
              </select>
              <i className="fas fa-arrows-left-right" style={{ color: '#3b82f6', fontSize: '1.5rem' }}></i>
              <select style={{ width: '45%' }}>
                <option value="en">الإنجليزية</option>
                <option value="ar" selected>العربية</option>
                <option value="fr">الفرنسية</option>
              </select>
            </div>
            <div style={{ margin: '1rem 0' }}>
              <label>النص الأصلي</label>
              <textarea id="inputText" placeholder="اكتب أو الصق النص هنا...">مرحباً، كيف يمكنني مساعدتك اليوم؟</textarea>
            </div>
            <div>
              <label>النص المترجم</label>
              <textarea id="outputText" placeholder="الترجمة..." readOnly>Hello, how can I help you today?</textarea>
            </div>
            <div className="flex-row" style={{ gap: '1rem', marginTop: '1rem' }}>
              <button onClick={() => {
                const input = (document.getElementById('inputText') as HTMLTextAreaElement).value;
                const output = input.includes('مرحباً') ? 'Hello, how can I help you today?' : `[محاكاة] ${input}`;
                (document.getElementById('outputText') as HTMLTextAreaElement).value = output;
              }}><i className="fas fa-magic"></i> ترجمة</button>
              <button className="secondary" onClick={() => {
                (document.getElementById('inputText') as HTMLTextAreaElement).value = 'مرحباً، هذا نص تم إدخاله صوتياً (محاكاة)';
              }}><i className="fas fa-microphone"></i> إدخال صوتي</button>
              <button className="secondary" onClick={() => {
                alert('🔊 تشغيل النطق: ' + (document.getElementById('outputText') as HTMLTextAreaElement).value);
              }}><i className="fas fa-volume-up"></i> استماع</button>
            </div>
            <div style={{ marginTop: '1rem', background: '#1e293b', padding: '0.8rem', borderRadius: '1rem' }}>
              <i className="fas fa-headphones" style={{ color: '#3b82f6', marginLeft: '0.5rem' }}></i>
              وضع السماعة: <span>{earModes[earMode]}</span>
              <button style={{ marginRight: '1rem', padding: '0.3rem 1rem', background: '#2d3748' }} onClick={handleEarToggle}>تغيير</button>
            </div>
          </div>
        )}

        {/* قسم لغة الإشارة */}
        {activeSection === 'sign' && (
          <div className="card">
            <div className="card-title"><i className="fas fa-sign-language"></i> مترجم لغة الإشارة</div>
            <div className="grid-2">
              <div>
                <div className="camera-placeholder"><i className="fas fa-camera"></i></div>
                <button style={{ width: '100%' }}><i className="fas fa-play"></i> تشغيل الكاميرا</button>
              </div>
              <div>
                <div className="result-badge">
                  <p><strong>النص المترجم:</strong> مرحباً، كيف حالك؟</p>
                  <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>(محاكاة للإشارة)</p>
                </div>
                <div style={{ marginTop: '1rem' }}>
                  <button className="secondary" style={{ width: '100%' }}><i className="fas fa-exchange-alt"></i> ترجمة عكسية (نص → إشارة)</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* قسم مساعدة المكفوفين */}
        {activeSection === 'blind' && (
          <div className="card">
            <div className="card-title"><i className="fas fa-eye"></i> مساعد المكفوفين</div>
            <div className="grid-2">
              <div>
                <div className="camera-placeholder"><i className="fas fa-camera-retro"></i></div>
                <button style={{ width: '100%' }}><i className="fas fa-sync-alt"></i> تحديث المشهد</button>
              </div>
              <div>
                <div className="result-badge">
                  <p><i className="fas fa-exclamation-triangle" style={{ color: '#f59e0b' }}></i> تنبيه: على يمينك شخص، على بعد 3 أمتار.</p>
                  <p><i className="fas fa-door-open"></i> أمامك باب، 5 خطوات.</p>
                  <p style={{ color: '#10b981' }}>الطريق آمن للمشي.</p>
                </div>
                <div style={{ marginTop: '1rem' }}>
                  <label>قراءة نص:</label>
                  <input type="text" placeholder="نص من الكاميرا" value="محطة المترو 200م" readOnly />
                  <button style={{ width: '100%' }}><i className="fas fa-volume-up"></i> قراءة بصوت</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* قسم المكالمات */}
        {activeSection === 'calls' && (
          <div className="card">
            <div className="card-title"><i className="fas fa-phone-alt"></i> مكالمات مترجمة</div>
            <div style={{ display: 'flex', gap: '2rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <div>
                <div style={{ background: '#0f172a', padding: '2rem', borderRadius: '2rem', width: '200px', height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
                  <i className="fas fa-user-circle" style={{ fontSize: '5rem', color: '#3b82f6' }}></i>
                  <p style={{ marginTop: '0.5rem' }}>المتصل: أحمد</p>
                </div>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ background: '#1e293b', borderRadius: '1rem', padding: '1rem', marginBottom: '1rem' }}>
                  <p><i className="fas fa-language"></i> ترجمة فورية: العربية ↔ الإنجليزية</p>
                  <p style={{ color: '#94a3b8' }}>"مرحباً، متى سنلتقي؟" → "Hello, when shall we meet?"</p>
                </div>
                <div className="flex-row">
                  <button><i className="fas fa-video"></i> فيديو</button>
                  <button className="secondary"><i className="fas fa-microphone-slash"></i> كتم</button>
                  <button className="secondary" style={{ background: '#dc2626' }}><i className="fas fa-phone-slash"></i> إنهاء</button>
                </div>
              </div>
            </div>
            <div style={{ marginTop: '1.5rem' }}>
              <p><i className="fas fa-users"></i> اجتماع جماعي (3 مشاركين) - الترجمة نشطة</p>
            </div>
          </div>
        )}

        {/* قسم الملف الشخصي */}
        {activeSection === 'profile' && (
          <div className="card">
            <div className="card-title"><i className="fas fa-id-card"></i> الملف الشخصي</div>
            <div className="flex-row" style={{ gap: '2rem' }}>
              <div>
                <div className="avatar" style={{ width: '80px', height: '80px', fontSize: '2rem' }}>ط</div>
              </div>
              <div style={{ flex: 1 }}>
                <p><strong>الاسم:</strong> طارق محمد</p>
                <p><strong>البريد:</strong> tareq@nuba.ai</p>
                <p><strong>الخطة:</strong> مجاني (200 كلمة/يوم)</p>
                <p><strong>اللغات المفضلة:</strong> العربية، الإنجليزية</p>
              </div>
            </div>
            <hr style={{ borderColor: '#334155', margin: '1.5rem 0' }} />
            <div className="grid-2">
              <div>
                <h4>إحصائيات</h4>
                <p>عدد الترجمات: 1,247</p>
                <p>عدد المكالمات: 89</p>
                <p>الدقائق الصوتية: 320</p>
              </div>
              <div>
                <h4>الإعدادات</h4>
                <p><i className="fas fa-headphones"></i> إخراج الصوت: <span>يسار</span></p>
                <p><i className="fas fa-tachometer-alt"></i> سرعة النطق: 1.0x</p>
                <p><i className="fas fa-moon"></i> الوضع الليلي: مفعل</p>
              </div>
            </div>
            <button style={{ width: '100%', marginTop: '1.5rem' }}><i className="fas fa-cog"></i> تعديل الإعدادات</button>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="footer">
        <p>نوبة AI - كسر حواجز التواصل | جميع النماذج تعمل محلياً (محاكاة)</p>
        <p style={{ fontSize: '0.8rem' }}>تم التطوير وفق متطلبات المشروع - إصدار تجريبي 1.0</p>
      </div>
    </div>
  );
};

export default App;