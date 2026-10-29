import React, { useState } from 'react';
import { FileText, Eye, Download, X, Check } from 'lucide-react';

const sipakamaseList = [
  {
    id: 1, nama: 'Sipakamase Oktober 2024', periode: 'Oktober 2024', penanggung: 'Bendahara', jumlahBerkas: 4, status: 'Review',
    dokumen: [
      { nama: 'Proposal Kegiatan Oktober', label: 'Proposal', size: '1.8 MB' },
      { nama: 'Surat Izin & Peminjaman', label: 'Surat', size: '640 KB' },
      { nama: 'LPJ Kegiatan Oktober', label: 'LPJ', size: '3.1 MB' },
      { nama: 'Rekap Keuangan Oktober', label: 'Keuangan', size: '3.2 MB' }
    ],
    checklist: ['Proposal kegiatan tersedia', 'Surat perizinan lengkap', 'LPJ telah ditandatangani', 'Rekap keuangan sesuai'],
    kelengkapan: '4 dari 4 dokumen'
  },
  {
    id: 2, nama: 'Sipakamase September 2024', periode: 'September 2024', penanggung: 'Sekretariat', jumlahBerkas: 3, status: 'Review',
    dokumen: [
      { nama: 'Proposal Kegiatan September', label: 'Proposal', size: '1.2 MB' },
      { nama: 'Surat Tugas', label: 'Surat', size: '320 KB' },
      { nama: 'LPJ September', label: 'LPJ', size: '2.4 MB' }
    ],
    checklist: ['Proposal kegiatan tersedia', 'Surat perizinan lengkap', 'LPJ telah ditandatangani'],
    kelengkapan: '3 dari 3 dokumen'
  }
];

const labelColors = {
  Proposal: { bg: '#ECFDF5', color: '#059669' },
  Surat: { bg: '#EFF6FF', color: '#3B82F6' },
  LPJ: { bg: '#EEF2FF', color: '#4F46E5' },
  Keuangan: { bg: '#FEF3C7', color: '#D97706' }
};

// Modal: Minta Perbaikan Sipakamase
function ModalMintaPerbaikan({ selected, onClose, onSubmit }) {
  const [dokumen, setDokumen] = useState('Rekap Keuangan Oktober');
  const [jenis, setJenis] = useState('Dokumen belum lengkap');
  const [catatan, setCatatan] = useState('');

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div style={{ background: '#fff', borderRadius: '16px', width: '100%', maxWidth: '480px', padding: '28px', boxShadow: '0 24px 60px -12px rgba(0,0,0,0.2)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 700 }}>Minta Perbaikan Sipakamase</h2>
            <p style={{ fontSize: '13px', color: '#64748B', marginTop: '2px' }}>Catatan akan dikirim kepada bendahara dan sekretariat.</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}><X size={20} /></button>
        </div>

        <div className="form-group" style={{ marginBottom: '14px' }}>
          <label className="form-label">Dokumen yang perlu diperbaiki</label>
          <select className="form-select" value={dokumen} onChange={e => setDokumen(e.target.value)}>
            {selected?.dokumen?.map(d => <option key={d.nama}>{d.nama}</option>)}
          </select>
        </div>

        <div className="form-group" style={{ marginBottom: '14px' }}>
          <label className="form-label">Jenis temuan</label>
          <select className="form-select" value={jenis} onChange={e => setJenis(e.target.value)}>
            <option>Dokumen belum lengkap</option>
            <option>Tanda tangan kurang</option>
            <option>Data keuangan tidak sesuai</option>
            <option>Format tidak valid</option>
          </select>
        </div>

        <div className="form-group" style={{ marginBottom: '24px' }}>
          <label className="form-label">Catatan Perbaikan</label>
          <textarea className="form-input" rows={4} placeholder="Jelaskan bagian yang perlu diperbaiki secara rinci..." value={catatan} onChange={e => setCatatan(e.target.value)} style={{ resize: 'none' }} />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button onClick={onClose} className="btn-secondary" style={{ width: 'auto', padding: '10px 20px' }}>Batal</button>
          <button className="btn-primary" style={{ width: 'auto', margin: 0 }} onClick={() => { onSubmit({ dokumen, jenis, catatan }); onClose(); }}>
            Kirim Catatan Perbaikan
          </button>
        </div>
      </div>
    </div>
  );
}

export default function KetuaVerifikasiSipakamase({ showToast }) {
  const [selected, setSelected] = useState(sipakamaseList[0]);
  const [showPerbaikan, setShowPerbaikan] = useState(false);
  const [approvedIds, setApprovedIds] = useState([]);

  const remaining = sipakamaseList.filter(s => !approvedIds.includes(s.id));

  return (
    <div>
      {showPerbaikan && (
        <ModalMintaPerbaikan
          selected={selected}
          onClose={() => setShowPerbaikan(false)}
          onSubmit={({ dokumen, jenis, catatan }) => showToast && showToast('Catatan perbaikan telah dikirim', 'success')}
        />
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '24px' }}>
        <div>
          <span style={{ fontSize: '12px', fontWeight: 700, color: '#4F46E5', letterSpacing: '0.06em', textTransform: 'uppercase' }}>KONSOL ADMIN • SIPAKAMASE</span>
          <h1 className="page-title">Verifikasi Dokumen Sipakamase</h1>
          <p className="page-subtitle">Periksa kelengkapan administrasi dan validasi bundel dokumen pertanggungjawaban organisasi.</p>
        </div>
        <span style={{ fontSize: '13px', fontWeight: 700, color: '#D97706' }}>{remaining.length} menunggu verifikasi</span>
      </div>

      {/* Status Banner */}
      {selected && (
        <div style={{ background: 'linear-gradient(135deg, #0F172A 0%, #1E1B4B 100%)', borderRadius: '14px', padding: '20px 28px', marginBottom: '20px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', color: '#fff', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '11px', color: '#94A3B8', marginBottom: '4px' }}>Periode bundel</div>
            <div style={{ fontSize: '20px', fontWeight: 700 }}>{selected.periode}</div>
          </div>
          <div>
            <div style={{ fontSize: '11px', color: '#94A3B8', marginBottom: '4px' }}>Kelengkapan</div>
            <div style={{ fontSize: '20px', fontWeight: 700 }}>{selected.kelengkapan}</div>
            <div style={{ height: '6px', background: 'rgba(255,255,255,0.2)', borderRadius: '999px', marginTop: '6px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: '100%', background: '#10B981', borderRadius: '999px' }} />
            </div>
          </div>
          <div>
            <div style={{ fontSize: '11px', color: '#94A3B8', marginBottom: '4px' }}>Status pemeriksaan</div>
            <span style={{ background: '#FEF3C7', color: '#D97706', fontSize: '12px', fontWeight: 700, padding: '4px 12px', borderRadius: '8px' }}>Dalam Peninjauan</span>
          </div>
        </div>
      )}

      {/* 3-Column */}
      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr 280px', gap: '20px' }}>
        {/* Antrian */}
        <div className="portal-card" style={{ padding: 0 }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #F1F5F9' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 700 }}>Antrean Sipakamase</h3>
            <p style={{ fontSize: '12px', color: '#94A3B8', marginTop: '2px' }}>Bundel terbaru</p>
          </div>
          {remaining.map(s => (
            <div
              key={s.id}
              onClick={() => setSelected(s)}
              style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '14px 16px', cursor: 'pointer', borderLeft: selected?.id === s.id ? '3px solid #4F46E5' : '3px solid transparent', borderBottom: '1px solid #F1F5F9', background: selected?.id === s.id ? '#F8FAFC' : 'transparent' }}
            >
              <div style={{ width: '36px', height: '36px', background: '#EEF2FF', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4F46E5', flexShrink: 0 }}>📁</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#0F172A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.nama}</div>
                <div style={{ fontSize: '12px', color: '#94A3B8' }}>{s.penanggung} • {s.jumlahBerkas} berkas</div>
              </div>
              <span style={{ background: '#FEF3C7', color: '#D97706', fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '6px', flexShrink: 0 }}>{s.status}</span>
            </div>
          ))}
        </div>

        {/* Isi Bundel */}
        <div className="portal-card" style={{ padding: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid #F1F5F9' }}>
            <div>
              <h3 style={{ fontSize: '15px', fontWeight: 700 }}>Isi Bundel Dokumen</h3>
              <p style={{ fontSize: '12px', color: '#94A3B8', marginTop: '2px' }}>{selected?.dokumen?.length} berkas • Total 8.7 MB</p>
            </div>
            <button style={{ background: 'none', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '6px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#64748B', fontFamily: 'inherit' }}>
              <Download size={14} /> Unduh Semua
            </button>
          </div>
          <div>
            {selected?.dokumen?.map((doc, i) => {
              const lc = labelColors[doc.label] || { bg: '#F1F5F9', color: '#64748B' };
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 20px', borderBottom: '1px solid #F8FAFC' }}>
                  <div style={{ width: '36px', height: '36px', background: '#FEE2E2', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#EF4444', flexShrink: 0 }}>
                    <FileText size={18} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '13.5px', fontWeight: 600, color: '#0F172A' }}>{doc.nama}</div>
                    <div style={{ fontSize: '11.5px', color: '#94A3B8', marginTop: '2px' }}>PDF • {doc.size} • Terunggah 18 Nov 2024</div>
                  </div>
                  <span style={{ background: lc.bg, color: lc.color, fontSize: '12px', fontWeight: 700, padding: '3px 10px', borderRadius: '6px' }}>{doc.label}</span>
                  <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B', padding: '4px' }}>
                    <Eye size={18} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Checklist & Actions */}
        <div className="portal-card" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#0F172A' }}>Checklist Verifikasi</h3>
            <p style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>Konfirmasi setiap persyaratan sebelum menyetujui bundel.</p>
          </div>

          {selected?.checklist?.map((item, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '20px', height: '20px', background: '#ECFDF5', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Check size={12} color="#10B981" strokeWidth={3} />
              </div>
              <span style={{ fontSize: '13px', color: '#0F172A' }}>{item}</span>
            </div>
          ))}

          <div style={{ background: '#EEF2FF', borderRadius: '10px', padding: '12px', display: 'flex', gap: '8px', alignItems: 'flex-start', marginTop: '4px' }}>
            <span style={{ fontSize: '16px' }}>🔒</span>
            <p style={{ fontSize: '12px', color: '#4F46E5' }}>Persetujuan akan memindahkan seluruh bundel ke Repository Vault.</p>
          </div>

          <button className="btn-primary" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '4px' }}
            onClick={() => {
              setApprovedIds(prev => [...prev, selected?.id]);
              showToast && showToast(`Sipakamase "${selected?.nama}" telah disetujui!`, 'success');
            }}>
            <Check size={16} /> Setujui Sipakamase
          </button>

          <button onClick={() => setShowPerbaikan(true)} style={{
            background: 'none', border: '1.5px solid #E2E8F0', borderRadius: '10px', padding: '11px 20px',
            cursor: 'pointer', fontSize: '13.5px', fontWeight: 600, fontFamily: 'inherit', color: '#64748B',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
          }}>
            ✏️ Minta Perbaikan
          </button>
        </div>
      </div>
    </div>
  );
}
