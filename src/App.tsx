import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import TranslatePage from './pages/TranslatePage';
import BlindAssistPage from './pages/BlindAssistPage';
import ChatPage from './pages/ChatPage';
import './App.css';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  if (!user) {
    return <Navigate to="/login" />;
  }
  return <>{children}</>;
};

function AppContent() {
  const { loading } = useAuth();

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '2rem' }}>جاري التحميل...</div>;
  }

  return (
    <div className="app">
      <Navbar />
      <div style={{ padding: '2rem' }}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <div>
                  <h1>مرحباً بك في نوبة AI</h1>
                  <p>اختر إحدى الخدمات من القائمة أعلاه.</p>
                </div>
              </ProtectedRoute>
            }
          />
          <Route
            path="/translate"
            element={
              <ProtectedRoute>
                <TranslatePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/blind-assist"
            element={
              <ProtectedRoute>
                <BlindAssistPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/chat"
            element={
              <ProtectedRoute>
                <ChatPage />
              </ProtectedRoute>
            }
          />
        </Routes>
      </div>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
}

export default App;
