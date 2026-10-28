import React, { useState } from 'react';
import { CheckSquare, Plus } from 'lucide-react';

const MEMBERS = [
  { id: 1, name: 'Dewi Lestari', initials: 'De', color: '#6366F1' },
  { id: 2, name: 'Made Arya', initials: 'Ma', color: '#10B981' },
  { id: 3, name: 'Rafi Akbar', initials: 'Ra', color: '#F59E0B' },
  { id: 4, name: 'Putri Maharani', initials: 'Pu', color: '#EF4444' }
];

const STATUS_OPTIONS = ['Hadir', 'Izin', 'Sakit', 'Alpha'];
const STATUS_STYLES = {
  Hadir: { bg: '#DCFCE7', color: '#16A34A' },
  Izin: { bg: '#FFFBEB', color: '#D97706' },
  Sakit: { bg: '#EFF6FF', color: '#3B82F6' },
  Alpha: { bg: '#FEE2E2', color: '#DC2626' }
};

export default function PDDelegasi({ showToast }) {
  const [tasks, setTasks] = useState([
    { id: 1, title: 'Rundown acara final', assignee: 'Dewi Lestari', deadline: '18 Nov', deadlineClass: 'deadline-red', done: true },
    { id: 2, title: 'Koordinasi vendor', assignee: 'Made Arya', deadline: '19 Nov', deadlineClass: 'deadline-gray', done: false },
    { id: 3, title: 'Briefing volunteer', assignee: 'Rafi Akbar', deadline: '21 Nov', deadlineClass: 'deadline-blue', done: true },
    { id: 4, title: 'Dokumentasi kegiatan', assignee: 'Putri Maharani', deadline: '24 Nov', deadlineClass: 'deadline-gray', done: false }
  ]);

  const [presensi, setPresensi] = useState(
    MEMBERS.map((m) => ({ ...m, status: 'Hadir' }))
  );

  const [showModalDelegasi, setShowModalDelegasi] = useState(false);
  const [formDelegasi, setFormDelegasi] = useState({
    judulTugas: '',
    deskripsiTugas: '',
    delegasikanKepada: '',
    prioritas: 'Normal',
    tanggalMulai: '',
    tenggat: '',
    kirimNotifikasi: true
  });

  const toggleTask = (id) => {
    setTasks(tasks.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
  };

  const updatePresensi = (memberId, newStatus) => {
    setPresensi(presensi.map((m) => (m.id === memberId ? { ...m, status: newStatus } : m)));
  };

  const handleSimpanPresensi = () => {
    showToast('Presensi rapat divisi berhasil disimpan.', 'success');
  };

  const handleSaveDelegasi = (e) => {
    e.preventDefault();
    if (!formDelegasi.judulTugas.trim() || !formDelegasi.delegasikanKepada) {
      showToast('Harap isi judul tugas dan pilih penerima.', 'warning');
      return;
    }
    const newTask = {
      id: tasks.length + 1,
      title: formDelegasi.judulTugas,
      assignee: formDelegasi.delegasikanKepada,
      deadline: formDelegasi.tenggat || 'TBD',
      deadlineClass: 'deadline-blue',
      done: false
    };
    setTasks([...tasks, newTask]);
    showToast(`Tugas "${formDelegasi.judulTugas}" berhasil didelegasikan ke ${formDelegasi.delegasikanKepada}.`, 'success');
    setShowModalDelegasi(false);
    setFormDelegasi({ judulTugas: '', deskripsiTugas: '', delegasikanKepada: '', prioritas: 'Normal', tanggalMulai: '', tenggat: '', kirimNotifikasi: true });
  };

  const hadirCount = presensi.filter((m) => m.status === 'Hadir').length;
  const hadirPct = Math.round((hadirCount / MEMBERS.length) * 100);

  return (
    <div>
      {/* Header */}
      <div className="page-header-block">
        <div className="page-title-row" style={{ alignItems: 'flex-end' }}>
          <div>
            <span className="page-category-tag">MODUL KOORDINATOR</span>
            <h1 className="page-title">Delegasi Tugas &amp; Presensi</h1>
            <p className="page-subtitle">Distribusikan tanggung jawab dan catat kehadiran anggota divisi.</p>
          </div>
          <button type="button" className="btn-primary-glow" onClick={() => setShowModalDelegasi(true)}>
            <Plus size={15} style={{ marginRight: '5px' }} /> Buat Tugas Baru
          </button>
        </div>
      </div>

      {/* Two-column grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        {/* Left: Board Tugas Divisi */}
        <div className="portal-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
            <div>
              <h3 className="portal-card-title">Board Tugas Divisi</h3>
              <p className="portal-card-subtitle">{tasks.length} tugas • {tasks.filter((t) => t.done).length} selesai</p>
            </div>
            <span style={{ fontSize: '11px', fontWeight: 700, padding: '4px 12px', borderRadius: '20px', background: '#EEF2FF', color: '#6366F1' }}>
              MINGGU INI
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            {tasks.map((task) => (
              <div key={task.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0', borderBottom: '1px solid #F1F5F9' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <button
                    type="button"
                    onClick={() => toggleTask(task.id)}
                    style={{
                      width: '22px', height: '22px', borderRadius: '6px',
                      border: `2px solid ${task.done ? '#10B981' : '#CBD5E1'}`,
                      background: task.done ? '#10B981' : 'transparent',
                      cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
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
                <span style={{
                  fontSize: '12px', fontWeight: 600, padding: '3px 10px', borderRadius: '20px',
                  background: task.deadlineClass === 'deadline-red' ? '#FEE2E2' : task.deadlineClass === 'deadline-blue' ? '#EFF6FF' : '#F1F5F9',
                  color: task.deadlineClass === 'deadline-red' ? '#DC2626' : task.deadlineClass === 'deadline-blue' ? '#3B82F6' : '#64748B',
                  whiteSpace: 'nowrap'
                }}>
                  {task.deadline}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Presensi Rapat Divisi */}
        <div className="portal-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
            <div>
              <h3 className="portal-card-title">Presensi Rapat Divisi</h3>
              <p className="portal-card-subtitle">18 November 2024 • 15:30 WITA</p>
            </div>
            <span style={{ fontSize: '11px', fontWeight: 700, padding: '4px 12px', borderRadius: '20px', background: '#DCFCE7', color: '#16A34A' }}>
              {hadirPct}% HADIR
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            {presensi.map((member) => {
              const st = STATUS_STYLES[member.status] || STATUS_STYLES['Hadir'];
              return (
                <div key={member.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #F1F5F9' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: member.color + '22', color: member.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 700 }}>
                      {member.initials}
                    </div>
                    <span style={{ fontSize: '14px', fontWeight: 600, color: '#0F172A' }}>{member.name}</span>
                  </div>

                  <select
                    value={member.status}
                    onChange={(e) => updatePresensi(member.id, e.target.value)}
                    style={{
                      padding: '6px 12px', borderRadius: '8px', border: 'none',
                      background: st.bg, color: st.color,
                      fontSize: '13px', fontWeight: 600, cursor: 'pointer',
                      outline: 'none', appearance: 'none',
                      paddingRight: '28px',
                      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='${encodeURIComponent(st.color)}' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,
                      backgroundRepeat: 'no-repeat',
                      backgroundPosition: 'right 8px center'
                    }}
                  >
                    {STATUS_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
              );
            })}
          </div>

          <button
            type="button"
            className="btn-primary-glow"
            style={{ width: '100%', justifyContent: 'center', marginTop: '20px', padding: '13px' }}
            onClick={handleSimpanPresensi}
          >
            <CheckSquare size={16} style={{ marginRight: '7px' }} /> Simpan Presensi
          </button>
        </div>
      </div>

      {/* Modal Delegasi */}
      {showModalDelegasi && (
        <div className="portal-modal-backdrop" onClick={() => setShowModalDelegasi(false)}>
          <div className="portal-modal-dialog wide" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '520px' }}>
            <div className="portal-modal-header">
              <div>
                <h3 className="portal-modal-title">Buat Delegasi Tugas Baru</h3>
                <p className="portal-modal-subtitle">Tetapkan tanggung jawab, penerima tugas, dan tenggat penyelesaian.</p>
              </div>
              <button type="button" className="portal-modal-close-btn" onClick={() => setShowModalDelegasi(false)}>✕</button>
            </div>
            <form onSubmit={handleSaveDelegasi}>
              <div className="portal-modal-body">
                <div className="portal-form-group">
                  <label className="portal-form-label">Judul Tugas</label>
                  <input className="portal-input" placeholder="Contoh: Persiapan perlengkapan acara" value={formDelegasi.judulTugas} onChange={(e) => setFormDelegasi({ ...formDelegasi, judulTugas: e.target.value })} required />
                </div>
                <div className="portal-form-group">
                  <label className="portal-form-label">Deskripsi Tugas</label>
                  <textarea className="portal-textarea" rows="3" placeholder="Jelaskan hasil yang diharapkan..." value={formDelegasi.deskripsiTugas} onChange={(e) => setFormDelegasi({ ...formDelegasi, deskripsiTugas: e.target.value })} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="portal-form-group">
                    <label className="portal-form-label">Delegasikan Kepada</label>
                    <select className="portal-select" value={formDelegasi.delegasikanKepada} onChange={(e) => setFormDelegasi({ ...formDelegasi, delegasikanKepada: e.target.value })}>
                      <option value="">Pilih anggota divisi</option>
                      {MEMBERS.map((m) => <option key={m.id} value={m.name}>{m.name}</option>)}
                    </select>
                  </div>
                  <div className="portal-form-group">
                    <label className="portal-form-label">Prioritas</label>
                    <select className="portal-select" value={formDelegasi.prioritas} onChange={(e) => setFormDelegasi({ ...formDelegasi, prioritas: e.target.value })}>
                      <option>Normal</option>
                      <option>Tinggi</option>
                      <option>Mendesak</option>
                    </select>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="portal-form-group">
                    <label className="portal-form-label">Tanggal Mulai</label>
                    <input type="date" className="portal-input" value={formDelegasi.tanggalMulai} onChange={(e) => setFormDelegasi({ ...formDelegasi, tanggalMulai: e.target.value })} />
                  </div>
                  <div className="portal-form-group">
                    <label className="portal-form-label">Tenggat Waktu</label>
                    <input type="date" className="portal-input" value={formDelegasi.tenggat} onChange={(e) => setFormDelegasi({ ...formDelegasi, tenggat: e.target.value })} />
                  </div>
                </div>
                <div style={{ background: '#FFFBEB', border: '1px solid #FEF3C7', borderRadius: '12px', padding: '14px 16px', display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                  <input type="checkbox" id="pd_del_notif" checked={formDelegasi.kirimNotifikasi} onChange={(e) => setFormDelegasi({ ...formDelegasi, kirimNotifikasi: e.target.checked })} style={{ marginTop: '3px', width: '16px', height: '16px', cursor: 'pointer' }} />
                  <label htmlFor="pd_del_notif" style={{ fontSize: '13px', color: '#92400E', cursor: 'pointer', lineHeight: '1.4' }}>
                    <strong>Kirim notifikasi kepada penerima tugas</strong>
                    <div style={{ fontSize: '12px', color: '#B45309', marginTop: '2px' }}>Anggota akan menerima pemberitahuan beserta detail tenggat.</div>
                  </label>
                </div>
              </div>
              <div className="portal-modal-footer">
                <button type="button" className="btn-secondary" style={{ width: 'auto', padding: '9px 18px' }} onClick={() => setShowModalDelegasi(false)}>Batal</button>
                <button type="submit" className="btn-primary-glow" style={{ padding: '9px 22px' }}>
                  <CheckSquare size={15} style={{ marginRight: '6px' }} /> Simpan Delegasi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
