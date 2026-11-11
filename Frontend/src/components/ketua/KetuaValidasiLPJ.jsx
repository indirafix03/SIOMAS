import React, { useState, useEffect } from 'react';
import { FileText, X, Check } from 'lucide-react';
import { lpjApi, documentsApi } from '../../services/api.js';

// Modal: Minta Revisi LPJ
function ModalMintaRevisi({ doc, onClose, onSubmit }) {
  const [bagian, setBagian] = useState('Kelengkapan administrasi');
  const [catatan, setCatatan] = useState('');

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div style={{ background: '#fff', borderRadius: '16px', width: '100%', maxWidth: '480px', padding: '28px', boxShadow: '0 24px 60px -12px rgba(0,0,0,0.2)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 700 }}>Minta Revisi LPJ</h2>
            <p style={{ fontSize: '13px', color: '#64748B', marginTop: '2px' }}>Catatan akan dikirim kepada koordinator divisi.</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}><X size={20} /></button>
        </div>

        <div className="form-group" style={{ marginBottom: '16px' }}>
          <label className="form-label">Bagian yang perlu direvisi</label>
          <select className="form-select" value={bagian} onChange={e => setBagian(e.target.value)}>
            <option>Kelengkapan administrasi</option>
            <option>Tanda tangan dan stempel</option>
            <option>Laporan keuangan</option>
            <option>Deskripsi kegiatan</option>
            <option>Lampiran dokumentasi</option>
          </select>
        </div>

        <div className="form-group" style={{ marginBottom: '24px' }}>
          <label className="form-label">Catatan Revisi</label>
          <textarea
            className="form-input"
            rows={4}
            placeholder="Jelaskan perubahan yang perlu dilakukan..."
            value={catatan}
            onChange={e => setCatatan(e.target.value)}
            style={{ resize: 'none' }}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button onClick={onClose} className="btn-secondary" style={{ width: 'auto', padding: '10px 20px' }}>Batal</button>
          <button className="btn-primary" style={{ width: 'auto', margin: 0 }} onClick={() => { onSubmit({ bagian, catatan }); onClose(); }}>
            Kirim Catatan Revisi
          </button>
        </div>
      </div>
    </div>
  );
}

export default function KetuaValidasiLPJ({ showToast }) {
  const [antrian, setAntrian] = useState([]);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [checked, setChecked] = useState(false);
  const [showRevisiModal, setShowRevisiModal] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadPendingLPJ = async () => {
    setLoading(true);
    const res = await lpjApi.getPendingValidation();
    setLoading(false);
    if (res.ok && res.data?.data) {
      const mapped = res.data.data.map((d) => ({
        id: d.id,
        nama: d.nama_berkas,
        divisi: d.nama_berkas.includes('(') ? d.nama_berkas.split('(').pop().replace(')', '') : 'Divisi Organisasi',
        waktu: 'Terbaru',
        status: d.status === 'Draft' ? 'Draf' : d.status,
        divisiPIC: d.nama_berkas.includes('(') ? d.nama_berkas.split('(').pop().replace(')', '') : 'Divisi Organisasi',
        koordinator: d.uploader_name || 'Pengurus Divisi',
        tanggal: 'Periode Berjalan',
        pathFile: d.path_file
      }));
      setAntrian(mapped);
      setSelectedDoc(mapped[0] || null);
      setChecked(false);
    }
  };

  useEffect(() => {
    loadPendingLPJ();
  }, []);

  const handleSetuju = async () => {
    if (!selectedDoc) return;
    if (!checked) {
      showToast && showToast('Centang persetujuan terlebih dahulu', 'error');
      return;
    }
    const res = await lpjApi.validate(selectedDoc.id, 'Approved', 'Disetujui oleh Ketua/Admin');
    if (res.ok) {
      showToast && showToast(`LPJ "${selectedDoc.nama}" berhasil disetujui!`, 'success');
      loadPendingLPJ();
    } else {
      showToast && showToast(res.data?.message || 'Gagal menyetujui LPJ', 'error');
    }
  };

  const handleRevisiSubmit = async ({ bagian, catatan }) => {
    if (!selectedDoc) return;
    const fullCatatan = `[${bagian}] ${catatan || 'Mohon diperbaiki sesuai pedoman.'}`;
    const res = await lpjApi.validate(selectedDoc.id, 'Revisi', fullCatatan);
    if (res.ok) {
      showToast && showToast(`Catatan revisi untuk "${selectedDoc.nama}" telah dikirim.`, 'success');
      loadPendingLPJ();
    } else {
      showToast && showToast(res.data?.message || 'Gagal mengirim catatan revisi', 'error');
    }
  };

  const handleDownload = async () => {
    if (!selectedDoc) return;
    const ok = await documentsApi.download(selectedDoc.id, selectedDoc.nama);
    if (ok) {
      showToast && showToast(`Mengunduh "${selectedDoc.nama}"...`, 'success');
    } else {
      showToast && showToast('Gagal mengunduh berkas fisik.', 'error');
    }
  };

  return (
    <div>
      {showRevisiModal && (
        <ModalMintaRevisi
          doc={selectedDoc}
          onClose={() => setShowRevisiModal(false)}
          onSubmit={handleRevisiSubmit}
        />
      )}

      {/* Header */}
      <div className="responsive-page-header">
        <div>
          <span style={{ fontSize: '12px', fontWeight: 700, color: '#4F46E5', letterSpacing: '0.06em', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>KONSOL ADMIN</span>
          <h1 className="page-title">Validasi &amp; Approval LPJ</h1>
          <p className="page-subtitle" style={{ lineHeight: 1.55, marginTop: '6px' }}>Tinjau dokumen dari divisi sebelum masuk Repository Vault.</p>
        </div>
        <span style={{ fontSize: '13px', fontWeight: 700, color: '#D97706', background: '#FEF3C7', padding: '6px 14px', borderRadius: '999px', whiteSpace: 'nowrap' }}>{antrian.length} menunggu validasi</span>
      </div>

      {/* 3-Column Layout */}
      <div className="responsive-3col-grid">
        {/* Left: Antrian */}
        <div className="portal-card" style={{ padding: 0, minWidth: 0 }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #F1F5F9' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#0F172A' }}>Antrean Dokumen</h3>
            <p style={{ fontSize: '12px', color: '#94A3B8', marginTop: '2px' }}>Urut berdasarkan terbaru</p>
          </div>
          <div>
            {loading ? (
              <div style={{ padding: '32px', textAlign: 'center', color: '#94A3B8', fontSize: '13px' }}>
                Memuat antrean...
              </div>
            ) : antrian.length === 0 ? (
              <div style={{ padding: '32px', textAlign: 'center', color: '#94A3B8', fontSize: '13px' }}>
                Belum ada pengajuan LPJ yang menunggu validasi.
              </div>
            ) : (
              antrian.map(doc => (
                <div
                  key={doc.id}
                  onClick={() => { setSelectedDoc(doc); setChecked(false); }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '10px', padding: '14px 16px',
                    cursor: 'pointer', borderLeft: selectedDoc?.id === doc.id ? '3px solid #4F46E5' : '3px solid transparent',
                    background: selectedDoc?.id === doc.id ? '#F8FAFC' : 'transparent',
                    borderBottom: '1px solid #F1F5F9'
                  }}
                >
                  <div style={{ width: '36px', height: '36px', background: '#FEE2E2', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#EF4444', flexShrink: 0 }}>
                    <FileText size={18} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#0F172A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{doc.nama}</div>
                    <div style={{ fontSize: '12px', color: '#94A3B8' }}>{doc.koordinator}</div>
                  </div>
                  <span style={{ background: '#FEF3C7', color: '#D97706', fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '6px', flexShrink: 0 }}>{doc.status}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Center: Document Preview */}
        <div className="portal-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minHeight: '360px', minWidth: 0 }}>
          {selectedDoc ? (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', width: '100%', marginBottom: '20px' }}>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: '#0F172A', lineHeight: 1.4, wordBreak: 'break-word' }}>{selectedDoc.nama}</div>
                  <div style={{ fontSize: '12.5px', color: '#94A3B8', marginTop: '4px' }}>Diunggah oleh {selectedDoc.koordinator}</div>
                </div>
                <button
                  onClick={handleDownload}
                  title="Unduh berkas LPJ"
                  style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '7px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 600, color: '#334155', fontFamily: 'inherit', whiteSpace: 'nowrap' }}
                >
                  ↓ Unduh
                </button>
              </div>

              {/* PDF Preview Box */}
              <div style={{
                flex: 1, width: '100%', background: '#F8FAFC', borderRadius: '12px',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                border: '2px dashed #E2E8F0', minHeight: '280px', padding: '24px 16px', gap: '12px'
              }}>
                <div style={{
                  width: '130px', height: '160px', background: '#fff', borderRadius: '6px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center', gap: '4px', padding: '12px'
                }}>
                  <div style={{ width: '40px', height: '40px', background: '#4F46E5', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '20px', fontWeight: 700 }}>S</div>
                  <div style={{ fontSize: '9px', fontWeight: 700, color: '#0F172A', textAlign: 'center', lineHeight: 1.2, marginTop: '6px' }}>
                    LAPORAN<br />PERTANGGUNGJAWABAN<br />
                    <span style={{ color: '#4F46E5' }}>{selectedDoc.nama}</span>
                  </div>
                  {[1, 2, 3].map(i => (
                    <div key={i} style={{ height: '4px', background: '#E2E8F0', borderRadius: '2px', width: '100%', marginTop: '4px' }} />
                  ))}
                </div>
                <p style={{ fontSize: '12px', color: '#94A3B8' }}>Preview dokumen LPJ</p>
              </div>
            </>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, color: '#94A3B8', fontSize: '13.5px' }}>
              Tidak ada dokumen dalam antrean. Silakan unggah LPJ dari akun Pengurus.
            </div>
          )}
        </div>

        {/* Right: Detail & Actions */}
        <div className="portal-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#0F172A' }}>Detail Pengajuan</h3>

          {selectedDoc ? (
            <>
              <div>
                <div style={{ fontSize: '11px', color: '#94A3B8', marginBottom: '2px' }}>Status</div>
                <span style={{ background: '#FEF3C7', color: '#D97706', fontSize: '12px', fontWeight: 700, padding: '3px 10px', borderRadius: '6px' }}>{selectedDoc.status}</span>
              </div>
              <div>
                <div style={{ fontSize: '11px', color: '#94A3B8', marginBottom: '2px' }}>Divisi</div>
                <div style={{ fontSize: '13.5px', fontWeight: 600, color: '#0F172A' }}>{selectedDoc.divisiPIC}</div>
              </div>
              <div>
                <div style={{ fontSize: '11px', color: '#94A3B8', marginBottom: '2px' }}>Pengunggah</div>
                <div style={{ fontSize: '13.5px', fontWeight: 600, color: '#0F172A' }}>{selectedDoc.koordinator}</div>
              </div>

              <div style={{ height: '1px', background: '#F1F5F9' }} />

              <label style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', cursor: 'pointer', fontSize: '13px', color: '#0F172A' }}>
                <input type="checkbox" checked={checked} onChange={e => setChecked(e.target.checked)} style={{ marginTop: '2px', accentColor: '#4F46E5' }} />
                Dokumen telah diperiksa dan sesuai dengan panduan administrasi.
              </label>

              <button className="btn-primary" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }} onClick={handleSetuju}>
                <Check size={16} /> Setujui LPJ
              </button>

              <button onClick={() => setShowRevisiModal(true)} style={{
                background: 'none', border: '1.5px solid #E2E8F0', borderRadius: '10px', padding: '11px 20px',
                cursor: 'pointer', fontSize: '13.5px', fontWeight: 600, fontFamily: 'inherit', color: '#64748B',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
              }}>
                ✏️ Minta Revisi
              </button>
            </>
          ) : (
            <div style={{ fontSize: '13px', color: '#94A3B8' }}>
              Pilih dokumen di sebelah kiri untuk memvalidasi.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
