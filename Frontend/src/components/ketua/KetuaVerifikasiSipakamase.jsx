import React, { useState, useEffect } from 'react';
import { FileText, Download, X, Check } from 'lucide-react';
import { sipakamaseApi, documentsApi } from '../../services/api.js';

// Modal: Minta Perbaikan Sipakamase (dengan Checkbox Multi-Poin Revisi)
const SIPAKAMASE_REVISI_POINTS = [
  'Kelengkapan Berkas Administrasi Sipakamase',
  'Tanda Tangan Pejabat / Ketua & Stempel Resmi',
  'Kesesuaian Rekapitulasi Data Keuangan & Bukti Nota',
  'Surat Pengantar & Identitas Organisasi',
  'Format Bundel Dokumen & Urutan Lampiran',
  'Dokumentasi & Daftar Hadir Kegiatan'
];

function ModalMintaPerbaikan({ selected, onClose, onSubmit, showToast }) {
  const [selectedPoints, setSelectedPoints] = useState(['Kelengkapan Berkas Administrasi Sipakamase']);
  const [catatan, setCatatan] = useState('');

  const togglePoint = (pt) => {
    setSelectedPoints((prev) =>
      prev.includes(pt) ? prev.filter((item) => item !== pt) : [...prev, pt]
    );
  };

  const handleConfirm = () => {
    if (selectedPoints.length === 0) {
      showToast && showToast('Pilih minimal satu poin temuan perbaikan Sipakamase.', 'warning');
      return;
    }
    onSubmit({ jenis: selectedPoints.join(', '), selectedPoints, catatan });
    onClose();
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}>
      <div style={{ background: '#fff', borderRadius: '16px', width: '100%', maxWidth: '520px', padding: '28px', boxShadow: '0 24px 60px -12px rgba(0,0,0,0.2)', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '18px' }}>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 700 }}>Minta Perbaikan Sipakamase</h2>
            <p style={{ fontSize: '13px', color: '#64748B', marginTop: '2px' }}>Centang poin-poin temuan yang perlu diperbaiki oleh pengurus.</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}><X size={20} /></button>
        </div>

        <div className="form-group" style={{ marginBottom: '16px' }}>
          <label className="form-label" style={{ marginBottom: '8px', display: 'block' }}>
            Poin Temuan yang Perlu Diperbaiki <span style={{ color: '#EF4444' }}>*</span>
          </label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', background: '#F8FAFC', padding: '12px 14px', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
            {SIPAKAMASE_REVISI_POINTS.map((pt) => {
              const isChecked = selectedPoints.includes(pt);
              return (
                <label
                  key={pt}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: isChecked ? 600 : 500,
                    color: isChecked ? '#0F172A' : '#475569',
                    padding: '4px 2px'
                  }}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => togglePoint(pt)}
                    style={{ width: '16px', height: '16px', accentColor: '#4F46E5', cursor: 'pointer' }}
                  />
                  <span>{pt}</span>
                </label>
              );
            })}
          </div>
        </div>

        <div className="form-group" style={{ marginBottom: '24px' }}>
          <label className="form-label">Catatan Perbaikan Tambahan</label>
          <textarea
            className="form-input"
            rows={4}
            placeholder="Jelaskan bagian yang perlu diperbaiki secara rinci..."
            value={catatan}
            onChange={e => setCatatan(e.target.value)}
            style={{ resize: 'none' }}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button onClick={onClose} className="btn-secondary" style={{ width: 'auto', padding: '10px 20px' }}>Batal</button>
          <button className="btn-primary" style={{ width: 'auto', margin: 0 }} onClick={handleConfirm}>
            Kirim Catatan Perbaikan ({selectedPoints.length} Poin)
          </button>
        </div>
      </div>
    </div>
  );
}

export default function KetuaVerifikasiSipakamase({ showToast }) {
  const [docs, setDocs] = useState([]);
  const [selected, setSelected] = useState(null);
  const [showPerbaikan, setShowPerbaikan] = useState(false);

  const loadSipakamase = async () => {
    const res = await sipakamaseApi.getAll({ status: 'Draft' });
    if (res.ok && res.data?.data) {
      setDocs(res.data.data);
      setSelected(res.data.data[0] || null);
    }
  };

  useEffect(() => {
    loadSipakamase();
  }, []);

  const handleVerify = async (status, catatan = '') => {
    if (!selected) return;
    const res = await sipakamaseApi.verify(selected.id, status, catatan);
    if (res.ok) {
      showToast && showToast(`Dokumen Sipakamase "${selected.nama_berkas}" berhasil diverifikasi (${status})!`, 'success');
      loadSipakamase();
    } else {
      showToast && showToast(res.data?.message || 'Gagal memverifikasi dokumen', 'error');
    }
  };

  const handleDownload = async (doc) => {
    const ok = await documentsApi.download(doc.id, doc.nama_berkas);
    if (ok) {
      showToast && showToast(`Mengunduh "${doc.nama_berkas}"...`, 'success');
    } else {
      showToast && showToast('Gagal mengunduh berkas.', 'error');
    }
  };

  return (
    <div>
      {showPerbaikan && (
        <ModalMintaPerbaikan
          selected={selected}
          onClose={() => setShowPerbaikan(false)}
          onSubmit={({ jenis, catatan }) => handleVerify('Revisi', `[${jenis}] ${catatan || 'Mohon diperbaiki sesuai pedoman.'}`)}
          showToast={showToast}
        />
      )}

      {/* Header */}
      <div className="responsive-page-header">
        <div>
          <span style={{ fontSize: '12px', fontWeight: 700, color: '#4F46E5', letterSpacing: '0.06em', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>KONSOL ADMIN • SIPAKAMASE</span>
          <h1 className="page-title">Verifikasi Dokumen Sipakamase</h1>
          <p className="page-subtitle" style={{ lineHeight: 1.55, marginTop: '6px' }}>Periksa kelengkapan administrasi dan validasi bundel dokumen pertanggungjawaban organisasi.</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={async () => {
              const ok = await documentsApi.downloadBundle('Sipakamase');
              if (ok) showToast && showToast('Mengunduh Bundel_Sipakamase_SIOMAS.zip...', 'success');
              else showToast && showToast('Gagal mengunduh bundel ZIP Sipakamase.', 'error');
            }}
            style={{ background: '#fff', border: '1.5px solid #E2E8F0', borderRadius: '10px', padding: '8px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 600, color: '#0F172A', fontFamily: 'inherit', whiteSpace: 'nowrap' }}
          >
            <Download size={15} /> Unduh Bundel Sipakamase (.ZIP)
          </button>
          <span style={{ fontSize: '13px', fontWeight: 700, color: '#D97706', background: '#FEF3C7', padding: '6px 14px', borderRadius: '999px', whiteSpace: 'nowrap' }}>{docs.length} menunggu verifikasi</span>
        </div>
      </div>

      {/* 3-Column */}
      <div className="responsive-3col-grid">
        {/* Antrian */}
        <div className="portal-card" style={{ padding: 0, minWidth: 0 }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #F1F5F9' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 700 }}>Antrean Sipakamase</h3>
            <p style={{ fontSize: '12px', color: '#94A3B8', marginTop: '2px' }}>Dokumen terbaru</p>
          </div>
          {docs.length === 0 ? (
            <div style={{ padding: '32px', textAlign: 'center', color: '#94A3B8', fontSize: '13px' }}>
              Belum ada dokumen Sipakamase yang menunggu verifikasi.
            </div>
          ) : (
            docs.map(s => (
              <div
                key={s.id}
                onClick={() => setSelected(s)}
                style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '14px 16px', cursor: 'pointer', borderLeft: selected?.id === s.id ? '3px solid #4F46E5' : '3px solid transparent', borderBottom: '1px solid #F1F5F9', background: selected?.id === s.id ? '#F8FAFC' : 'transparent' }}
              >
                <div style={{ width: '36px', height: '36px', background: '#EEF2FF', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4F46E5', flexShrink: 0 }}>📁</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#0F172A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.nama_berkas}</div>
                  <div style={{ fontSize: '12px', color: '#94A3B8' }}>{s.uploader_name || 'Pengurus'}</div>
                </div>
                <span style={{ background: '#FEF3C7', color: '#D97706', fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '6px', flexShrink: 0 }}>{s.status}</span>
              </div>
            ))
          )}
        </div>

        {/* Isi Bundel */}
        <div className="portal-card" style={{ padding: 0, minWidth: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', padding: '16px 20px', borderBottom: '1px solid #F1F5F9' }}>
            <div style={{ minWidth: 0, flex: 1 }}>
              <h3 style={{ fontSize: '15px', fontWeight: 700 }}>Detail Dokumen</h3>
              <p style={{ fontSize: '12.5px', color: '#94A3B8', marginTop: '4px', wordBreak: 'break-word' }}>{selected ? selected.nama_berkas : 'Pilih dokumen'}</p>
            </div>
            {selected && (
              <button onClick={() => handleDownload(selected)} style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '7px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 600, color: '#334155', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
                <Download size={14} /> Unduh Berkas
              </button>
            )}
          </div>
          <div>
            {selected ? (
              <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '12px', padding: '18px 20px' }}>
                <div style={{ width: '36px', height: '36px', background: '#FEE2E2', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#EF4444', flexShrink: 0 }}>
                  <FileText size={18} />
                </div>
                <div style={{ flex: 1, minWidth: '160px' }}>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: '#0F172A', lineHeight: 1.4, wordBreak: 'break-word' }}>{selected.nama_berkas}</div>
                  <div style={{ fontSize: '12px', color: '#94A3B8', marginTop: '4px', lineHeight: 1.4 }}>Diunggah oleh {selected.uploader_name || 'Pengurus'}</div>
                </div>
                <span style={{ background: '#FEF3C7', color: '#D97706', fontSize: '12px', fontWeight: 700, padding: '4px 10px', borderRadius: '6px' }}>Sipakamase</span>
              </div>
            ) : (
              <div style={{ padding: '40px 20px', textAlign: 'center', color: '#94A3B8', fontSize: '13.5px' }}>
                Tidak ada dokumen Sipakamase untuk ditampilkan.
              </div>
            )}
          </div>
        </div>

        {/* Checklist & Actions */}
        <div className="portal-card" style={{ display: 'flex', flexDirection: 'column', gap: '14px', minWidth: 0 }}>
          <div>
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#0F172A' }}>Checklist Verifikasi</h3>
            <p style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>Konfirmasi setiap persyaratan sebelum menyetujui.</p>
          </div>

          {selected ? (
            <>
              {['Proposal kegiatan tersedia', 'Surat perizinan lengkap', 'LPJ telah ditandatangani', 'Rekap keuangan sesuai'].map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '20px', height: '20px', background: '#ECFDF5', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Check size={12} color="#10B981" strokeWidth={3} />
                  </div>
                  <span style={{ fontSize: '13px', color: '#0F172A' }}>{item}</span>
                </div>
              ))}

              <button className="btn-primary" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '4px' }}
                onClick={() => handleVerify('Approved', 'Dokumen Sipakamase lengkap dan disetujui')}>
                <Check size={16} /> Setujui Sipakamase
              </button>

              <button onClick={() => setShowPerbaikan(true)} style={{
                background: 'none', border: '1.5px solid #E2E8F0', borderRadius: '10px', padding: '11px 20px',
                cursor: 'pointer', fontSize: '13.5px', fontWeight: 600, fontFamily: 'inherit', color: '#64748B',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
              }}>
                ✏️ Minta Perbaikan
              </button>
            </>
          ) : (
            <div style={{ fontSize: '13px', color: '#94A3B8' }}>
              Pilih dokumen dari antrean.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
