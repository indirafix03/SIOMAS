import React, { useState } from 'react';
import { Users, CheckSquare, Calendar, Eye, X } from 'lucide-react';

// Modal Buat Delegasi Tugas Baru
function ModalBuatDelegasi({ onClose, onSave, showToast }) {
  const [form, setForm] = useState({
    judulTugas: '',
    deskripsiTugas: '',
    delegasikanKepada: '',
    prioritas: 'Normal',
    tanggalMulai: '',
    tenggat: '',
    fileName: '',
    kirimNotifikasi: true
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.judulTugas.trim()) {
      showToast('Harap isi Judul Tugas.', 'warning');
      return;
    }
    if (!form.delegasikanKepada) {
      showToast('Harap pilih anggota penerima tugas.', 'warning');
      return;
    }
    onSave(form);
    showToast(`Tugas "${form.judulTugas}" berhasil didelegasikan ke ${form.delegasikanKepada}.`, 'success');
    onClose();
  };

  return (
    <div className="portal-modal-backdrop" onClick={onClose}>
      <div className="portal-modal-dialog wide" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '560px' }}>
        <div className="portal-modal-header">
          <div>
            <h3 className="portal-modal-title">Buat Delegasi Tugas Baru</h3>
            <p className="portal-modal-subtitle">Tetapkan tanggung jawab, penerima tugas, dan tenggat penyelesaian.</p>
          </div>
          <button type="button" className="portal-modal-close-btn" onClick={onClose}><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="portal-modal-body">
            {/* Judul Tugas */}
            <div className="portal-form-group">
              <label className="portal-form-label">Judul Tugas</label>
              <input
                type="text"
                className="portal-input"
                placeholder="Contoh: Persiapan perlengkapan acara"
                value={form.judulTugas}
                onChange={(e) => setForm({ ...form, judulTugas: e.target.value })}
                required
              />
            </div>

            {/* Deskripsi Tugas */}
            <div className="portal-form-group">
              <label className="portal-form-label">Deskripsi Tugas</label>
              <textarea
                className="portal-textarea"
                rows="3"
                placeholder="Jelaskan hasil yang diharapkan, ruang lingkup, dan instruksi pengerjaan..."
                value={form.deskripsiTugas}
                onChange={(e) => setForm({ ...form, deskripsiTugas: e.target.value })}
              />
            </div>

            {/* Delegasikan Kepada & Prioritas */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="portal-form-group">
                <label className="portal-form-label">Delegasikan Kepada</label>
                <select className="portal-select" value={form.delegasikanKepada} onChange={(e) => setForm({ ...form, delegasikanKepada: e.target.value })}>
                  <option value="">Pilih anggota divisi</option>
                  <option value="Dewi Lestari">Dewi Lestari</option>
                  <option value="Made Arya">Made Arya</option>
                  <option value="Rafi Akbar">Rafi Akbar</option>
                  <option value="Putri Maharani">Putri Maharani</option>
                  <option value="Bagus Hartana">Bagus Hartana</option>
                </select>
              </div>
              <div className="portal-form-group">
                <label className="portal-form-label">Prioritas</label>
                <select className="portal-select" value={form.prioritas} onChange={(e) => setForm({ ...form, prioritas: e.target.value })}>
                  <option>Normal</option>
                  <option>Tinggi</option>
                  <option>Mendesak</option>
                  <option>Rendah</option>
                </select>
              </div>
            </div>

            {/* Tanggal */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="portal-form-group">
                <label className="portal-form-label">Tanggal Mulai</label>
                <input type="date" className="portal-input" value={form.tanggalMulai} onChange={(e) => setForm({ ...form, tanggalMulai: e.target.value })} />
              </div>
              <div className="portal-form-group">
                <label className="portal-form-label">Tenggat Waktu</label>
                <input type="date" className="portal-input" value={form.tenggat} onChange={(e) => setForm({ ...form, tenggat: e.target.value })} />
              </div>
            </div>

            {/* Lampiran */}
            <div className="portal-dropzone">
              <div className="dropzone-left">
                <div className="dropzone-icon"><X size={18} style={{ display: 'none' }} /><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg></div>
                <div className="dropzone-text">
                  <h5>Lampirkan dokumen pendukung</h5>
                  <p>{form.fileName || 'PDF, DOCX, atau gambar • Maksimal 10 MB'}</p>
                </div>
              </div>
              <button
                type="button"
                className="portal-outline-btn"
                style={{ width: 'auto', padding: '7px 16px', fontSize: '12.5px' }}
                onClick={() => { setForm({ ...form, fileName: 'Dokumen_Pendukung.pdf' }); showToast('Berkas berhasil dipilih.', 'success'); }}
              >
                Pilih Berkas
              </button>
            </div>

            {/* Notifikasi Checkbox */}
            <div style={{ background: '#FFFBEB', border: '1px solid #FEF3C7', borderRadius: '12px', padding: '14px 16px', display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
              <input
                type="checkbox"
                id="pd_notif_delegasi"
                checked={form.kirimNotifikasi}
                onChange={(e) => setForm({ ...form, kirimNotifikasi: e.target.checked })}
                style={{ marginTop: '3px', width: '16px', height: '16px', cursor: 'pointer' }}
              />
              <label htmlFor="pd_notif_delegasi" style={{ fontSize: '13px', color: '#92400E', cursor: 'pointer', lineHeight: '1.4' }}>
                <strong>Kirim notifikasi kepada penerima tugas</strong>
                <div style={{ fontSize: '12px', color: '#B45309', marginTop: '2px' }}>
                  Anggota akan menerima pemberitahuan beserta detail tenggat.
                </div>
              </label>
            </div>
          </div>

          <div className="portal-modal-footer">
            <button type="button" className="btn-secondary" style={{ width: 'auto', padding: '9px 18px' }} onClick={onClose}>Batal</button>
            <button type="submit" className="btn-primary-glow" style={{ padding: '9px 22px' }}>
              <CheckSquare size={16} style={{ marginRight: '6px' }} /> Simpan Delegasi
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function PDDasbor({ onNavigate, showToast }) {
  const [showModalDelegasi, setShowModalDelegasi] = useState(false);
  const [tasks, setTasks] = useState([
    { id: 1, title: 'Finalisasi Rundown SIOMAS Fest', assignee: 'Dewi Lestari', deadline: 'Hari ini', deadlineClass: 'deadline-red', done: false },
    { id: 2, title: 'Konfirmasi Vendor Panggung', assignee: 'Made Arya', deadline: 'Besok', deadlineClass: 'deadline-orange', done: false },
    { id: 3, title: 'Briefing Volunteer', assignee: 'Rafi Akbar', deadline: '22 Nov', deadlineClass: 'deadline-blue', done: false }
  ]);

  const toggleTask = (id) => {
    setTasks(tasks.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
  };

  const handleSaveDelegasi = (data) => {
    const newTask = {
      id: tasks.length + 1,
      title: data.judulTugas,
      assignee: data.delegasikanKepada,
      deadline: data.tenggat || 'TBD',
      deadlineClass: 'deadline-blue',
      done: false
    };
    setTasks([...tasks, newTask]);
  };

  return (
    <div>
      {/* Hero Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #064E3B 0%, #065F46 60%, #0F172A 100%)',
        borderRadius: '16px',
        padding: '36px 40px',
        marginBottom: '28px',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{ position: 'absolute', top: '-40px', right: '-40px', width: '200px', height: '200px', background: 'rgba(16, 185, 129, 0.15)', borderRadius: '50%' }} />
        <div style={{ position: 'absolute', bottom: '-60px', right: '80px', width: '150px', height: '150px', background: 'rgba(6, 95, 70, 0.3)', borderRadius: '50%' }} />
        <span style={{ background: '#10B981', color: '#fff', fontSize: '11px', fontWeight: 700, padding: '4px 10px', borderRadius: '20px', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
          Divisi Acara
        </span>
        <h1 style={{ fontSize: '32px', fontWeight: 800, color: '#fff', margin: '12px 0 8px' }}>
          Halo, Koordinator Ardi
        </h1>
        <p style={{ color: '#A7F3D0', fontSize: '14px', margin: 0 }}>
          4 tugas membutuhkan perhatian dan tingkat kehadiran divisi berada di 89% bulan ini.
        </p>
        <button
          type="button"
          className="btn-primary-glow"
          style={{ position: 'absolute', right: '40px', top: '50%', transform: 'translateY(-50%)', padding: '12px 22px', background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(6px)', border: '1px solid rgba(255,255,255,0.25)' }}
          onClick={() => onNavigate('pd-delegasi')}
        >
          <Users size={16} /> Atur Delegasi Tugas &amp; Presensi
        </button>
      </div>

      {/* 4 Stat Cards */}
      <div className="portal-stats-grid" style={{ marginBottom: '28px' }}>
        <div className="portal-stat-card">
          <div className="portal-stat-icon-wrap" style={{ background: '#EEF2FF', color: '#6366F1' }}>
            <Users size={22} />
          </div>
          <div className="portal-stat-info">
            <span className="portal-stat-label">Anggota divisi</span>
            <span className="portal-stat-number">18</span>
          </div>
        </div>
        <div className="portal-stat-card">
          <div className="portal-stat-icon-wrap" style={{ background: '#DCFCE7', color: '#10B981' }}>
            <CheckSquare size={22} />
          </div>
          <div className="portal-stat-info">
            <span className="portal-stat-label">Tugas berjalan</span>
            <span className="portal-stat-number">9</span>
          </div>
        </div>
        <div className="portal-stat-card">
          <div className="portal-stat-icon-wrap" style={{ background: '#FEF9C3', color: '#CA8A04' }}>
            <Calendar size={22} />
          </div>
          <div className="portal-stat-info">
            <span className="portal-stat-label">Agenda minggu ini</span>
            <span className="portal-stat-number">4</span>
          </div>
        </div>
        <div className="portal-stat-card">
          <div className="portal-stat-icon-wrap" style={{ background: '#F0FFFE', color: '#0D9488' }}>
            <Eye size={22} />
          </div>
          <div className="portal-stat-info">
            <span className="portal-stat-label">Kehadiran</span>
            <span className="portal-stat-number">89%</span>
          </div>
        </div>
      </div>

      {/* Two Column Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '24px' }}>
        {/* Left: Prioritas Divisi */}
        <div className="portal-card">
          <div className="portal-card-header">
            <div>
              <h3 className="portal-card-title">Prioritas Divisi</h3>
              <p className="portal-card-subtitle">Tenggat terdekat</p>
            </div>
            <button
              type="button"
              className="btn-primary-glow"
              style={{ padding: '8px 16px', fontSize: '13px' }}
              onClick={() => setShowModalDelegasi(true)}
            >
              <CheckSquare size={14} /> + Tugas Baru
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {tasks.map((task) => (
              <div key={task.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #F1F5F9' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <button
                    type="button"
                    onClick={() => toggleTask(task.id)}
                    style={{
                      width: '20px', height: '20px',
                      borderRadius: '5px',
                      border: `2px solid ${task.done ? '#10B981' : '#CBD5E1'}`,
                      background: task.done ? '#10B981' : 'transparent',
                      cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0
                    }}
                  >
                    {task.done && <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                  </button>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: task.done ? '#94A3B8' : '#0F172A', textDecoration: task.done ? 'line-through' : 'none' }}>
                      {task.title}
                    </div>
                    <div style={{ fontSize: '12px', color: '#64748B' }}>Ditugaskan kepada {task.assignee}</div>
                  </div>
                </div>
                <span style={{ fontSize: '12px', fontWeight: 600, padding: '3px 10px', borderRadius: '20px', background: task.deadlineClass === 'deadline-red' ? '#FEE2E2' : task.deadlineClass === 'deadline-orange' ? '#FFEDD5' : '#EFF6FF', color: task.deadlineClass === 'deadline-red' ? '#DC2626' : task.deadlineClass === 'deadline-orange' ? '#D97706' : '#3B82F6' }}>
                  {task.deadline}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Presensi terkini */}
        <div className="portal-card" style={{ textAlign: 'center' }}>
          <h3 className="portal-card-title" style={{ textAlign: 'center', marginBottom: '20px' }}>Presensi terkini</h3>
          {/* Donut Chart */}
          <div style={{ position: 'relative', width: '140px', height: '140px', margin: '0 auto 16px' }}>
            <svg width="140" height="140" viewBox="0 0 140 140">
              <circle cx="70" cy="70" r="55" fill="none" stroke="#E2E8F0" strokeWidth="18" />
              <circle cx="70" cy="70" r="55" fill="none" stroke="#6366F1" strokeWidth="18"
                strokeDasharray={`${2 * Math.PI * 55 * 0.89} ${2 * Math.PI * 55 * 0.11}`}
                strokeDashoffset={2 * Math.PI * 55 * 0.25}
                strokeLinecap="round"
              />
            </svg>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: '24px', fontWeight: 800, color: '#0F172A' }}>89%</span>
              <span style={{ fontSize: '11px', color: '#64748B' }}>Kehadiran</span>
            </div>
          </div>
          <p style={{ fontSize: '13px', color: '#64748B', marginBottom: '20px' }}>
            16 dari 18 anggota hadir pada agenda terakhir.
          </p>
          <button type="button" className="portal-outline-btn" onClick={() => onNavigate('pd-delegasi')}>
            Buka Modul Presensi
          </button>
        </div>
      </div>

      {/* Modal Delegasi */}
      {showModalDelegasi && (
        <ModalBuatDelegasi
          onClose={() => setShowModalDelegasi(false)}
          onSave={handleSaveDelegasi}
          showToast={showToast}
        />
      )}
    </div>
  );
}
