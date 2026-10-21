import React, { useState } from 'react';
import { authApi, setAuthToken } from '../services/api.js';

export default function Login({ onNavigate, onLoginSuccess, showToast }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      showToast('Harap masukkan email dan kata sandi Anda.', 'warning');
      return;
    }

    setLoading(true);

    try {
      const { ok, status, data } = await authApi.login(email, password);

      if (ok && (data.success || data.status === 'success')) {
        const { access_token, refresh_token, user, permissions } = data.data;

        setAuthToken(access_token, rememberMe);
        const storage = rememberMe ? localStorage : sessionStorage;
        storage.setItem('siomas_refresh_token', refresh_token);
        storage.setItem('siomas_user', JSON.stringify(user));
        storage.setItem('siomas_permissions', JSON.stringify(permissions));

        showToast(`Selamat datang, ${user.nama}! (${user.role})`, 'success');
        if (onLoginSuccess) {
          onLoginSuccess(user);
        }
      } else {
        const errMsg = data.message || 'Login gagal, periksa email dan kata sandi Anda.';
        showToast(errMsg, status === 403 ? 'warning' : 'error');

        if (data.message && data.message.toLowerCase().includes('verifikasi')) {
          setTimeout(() => onNavigate('pending'), 1500);
        }
      }
    } catch (err) {
      console.error('Login error:', err);
      showToast('Gagal terhubung ke backend server SIOMAS.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      {/* Kolom Kiri: Hero Branding Sesuai Login.png */}
      <aside className="auth-hero">
        <div className="brand-logo-group">
          <div className="brand-icon">S</div>
          <div className="brand-text">
            <h2>SIOMAS</h2>
            <p>Sistem Organisasi Mahasiswa</p>
          </div>
        </div>

        <div className="hero-content">
          <div className="badge-pill">Sistem Terintegrasi</div>
          <h1 className="hero-title">
            Kelola organisasi.<br />
            Tumbuh bersama.
          </h1>
          <p className="hero-description">
            Satu ruang digital untuk kolaborasi, administrasi, dan seluruh aktivitas organisasi mahasiswa.
          </p>
        </div>

        <div className="hero-testimonial">
          <p className="quote-text">
            “SIOMAS membantu kami bergerak lebih cepat, transparan, dan terorganisir.”
          </p>
          <div className="author-name">Nabila Putri</div>
          <div className="author-role">Ketua UKM Periode 2026</div>
        </div>
      </aside>

      {/* Kolom Kanan: Form Login */}
      <main className="auth-panel">
        <div className="auth-card">
          <header className="auth-header">
            <div className="auth-tracker">Selamat Datang Kembali</div>
            <h2 className="auth-title">Masuk ke akunmu</h2>
            <p className="auth-subtitle">Gunakan akun terdaftar untuk melanjutkan.</p>
          </header>

          <form onSubmit={handleSubmit} className="auth-form" noValidate>
            <div className="form-group">
              <label htmlFor="login-email" className="form-label">Email</label>
              <div className="input-container">
                <input
                  id="login-email"
                  type="email"
                  className="form-input"
                  placeholder="nama@mahasiswa.ac.id"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="login-password" className="form-label">Kata Sandi</label>
              <div className="input-container">
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  className="form-input"
                  placeholder="Minimal 8 karakter"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="toggle-password"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label="Lihat kata sandi"
                >
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div className="form-options">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <span>Ingat saya</span>
              </label>
            </div>

            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? (
                <>
                  <span className="spinner" style={{ display: 'inline-block' }}></span>
                  <span>Memproses...</span>
                </>
              ) : (
                <span>Masuk / Login</span>
              )}
            </button>
          </form>

          <footer className="auth-footer">
            <p>
              Belum menjadi anggota?{' '}
              <button
                type="button"
                onClick={() => onNavigate('register')}
                className="auth-link"
                style={{ background: 'none', border: 'none', cursor: 'pointer', font: 'inherit' }}
              >
                Daftar sekarang
              </button>
            </p>
            <div className="security-note">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              <span>Data kamu dilindungi dengan enkripsi standar industri</span>
            </div>
          </footer>
        </div>
      </main>
    </div>
  );
}
