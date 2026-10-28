import React, { useState } from 'react';

export default function PDProfile({ currentUser, showToast }) {
  const [form, setForm] = useState({
    email: currentUser?.email || 'ardi@mahasiswa.ac.id',
    whatsapp: '+62 812 3456 7890',
    instagram: '@ardipratama',
    domisili: 'Denpasar, Bali'
  });

  const nama = currentUser?.nama || 'Ardi Pratama';
  const nim = currentUser?.nim || '2310511042';
  const getInitials = (name) => {
    const parts = name.trim().split(' ');
    return parts.length >= 2 ? (parts[0][0] + parts[1][0]).toUpperCase() : name.slice(0, 2).toUpperCase();
  };

  const jobdeskItems = [
    { num: 1, title: 'Orientasi & Onboarding', desc: 'Seluruh tugas telah diverifikasi koordinator.', status: 'Selesai', statusClass: 'status-green' },
    { num: 2, title: 'Penyusunan Program Kerja', desc: 'Seluruh tugas telah diverifikasi koordinator.', status: 'Selesai', statusClass: 'status-green' },
    { num: 3, title: 'Pelaksanaan SIOMAS Fest', desc: 'Lihat detail tugas dan tenggat pada modul delegasi.', status: 'Berjalan', statusClass: 'status-blue' },
    { num: 4, title: 'Evaluasi Akhir Semester', desc: 'Lihat detail tugas dan tenggat pada modul delegasi.', status: 'Mendatang', statusClass: 'status-gray' }
  ];

  const completedCount = jobdeskItems.filter((j) => j.status === 'Selesai').length;
  const completedPct = Math.round((completedCount / jobdeskItems.length) * 100);

  const handleSave = () => {
    showToast('Perubahan kontak berhasil disimpan.', 'success');
  };

  return (
    <div>
      {/* Header */}
      <div className="page-header-block" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <span style={{ fontSize: '12px', fontWeight: 700, color: '#6366F1', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '4px' }}>
            AKUN &amp; KEANGGOTAAN
          </span>
          <h1 className="page-title">Profil Saya &amp; Jobdesk</h1>
          <p className="page-subtitle">Kelola informasi kontak dan pantau roadmap tanggung jawabmu.</p>
        </div>
        <span style={{ fontSize: '12px', fontWeight: 700, padding: '5px 14px', borderRadius: '20px', background: '#DCFCE7', color: '#16A34A' }}>
          ANGGOTA AKTIF
        </span>
      </div>

      {/* Two-column layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        {/* Left: Profile Info */}
        <div className="portal-card" style={{ padding: '28px' }}>
          {/* Avatar & Info */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '18px', marginBottom: '28px' }}>
            <div style={{ width: '68px', height: '68px', borderRadius: '16px', background: 'linear-gradient(135deg, #6366F1, #4F46E5)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '22px', fontWeight: 800, flexShrink: 0 }}>
              {getInitials(nama)}
            </div>
            <div>
              <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#0F172A', margin: '0 0 4px' }}>{nama}</h3>
              <p style={{ fontSize: '13px', color: '#64748B', margin: '0 0 8px' }}>{nim} • Pengurus Divisi</p>
              <span style={{ fontSize: '12px', fontWeight: 700, padding: '3px 12px', borderRadius: '20px', background: '#DCFCE7', color: '#16A34A' }}>
                Aktif
              </span>
            </div>
          </div>

          {/* Form Fields */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="portal-form-group">
              <label className="portal-form-label">Email Kampus</label>
              <input className="portal-input" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div className="portal-form-group">
              <label className="portal-form-label">Nomor WhatsApp</label>
              <input className="portal-input" type="tel" value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} />
            </div>
            <div className="portal-form-group">
              <label className="portal-form-label">Instagram</label>
              <input className="portal-input" value={form.instagram} onChange={(e) => setForm({ ...form, instagram: e.target.value })} />
            </div>
            <div className="portal-form-group">
              <label className="portal-form-label">Domisili</label>
              <input className="portal-input" value={form.domisili} onChange={(e) => setForm({ ...form, domisili: e.target.value })} />
            </div>
          </div>

          <button type="button" className="btn-primary-glow" style={{ width: '100%', justifyContent: 'center', marginTop: '24px', padding: '13px' }} onClick={handleSave}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '7px' }}><path d="M20 6L9 17l-5-5" /></svg>
            Simpan Perubahan Kontak
          </button>
        </div>

        {/* Right: Roadmap Jobdesk */}
        <div className="portal-card" style={{ padding: '28px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
            <div>
              <h3 className="portal-card-title">Roadmap Jobdesk</h3>
              <p className="portal-card-subtitle">Periode kepengurusan 2024/2025</p>
            </div>
            <span style={{ fontSize: '22px', fontWeight: 800, color: '#6366F1' }}>{completedPct}%</span>
          </div>

          {/* Progress Bar */}
          <div style={{ background: '#E2E8F0', borderRadius: '10px', height: '6px', marginBottom: '24px', overflow: 'hidden' }}>
            <div style={{ width: `${completedPct}%`, height: '100%', background: 'linear-gradient(90deg, #6366F1, #8B5CF6)', borderRadius: '10px', transition: 'width 0.5s ease' }} />
          </div>

          {/* Jobdesk List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            {jobdeskItems.map((item) => (
              <div key={item.num} style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', padding: '14px 0', borderBottom: '1px solid #F1F5F9' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: item.status === 'Selesai' ? '#DCFCE7' : item.status === 'Berjalan' ? '#EEF2FF' : '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700, color: item.status === 'Selesai' ? '#16A34A' : item.status === 'Berjalan' ? '#6366F1' : '#94A3B8', flexShrink: 0 }}>
                  {item.num}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: '#0F172A', marginBottom: '3px' }}>{item.title}</div>
                  <div style={{ fontSize: '12px', color: '#64748B' }}>{item.desc}</div>
                </div>
                <span style={{
                  fontSize: '11px', fontWeight: 700, padding: '3px 10px', borderRadius: '20px', whiteSpace: 'nowrap',
                  background: item.status === 'Selesai' ? '#DCFCE7' : item.status === 'Berjalan' ? '#EEF2FF' : '#F1F5F9',
                  color: item.status === 'Selesai' ? '#16A34A' : item.status === 'Berjalan' ? '#6366F1' : '#94A3B8'
                }}>
                  {item.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
