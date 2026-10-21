import React from 'react';
import { clearAuth } from '../services/api.js';

export default function Unauthorized({ onNavigate }) {
  const handleRelogin = () => {
    clearAuth();
    onNavigate('login');
  };

  return (
    <div className="pending-wrapper">
      <div className="pending-card" style={{ maxWidth: '440px' }}>
        <div className="brand-logo-group">
          <div className="brand-icon">S</div>
          <div className="brand-text">
            <h2 style={{ color: '#0F172A' }}>SIOMAS</h2>
            <p style={{ color: '#64748B' }}>Sistem Organisasi Mahasiswa</p>
          </div>
        </div>

        <div
          className="clock-icon-wrapper"
          style={{ backgroundColor: '#FEF2F2', color: '#EF4444' }}
          aria-hidden="true"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        </div>

        <div className="badge-pill" style={{ backgroundColor: '#FEE2E2', color: '#991B1B', borderColor: '#FECACA' }}>
          Error 401 - Unauthorized
        </div>

        <h1 className="pending-title" style={{ marginTop: '16px' }}>Sesi Berakhir atau Tidak Diizinkan</h1>
        <p className="pending-desc">
          Sesi masuk Anda telah kedaluwarsa atau akun Anda belum memiliki izin untuk mengakses halaman ini. Silakan login kembali.
        </p>

        <button
          type="button"
          onClick={handleRelogin}
          className="btn-primary"
          style={{ width: '100%', marginTop: '24px', cursor: 'pointer', border: 'none' }}
        >
          Login Ulang
        </button>
      </div>
    </div>
  );
}
