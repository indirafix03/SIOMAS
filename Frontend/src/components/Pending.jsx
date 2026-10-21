import React from 'react';

export default function Pending({ registeredUser, onNavigate }) {
  const displayName = registeredUser?.nama || 'Calon Anggota';

  return (
    <div className="pending-wrapper">
      <div className="pending-card">
        {/* Brand Header */}
        <div className="brand-logo-group">
          <div className="brand-icon">S</div>
          <div className="brand-text">
            <h2 style={{ color: '#0F172A' }}>SIOMAS</h2>
            <p style={{ color: '#64748B' }}>Sistem Organisasi Mahasiswa</p>
          </div>
        </div>

        {/* Animated Clock Warning Icon */}
        <div className="clock-icon-wrapper" aria-hidden="true">
          <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
        </div>

        {/* Status Badge */}
        <div className="badge-warning">Menunggu Verifikasi</div>

        {/* Headings */}
        <h1 className="pending-title">Pendaftaranmu berhasil dikirim</h1>
        <p className="pending-desc">
          Admin sedang memeriksa data keanggotaan kamu. Kami akan mengirimkan notifikasi setelah akun disetujui.
        </p>

        {/* Information Grid */}
        <div className="pending-info-grid">
          <div className="info-box">
            <div className="info-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
            <div className="info-text">
              <span className="info-label">Nama pendaftar</span>
              <span className="info-val">{displayName}</span>
            </div>
          </div>

          <div className="info-box">
            <div className="info-icon" style={{ backgroundColor: '#FEF3C7', color: '#D97706' }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </div>
            <div className="info-text">
              <span className="info-label">Estimasi verifikasi</span>
              <span className="info-val">1–2 hari kerja</span>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <button
          type="button"
          onClick={() => onNavigate('login')}
          className="btn-secondary"
          style={{ width: '100%', cursor: 'pointer', border: 'none', font: 'inherit' }}
        >
          Kembali ke Login
        </button>
      </div>
    </div>
  );
}
