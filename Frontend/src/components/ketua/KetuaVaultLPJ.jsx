import React, { useState } from 'react';
import { Search, FileText, Edit3, Download, Trash2, Upload, X } from 'lucide-react';

const initialDocs = [
  { id: 1, nama: 'LPJ SIOMAS Fest 2024', label: 'LPJ', divisi: 'Acara', diperbarui: '18 Nov 2024', ukuran: '2.4 MB', status: 'Approved', statusType: 'green', tags: ['2024', 'Divisi Acara'] },
  { id: 2, nama: 'Proposal Workshop Leadership', label: 'Proposal', divisi: 'PSDM', diperbarui: '15 Nov 2024', ukuran: '1.8 MB', status: 'Approved', statusType: 'green', tags: ['PSDM', 'Pelatihan'] },
  { id: 3, nama: 'Surat Peminjaman Aula', label: 'Surat', divisi: 'Sekretariat', diperbarui: '12 Nov 2024', ukuran: '540 KB', status: 'Active', statusType: 'green', tags: ['Sarpras', 'Aula'] },
  { id: 4, nama: 'Sipakamase Periode Oktober', label: 'Sipakamase', divisi: 'Bendahara', diperbarui: '02 Nov 2024', ukuran: '3.1 MB', status: 'Approved', statusType: 'green', tags: ['Keuangan', 'Audit'] },
  { id: 5, nama: 'LPJ Bakti Sosial', label: 'LPJ', divisi: 'Humas', diperbarui: '28 Okt 2024', ukuran: '4.5 MB', status: 'Revision', statusType: 'orange', tags: ['Baksos', 'Revisi'] }
];

const labelColors = {
  LPJ: { bg: '#EEF2FF', color: '#4F46E5' },
  Proposal: { bg: '#ECFDF5', color: '#059669' },
  Surat: { bg: '#EFF6FF', color: '#3B82F6' },
  Sipakamase: { bg: '#FEF3C7', color: '#D97706' }
};

// Modal: Atur Label & Kategorisasi
function ModalAturLabel({ doc, onClose, onSave }) {
  const [label, setLabel] = useState(doc?.label || '');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState(doc?.tags || []);

  const addTag = (e) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      setTags(prev => [...prev, tagInput.trim()]);
      setTagInput('');
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div style={{ background: '#fff', borderRadius: '16px', width: '100%', maxWidth: '500px', padding: '28px', boxShadow: '0 24px 60px -12px rgba(0,0,0,0.2)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 700 }}>Atur Label & Kategorisasi</h2>
            <p style={{ fontSize: '13px', color: '#64748B', marginTop: '2px' }}>Kategorikan dokumen agar mudah ditemukan.</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}><X size={20} /></button>
        </div>

        <div className="form-group" style={{ marginBottom: '16px' }}>
          <label className="form-label">Label Dokumen</label>
          <select className="form-select" value={label} onChange={e => setLabel(e.target.value)}>
            {['LPJ', 'Proposal', 'Surat', 'Sipakamase'].map(l => <option key={l}>{l}</option>)}
          </select>
        </div>

        <div className="form-group" style={{ marginBottom: '16px' }}>
          <label className="form-label">Tag tambahan</label>
          <input
            className="form-input"
            placeholder="Ketik tag lalu tekan Enter"
            value={tagInput}
            onChange={e => setTagInput(e.target.value)}
            onKeyDown={addTag}
          />
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px' }}>
            {tags.map((t, i) => (
              <span key={i} style={{ background: '#EEF2FF', color: '#4F46E5', fontSize: '12px', padding: '3px 10px', borderRadius: '999px', cursor: 'pointer', fontWeight: 600 }}
                onClick={() => setTags(prev => prev.filter((_, j) => j !== i))}>
                {t} ×
              </span>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '24px' }}>
          <button onClick={onClose} className="btn-secondary" style={{ width: 'auto', padding: '10px 20px' }}>Batal</button>
          <button className="btn-primary" style={{ width: 'auto', margin: 0 }} onClick={() => { onSave({ label, tags }); onClose(); }}>
            Simpan Kategorisasi
          </button>
        </div>
      </div>
    </div>
  );
}

// Modal: Hapus / Arsip
function ModalHapus({ doc, onClose, onConfirm }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div style={{ background: '#fff', borderRadius: '16px', width: '100%', maxWidth: '440px', padding: '28px', boxShadow: '0 24px 60px -12px rgba(0,0,0,0.2)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 700 }}>Arsipkan berkas?</h2>
            <p style={{ fontSize: '13px', color: '#64748B', marginTop: '2px' }}>Tindakan ini akan menyembunyikan berkas dari repository.</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}><X size={20} /></button>
        </div>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', padding: '16px', background: '#FEF2F2', borderRadius: '10px', marginBottom: '24px' }}>
          <div style={{ width: '40px', height: '40px', background: '#FEE2E2', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#EF4444', flexShrink: 0 }}>
            <Trash2 size={20} />
          </div>
          <p style={{ fontSize: '13.5px', color: '#0F172A' }}>
            <strong>{doc?.nama}</strong> akan dipindahkan ke arsip dan dapat dipulihkan oleh admin selama 30 hari.
          </p>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button onClick={onClose} className="btn-secondary" style={{ width: 'auto', padding: '10px 20px' }}>Batal</button>
          <button style={{ background: '#EF4444', color: '#fff', border: 'none', borderRadius: '10px', padding: '10px 20px', cursor: 'pointer', fontSize: '13.5px', fontWeight: 600, fontFamily: 'inherit' }}
            onClick={() => { onConfirm(); onClose(); }}>
            Ya, Arsipkan/Hapus
          </button>
        </div>
      </div>
    </div>
  );
}

// Modal: Bundel Sipakamase
function ModalBundelSipakamase({ onClose }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div style={{ background: '#fff', borderRadius: '16px', width: '100%', maxWidth: '480px', padding: '28px', boxShadow: '0 24px 60px -12px rgba(0,0,0,0.2)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 700 }}>Siapkan Bundel Sipakamase</h2>
            <p style={{ fontSize: '13px', color: '#64748B', marginTop: '2px' }}>Dokumen aktif akan dikompresi menjadi berkas ZIP</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}><X size={20} /></button>
        </div>

        <div style={{ display: 'flex', gap: '14px', alignItems: 'center', padding: '16px', background: '#F8FAFC', borderRadius: '10px', marginBottom: '16px' }}>
          <div style={{ width: '48px', height: '48px', background: '#EEF2FF', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4F46E5', flexShrink: 0 }}>
            <Download size={24} />
          </div>
          <div>
            <div style={{ fontSize: '15px', fontWeight: 700, color: '#0F172A' }}>24 dokumen siap diunduh</div>
            <div style={{ fontSize: '12.5px', color: '#64748B' }}>Estimasi ukuran bundel 48.6 MB</div>
          </div>
        </div>

        <div style={{ height: '8px', background: '#E2E8F0', borderRadius: '999px', overflow: 'hidden', marginBottom: '24px' }}>
          <div style={{ height: '100%', width: '65%', background: 'linear-gradient(90deg, #4F46E5, #818CF8)', borderRadius: '999px' }} />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button onClick={onClose} className="btn-secondary" style={{ width: 'auto', padding: '10px 20px' }}>Batal</button>
          <button className="btn-primary" style={{ width: 'auto', margin: 0 }} onClick={() => { alert('Proses kompresi dimulai!'); onClose(); }}>
            Mulai Kompresi & Unduh
          </button>
        </div>
      </div>
    </div>
  );
}

export default function KetuaVaultLPJ({ onNavigate, showToast }) {
  const [activeFilter, setActiveFilter] = useState('Semua');
  const [searchQuery, setSearchQuery] = useState('');
  const [documents, setDocuments] = useState(initialDocs);
  const [modalLabel, setModalLabel] = useState(null);
  const [modalHapus, setModalHapus] = useState(null);
  const [showBundel, setShowBundel] = useState(false);

  const filters = ['Semua', 'LPJ', 'Proposal', 'Surat', 'Sipakamase'];

  const filtered = documents.filter(doc => {
    const matchFilter = activeFilter === 'Semua' || doc.label === activeFilter;
    const matchSearch = doc.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.divisi.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.label.toLowerCase().includes(searchQuery.toLowerCase());
    return matchFilter && matchSearch;
  });

  return (
    <div>
      {modalLabel && (
        <ModalAturLabel
          doc={modalLabel}
          onClose={() => setModalLabel(null)}
          onSave={({ label, tags }) => {
            setDocuments(prev => prev.map(d => d.id === modalLabel.id ? { ...d, label, tags } : d));
            showToast && showToast('Label berhasil diperbarui', 'success');
          }}
        />
      )}
      {modalHapus && (
        <ModalHapus
          doc={modalHapus}
          onClose={() => setModalHapus(null)}
          onConfirm={() => {
            setDocuments(prev => prev.filter(d => d.id !== modalHapus.id));
            showToast && showToast('Dokumen berhasil diarsipkan', 'success');
          }}
        />
      )}
      {showBundel && <ModalBundelSipakamase onClose={() => setShowBundel(false)} />}

      {/* Header */}
      <div className="page-header-block" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <span style={{ fontSize: '12px', fontWeight: 700, color: '#4F46E5', letterSpacing: '0.06em', textTransform: 'uppercase' }}>PUSAT DOKUMEN</span>
          <h1 className="page-title">Repository Vault</h1>
          <p className="page-subtitle">Kelola dan temukan dokumen organisasi dalam satu tempat.</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '6px', width: 'auto', padding: '10px 16px' }}
            onClick={() => setShowBundel(true)}>
            <Download size={16} /> Unduh Bundel
          </button>
          <button className="btn-primary" style={{ width: 'auto', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}
            onClick={() => onNavigate('k-unggah-lpj')}>
            <Upload size={16} /> Unggah Dokumen
          </button>
        </div>
      </div>

      {/* Table Card */}
      <div className="portal-card" style={{ padding: 0, overflow: 'hidden' }}>
        {/* Search + Filters */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid #F1F5F9', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ position: 'relative', flex: '1', minWidth: '240px' }}>
            <Search size={16} color="#94A3B8" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              className="form-input"
              style={{ paddingLeft: '40px' }}
              placeholder="Cari nama dokumen, divisi, atau label..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
          <div style={{ display: 'flex', gap: '6px' }}>
            {filters.map(f => (
              <button key={f} onClick={() => setActiveFilter(f)} style={{
                background: activeFilter === f ? '#4F46E5' : '#F8FAFC',
                color: activeFilter === f ? '#fff' : '#64748B',
                border: activeFilter === f ? 'none' : '1px solid #E2E8F0',
                borderRadius: '8px', padding: '6px 14px', cursor: 'pointer',
                fontSize: '13px', fontFamily: 'inherit', fontWeight: 600,
                display: 'flex', alignItems: 'center', gap: '5px'
              }}>
                {f}
                {f === 'Semua' && <span style={{ background: activeFilter === 'Semua' ? 'rgba(255,255,255,0.3)' : '#E2E8F0', borderRadius: '999px', fontSize: '11px', padding: '0 6px', fontWeight: 700, color: activeFilter === 'Semua' ? '#fff' : '#64748B' }}>{documents.length}</span>}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #F1F5F9' }}>
              {['NAMA DOKUMEN', 'LABEL', 'DIVISI', 'DIPERBARUI', 'UKURAN', 'STATUS', ''].map(h => (
                <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '11px', fontWeight: 700, color: '#94A3B8', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(doc => {
              const lc = labelColors[doc.label] || { bg: '#F1F5F9', color: '#64748B' };
              return (
                <tr key={doc.id} style={{ borderBottom: '1px solid #F8FAFC' }} onMouseEnter={e => e.currentTarget.style.background = '#FAFAFA'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '36px', height: '36px', background: '#FEE2E2', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#EF4444', flexShrink: 0 }}>
                        <FileText size={18} />
                      </div>
                      <div>
                        <div style={{ fontSize: '13.5px', fontWeight: 600, color: '#0F172A' }}>{doc.nama}</div>
                        <div style={{ fontSize: '11.5px', color: '#94A3B8' }}>PDF Document</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <span style={{ background: lc.bg, color: lc.color, fontSize: '12px', fontWeight: 700, padding: '3px 10px', borderRadius: '6px' }}>{doc.label}</span>
                  </td>
                  <td style={{ padding: '14px 16px', fontSize: '13px', color: '#64748B' }}>{doc.divisi}</td>
                  <td style={{ padding: '14px 16px', fontSize: '13px', color: '#64748B' }}>{doc.diperbarui}</td>
                  <td style={{ padding: '14px 16px', fontSize: '13px', color: '#64748B' }}>{doc.ukuran}</td>
                  <td style={{ padding: '14px 16px' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 600, color: doc.statusType === 'orange' ? '#D97706' : '#059669' }}>
                      <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: doc.statusType === 'orange' ? '#F59E0B' : '#10B981', display: 'inline-block' }} />
                      {doc.status}
                    </span>
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button title="Atur Label" onClick={() => setModalLabel(doc)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '6px', color: '#64748B', borderRadius: '6px' }}>
                        <Edit3 size={16} />
                      </button>
                      <button title="Unduh" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '6px', color: '#64748B', borderRadius: '6px' }}>
                        <Download size={16} />
                      </button>
                      <button title="Arsipkan" onClick={() => setModalHapus(doc)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '6px', color: '#64748B', borderRadius: '6px' }}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Pagination */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 20px', borderTop: '1px solid #F1F5F9' }}>
          <span style={{ fontSize: '13px', color: '#64748B' }}>Menampilkan 1–{filtered.length} dari {documents.length} dokumen</span>
          <div style={{ display: 'flex', gap: '4px' }}>
            {[1, 2, 3].map(p => (
              <button key={p} style={{ width: '32px', height: '32px', borderRadius: '8px', border: p === 1 ? 'none' : '1px solid #E2E8F0', background: p === 1 ? '#4F46E5' : '#fff', color: p === 1 ? '#fff' : '#64748B', cursor: 'pointer', fontSize: '13px', fontFamily: 'inherit', fontWeight: 600 }}>
                {p}
              </button>
            ))}
            <button style={{ width: '32px', height: '32px', borderRadius: '8px', border: '1px solid #E2E8F0', background: '#fff', color: '#64748B', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m9 18 6-6-6-6"/></svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
