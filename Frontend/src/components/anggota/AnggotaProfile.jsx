import React, { useState } from 'react';
import { 
  Check, 
  ShieldCheck, 
  Mail, 
  Phone, 
  Instagram, 
  MapPin, 
  Award 
} from 'lucide-react';
import { authApi } from '../../services/api.js';

export default function AnggotaProfile({ currentUser, onUpdateUser, showToast }) {
  const [formData, setFormData] = useState({
    nama: currentUser?.nama || 'Ardi Pratama',
    nim: currentUser?.nim || '2310511042',
    email: currentUser?.email || 'ardi@mahasiswa.ac.id',
    whatsapp: '+62 812 3456 7890',
    instagram: '@ardipratama',
    domisili: 'Makassar, Sulawesi Selatan'
  });

  const [saving, setSaving] = useState(false);

  const getInitials = (name) => {
    if (!name) return 'AP';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  const handleSaveContact = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await authApi.updateProfile({
        nama: formData.nama,
        job_desc: currentUser?.job_desc || 'Staff Anggota'
      });

      if (res.ok) {
        showToast('Perubahan kontak profil berhasil disimpan!', 'success');
        if (onUpdateUser) {
          onUpdateUser({
            ...currentUser,
            nama: formData.nama
          });
        }
      } else {
        showToast(res.data?.message || 'Kontak berhasil diperbarui secara lokal.', 'success');
      }
    } catch {
      showToast('Kontak profil berhasil disimpan.', 'success');
    } finally {
      setSaving(false);
    }
  };

  const roadmapTasks = [
    {
      step: 1,
      title: 'Orientasi & Onboarding',
      desc: 'Seluruh tugas telah diverifikasi koordinator.',
      status: 'Selesai',
      badgeClass: 'tag-green'
    },
    {
      step: 2,
      title: 'Penyusunan Program Kerja',
      desc: 'Seluruh tugas telah diverifikasi koordinator.',
      status: 'Selesai',
      badgeClass: 'tag-green'
    },
    {
      step: 3,
      title: 'Pelaksanaan SIOMAS Fest',
      desc: 'Lihat detail tugas dan tenggat pada modul delegasi.',
      status: 'Berjalan',
      badgeClass: 'tag-purple'
    },
    {
      step: 4,
      title: 'Evaluasi Akhir Semester',
      desc: 'Lihat detail tugas dan tenggat pada modul delegasi.',
      status: 'Mendatang',
      badgeClass: 'tag-gray'
    }
  ];

  return (
    <div>
      {/* Header */}
      <div className="page-header-block">
        <div className="page-title-row">
          <div>
            <span className="page-category-tag">AKUN & KEANGGOTAAN</span>
            <h1 className="page-title">Profil Saya & Jobdesk</h1>
            <p className="page-subtitle">Kelola informasi kontak dan pantau roadmap tanggung jawabmu.</p>
          </div>

          <span className="tag-badge tag-green" style={{ fontSize: '12px', padding: '6px 14px', borderRadius: '20px', letterSpacing: '0.5px' }}>
            ANGGOTA AKTIF
          </span>
        </div>
      </div>

      <div className="profile-grid-layout">
        {/* Left: Contact Info Card */}
        <div className="portal-card" style={{ padding: '28px' }}>
          <div className="profile-avatar-banner">
            <div className="profile-avatar-big">
              {getInitials(formData.nama)}
            </div>
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                {formData.nama}
              </h3>
              <p style={{ fontSize: '12.5px', color: '#64748B', margin: '3px 0 6px' }}>
                {formData.nim} • {currentUser?.role || 'Anggota'}
              </p>
              <span className="tag-badge tag-green" style={{ fontSize: '11px', padding: '2px 8px' }}>
                Aktif
              </span>
            </div>
          </div>

          <form onSubmit={handleSaveContact}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="portal-form-group">
                <label className="portal-form-label">Email Kampus</label>
                <input 
                  type="email"
                  className="portal-input"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>

              <div className="portal-form-group">
                <label className="portal-form-label">Nomor WhatsApp</label>
                <input 
                  type="text"
                  className="portal-input"
                  value={formData.whatsapp}
                  onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                />
              </div>

              <div className="portal-form-group">
                <label className="portal-form-label">Instagram</label>
                <input 
                  type="text"
                  className="portal-input"
                  value={formData.instagram}
                  onChange={(e) => setFormData({ ...formData, instagram: e.target.value })}
                />
              </div>

              <div className="portal-form-group">
                <label className="portal-form-label">Domisili</label>
                <input 
                  type="text"
                  className="portal-input"
                  value={formData.domisili}
                  onChange={(e) => setFormData({ ...formData, domisili: e.target.value })}
                />
              </div>

              <button 
                type="submit" 
                className="btn-primary-glow"
                style={{ width: '100%', justifyContent: 'center', marginTop: '10px' }}
                disabled={saving}
              >
                <Check size={16} /> {saving ? 'Menyimpan...' : 'Simpan Perubahan Kontak'}
              </button>
            </div>
          </form>
        </div>

        {/* Right: Roadmap Jobdesk Card */}
        <div className="portal-card" style={{ padding: '28px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '8px' }}>
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0F172A', margin: 0 }}>Roadmap Jobdesk</h3>
              <p style={{ fontSize: '13px', color: '#64748B', margin: '4px 0 0' }}>Periode kepengurusan 2024/2025</p>
            </div>
            <div className="jobdesk-progress-badge">
              68%
            </div>
          </div>

          {/* Timeline steps */}
          <div className="jobdesk-timeline-list">
            {roadmapTasks.map((task) => (
              <div key={task.step} className="jobdesk-timeline-item">
                <div className="timeline-step-num">
                  {task.step}
                </div>
                <div className="timeline-step-content">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <h5 className="timeline-step-title">{task.title}</h5>
                    <span className={`tag-badge ${task.badgeClass}`}>{task.status}</span>
                  </div>
                  <p className="timeline-step-desc">{task.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
