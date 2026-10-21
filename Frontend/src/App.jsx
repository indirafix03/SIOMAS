import React, { useState, useEffect } from 'react';
import Login from './components/Login.jsx';
import Register from './components/Register.jsx';
import Pending from './components/Pending.jsx';
import Unauthorized from './components/Unauthorized.jsx';
import Toast from './components/Toast.jsx';
import { clearAuth, getAuthToken } from './services/api.js';

// Anggota Portal Components
import AnggotaLayout from './components/anggota/AnggotaLayout.jsx';
import AnggotaDashboard from './components/anggota/AnggotaDashboard.jsx';
import AnggotaAgenda from './components/anggota/AnggotaAgenda.jsx';
import AnggotaAnnouncementDetail from './components/anggota/AnggotaAnnouncementDetail.jsx';
import AnggotaVault from './components/anggota/AnggotaVault.jsx';
import AnggotaHubInter from './components/anggota/AnggotaHubInter.jsx';
import AnggotaHubDetail from './components/anggota/AnggotaHubDetail.jsx';
import AnggotaFormPublikasi from './components/anggota/AnggotaFormPublikasi.jsx';
import AnggotaProfile from './components/anggota/AnggotaProfile.jsx';

export default function App() {
  const portalViews = [
    'dashboard',
    'agenda',
    'vault',
    'hub-inter',
    'detail-pengumuman',
    'detail-kolaborasi',
    'form-publikasi',
    'profile'
  ];

  const [currentView, setCurrentView] = useState(() => {
    const hash = window.location.hash.replace('#/', '');
    if (['login', 'register', 'pending', 'unauthorized', ...portalViews].includes(hash)) {
      return hash;
    }
    // Default to dashboard if token exists, otherwise login
    return getAuthToken() ? 'dashboard' : 'dashboard';
  });

  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const stored = localStorage.getItem('siomas_user') || sessionStorage.getItem('siomas_user');
      if (stored) return JSON.parse(stored);
    } catch {
      // fallback
    }
    // Default preview user matching mockups
    return {
      id: 3,
      nama: 'Ardi Pratama',
      nim: '2310511042',
      role: 'Anggota',
      email: 'ardi@mahasiswa.ac.id',
      status_keanggotaan: 'Aktif',
      job_desc: 'Staff Divisi Acara'
    };
  });

  const [registeredUser, setRegisteredUser] = useState(() => {
    try {
      const stored = sessionStorage.getItem('siomas_registered_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
  const [selectedPost, setSelectedPost] = useState(null);
  const [toasts, setToasts] = useState([]);

  // Toast dispatch
  const showToast = (message, type = 'error') => {
    const id = Date.now() + Math.random().toString(36).substring(2, 6);
    setToasts((prev) => [...prev, { id, message, type }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  // Synchronize hash with currentView
  const navigateTo = (view, extraData = null) => {
    if (extraData && view === 'pending') {
      setRegisteredUser(extraData);
      sessionStorage.setItem('siomas_registered_user', JSON.stringify(extraData));
    }
    setCurrentView(view);
    window.location.hash = `#/${view}`;
  };

  // Listen to browser hash changes (back/forward)
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#/', '');
      if (['login', 'register', 'pending', 'unauthorized', ...portalViews].includes(hash)) {
        setCurrentView(hash);
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const handleLoginSuccess = (user) => {
    setCurrentUser(user);
    navigateTo('dashboard');
  };

  const handleLogout = () => {
    clearAuth();
    setCurrentUser(null);
    navigateTo('login');
    showToast('Anda telah berhasil keluar dari akun.', 'success');
  };

  const handleSelectAnnouncement = (item) => {
    setSelectedAnnouncement(item);
    navigateTo('detail-pengumuman');
  };

  const handleSelectPost = (post) => {
    setSelectedPost(post);
    navigateTo('detail-kolaborasi');
  };

  const isPortalView = portalViews.includes(currentView);

  return (
    <>
      <Toast toasts={toasts} onDismiss={(id) => setToasts((prev) => prev.filter((t) => t.id !== id))} />

      {/* Auth Views */}
      {currentView === 'login' && (
        <Login
          onNavigate={navigateTo}
          onLoginSuccess={handleLoginSuccess}
          showToast={showToast}
        />
      )}

      {currentView === 'register' && (
        <Register
          onNavigate={navigateTo}
          showToast={showToast}
          onRegisterSuccess={(data) => {
            setRegisteredUser(data);
            sessionStorage.setItem('siomas_registered_user', JSON.stringify(data));
          }}
        />
      )}

      {currentView === 'pending' && (
        <Pending
          registeredUser={registeredUser}
          onNavigate={navigateTo}
        />
      )}

      {currentView === 'unauthorized' && (
        <Unauthorized
          onNavigate={navigateTo}
        />
      )}

      {/* Anggota Portal Views with Persistent Sidebar Layout */}
      {isPortalView && (
        <AnggotaLayout
          activeView={currentView}
          onNavigate={navigateTo}
          currentUser={currentUser}
          onLogout={handleLogout}
          unreadCount={1}
        >
          {currentView === 'dashboard' && (
            <AnggotaDashboard
              currentUser={currentUser}
              onNavigate={navigateTo}
              onSelectAnnouncement={handleSelectAnnouncement}
            />
          )}

          {currentView === 'agenda' && (
            <AnggotaAgenda />
          )}

          {currentView === 'detail-pengumuman' && (
            <AnggotaAnnouncementDetail
              announcement={selectedAnnouncement}
              onBack={() => navigateTo('dashboard')}
              showToast={showToast}
            />
          )}

          {currentView === 'vault' && (
            <AnggotaVault
              showToast={showToast}
            />
          )}

          {currentView === 'hub-inter' && (
            <AnggotaHubInter
              onNavigate={navigateTo}
              onSelectPost={handleSelectPost}
              showToast={showToast}
            />
          )}

          {currentView === 'detail-kolaborasi' && (
            <AnggotaHubDetail
              post={selectedPost}
              onBack={() => navigateTo('hub-inter')}
              showToast={showToast}
            />
          )}

          {currentView === 'form-publikasi' && (
            <AnggotaFormPublikasi
              onBack={() => navigateTo('hub-inter')}
              onSubmitSuccess={() => navigateTo('hub-inter')}
              showToast={showToast}
            />
          )}

          {currentView === 'profile' && (
            <AnggotaProfile
              currentUser={currentUser}
              onUpdateUser={(updated) => setCurrentUser(updated)}
              showToast={showToast}
            />
          )}
        </AnggotaLayout>
      )}
    </>
  );
}
