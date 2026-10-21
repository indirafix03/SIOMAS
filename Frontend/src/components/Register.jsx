import React, { useState } from 'react';
import { authApi } from '../services/api.js';

export default function Register({ onNavigate, showToast, onRegisterSuccess }) {
  const [formData, setFormData] = useState({
    nama: '',
    ukm: '',
    nim: '',
    divisi: '',
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const { nama, ukm, nim, divisi, email, password } = formData;

    if (!nama || !ukm || !nim || !divisi || !email || !password) {
      showToast('Harap lengkapi semua kolom pendaftaran.', 'warning');
      return;
    }

    if (password.length < 8) {
      showToast('Kata sandi harus minimal 8 karakter.', 'warning');
      return;
    }

    setLoading(true);

    try {
      const { ok, status, data } = await authApi.register(formData);

      if (ok && (data.status === 'success' || data.success)) {
        showToast('Pendaftaran berhasil dikirim! Menunggu verifikasi admin.', 'success');
        if (onRegisterSuccess) {
          onRegisterSuccess({ nama, email, ukm, divisi });
        }
        setTimeout(() => {
          onNavigate('pending', { nama, email, ukm, divisi });
        }, 800);
      } else {
        const errMsg = data.message || 'Pendaftaran gagal. Periksa kembali data yang dimasukkan.';
        showToast(errMsg, 'error');
      }
    } catch (err) {
      console.error('Register error:', err);
      showToast('Gagal terhubung ke backend server SIOMAS.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      {/* Kolom Kiri: Hero Branding Sesuai Regist.png */}
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

      {/* Kolom Kanan: Form Register */}
      <main className="auth-panel">
        <div className="auth-card">
          <header className="auth-header">
            <div className="auth-tracker">Gabung Bersama SIOMAS</div>
            <h2 className="auth-title">Buat akun anggota</h2>
            <p className="auth-subtitle">Lengkapi data berikut untuk mengirim pendaftaran.</p>
          </header>

          <form onSubmit={handleSubmit} className="auth-form" noValidate>
            <div className="form-group">
              <label htmlFor="reg-nama" className="form-label">Nama Lengkap</label>
              <div className="input-container">
                <input
                  id="reg-nama"
                  name="nama"
                  type="text"
                  className="form-input"
                  placeholder="Masukkan nama sesuai KTM"
                  value={formData.nama}
                  onChange={handleChange}
                  required
                  autoComplete="name"
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="reg-ukm" className="form-label">UKM Tujuan</label>
              <div className="input-container">
                <select
                  id="reg-ukm"
                  name="ukm"
                  className="form-select"
                  value={formData.ukm}
                  onChange={handleChange}
                  required
                >
                  <option value="" disabled>Pilih organisasi yang ingin diikuti</option>
                  <option value="UKM Seni & Budaya">UKM Seni & Budaya</option>
                  <option value="UKM Olahraga">UKM Olahraga</option>
                  <option value="UKM Penalaran & Penelitian">UKM Penalaran & Penelitian</option>
                  <option value="UKM KSR - PMI">UKM KSR - PMI</option>
                  <option value="UKM Pers Mahasiswa">UKM Pers Mahasiswa</option>
                  <option value="UKM Mapala">UKM Mapala</option>
                  <option value="UKM Robotika & Teknologi">UKM Robotika & Teknologi</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="reg-nim" className="form-label">NIM</label>
                <div className="input-container">
                  <input
                    id="reg-nim"
                    name="nim"
                    type="text"
                    className="form-input"
                    placeholder="Nomor Induk Mahasiswa"
                    value={formData.nim}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="reg-divisi" className="form-label">Divisi Pilihan</label>
                <div className="input-container">
                  <select
                    id="reg-divisi"
                    name="divisi"
                    className="form-select"
                    value={formData.divisi}
                    onChange={handleChange}
                    required
                  >
                    <option value="" disabled>Pilih divisi</option>
                    <option value="Divisi Acara & Kreatif">Divisi Acara & Kreatif</option>
                    <option value="Divisi Humas & Kemitraan">Divisi Humas & Kemitraan</option>
                    <option value="Divisi Logistik & Sarpras">Divisi Logistik & Sarpras</option>
                    <option value="Divisi Kesekretariatan">Divisi Kesekretariatan</option>
                    <option value="Divisi Media, Publikasi & IT">Divisi Media, Publikasi & IT</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="reg-email" className="form-label">Email</label>
              <div className="input-container">
                <input
                  id="reg-email"
                  name="email"
                  type="email"
                  className="form-input"
                  placeholder="nama@mahasiswa.ac.id"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="reg-password" className="form-label">Kata Sandi</label>
              <div className="input-container">
                <input
                  id="reg-password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  className="form-input"
                  placeholder="Minimal 8 karakter"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  autoComplete="new-password"
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

            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? (
                <>
                  <span className="spinner" style={{ display: 'inline-block' }}></span>
                  <span>Mengirim pendaftaran...</span>
                </>
              ) : (
                <span>Kirim Pendaftaran</span>
              )}
            </button>
          </form>

          <footer className="auth-footer">
            <p>
              Sudah punya akun?{' '}
              <button
                type="button"
                onClick={() => onNavigate('login')}
                className="auth-link"
                style={{ background: 'none', border: 'none', cursor: 'pointer', font: 'inherit' }}
              >
                Login sekarang
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
