import React, { useState, useEffect, useRef } from 'react';
import { Search, FileText, Edit3, Download, Trash2, Upload, X } from 'lucide-react';
import { documentsApi } from '../../services/api.js';

const labelColors = {
  LPJ: { bg: '#EEF2FF', color: '#4F46E5' },
  Proposal: { bg: '#ECFDF5', color: '#059669' },
  Surat: { bg: '#EFF6FF', color: '#3B82F6' },
  Sipakamase: { bg: '#FEF3C7', color: '#D97706' }
};

// Modal: Atur Label & Kategorisasi
function ModalAturLabel({ doc, onClose, onSave }) {
  const [label, setLabel] = useState(doc?.label || 'LPJ');
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
            <h2 style={{ fontSize: '18px', fontWeight: 700 }}>Atur Label &amp; Kategorisasi</h2>
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
            <h2 style={{ fontSize: '18px', fontWeight: 700 }}>Hapus berkas?</h2>
            <p style={{ fontSize: '13px', color: '#64748B', marginTop: '2px' }}>Tindakan ini akan menghapus berkas dari repository aktif.</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}><X size={20} /></button>
        </div>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', padding: '16px', background: '#FEF2F2', borderRadius: '10px', marginBottom: '24px' }}>
          <div style={{ width: '40px', height: '40px', background: '#FEE2E2', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#EF4444', flexShrink: 0 }}>
            <Trash2 size={20} />
          </div>
          <p style={{ fontSize: '13.5px', color: '#0F172A' }}>
            <strong>{doc?.nama}</strong> akan dihapus dari daftar arsip aktif.
          </p>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button onClick={onClose} className="btn-secondary" style={{ width: 'auto', padding: '10px 20px' }}>Batal</button>
          <button style={{ background: '#EF4444', color: '#fff', border: 'none', borderRadius: '10px', padding: '10px 20px', cursor: 'pointer', fontSize: '13.5px', fontWeight: 600, fontFamily: 'inherit' }}
            onClick={() => { onConfirm(); onClose(); }}>
            Ya, Hapus
          </button>
        </div>
      </div>
    </div>
  );
}

// Modal: Unggah Dokumen Baru
function ModalUnggah({ onClose, onUploaded, showToast }) {
  const [form, setForm] = useState({ nama: '', divisi: 'Divisi Acara', label: 'LPJ', file: null, fileName: '' });
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.nama.trim() || !form.file) {
      showToast && showToast('Harap isi nama dokumen dan pilih berkas.', 'error');
      return;
    }
    setUploading(true);
    const namaBerkas = `${form.nama.trim()} (${form.divisi})`;
    const res = await documentsApi.upload(form.file, namaBerkas, form.label);
    setUploading(false);

    if (res.ok) {
      showToast && showToast(`Dokumen "${form.nama}" berhasil diunggah!`, 'success');
      onUploaded();
      onClose();
    } else {
      showToast && showToast(res.data?.message || 'Gagal mengunggah dokumen.', 'error');
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div style={{ background: '#fff', borderRadius: '16px', width: '100%', maxWidth: '480px', padding: '28px', boxShadow: '0 24px 60px -12px rgba(0,0,0,0.2)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 700 }}>Unggah Dokumen Baru</h2>
            <p style={{ fontSize: '13px', color: '#64748B', marginTop: '2px' }}>Tambahkan dokumen langsung ke Repository Vault.</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group" style={{ marginBottom: '14px' }}>
            <label className="form-label">Nama Dokumen</label>
            <input className="form-input" placeholder="Contoh: LPJ Kegiatan Tahunan" value={form.nama} onChange={e => setForm({ ...form, nama: e.target.value })} required />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
            <div className="form-group">
              <label className="form-label">Kategori</label>
              <select className="form-select" value={form.label} onChange={e => setForm({ ...form, label: e.target.value })}>
                <option>LPJ</option>
                <option>Proposal</option>
                <option>Surat</option>
                <option>Sipakamase</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Divisi</label>
              <select className="form-select" value={form.divisi} onChange={e => setForm({ ...form, divisi: e.target.value })}>
                <option>Divisi Acara</option>
                <option>PSDM</option>
                <option>Sekretariat</option>
                <option>Bendahara</option>
                <option>Humas</option>
              </select>
            </div>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.doc,.docx,.xls,.xlsx,.zip"
            style={{ display: 'none' }}
            onChange={e => {
              const f = e.target.files?.[0];
              if (f) setForm({ ...form, file: f, fileName: f.name });
            }}
          />

          <div
            onClick={() => fileInputRef.current?.click()}
            style={{ border: '2px dashed #CBD5E1', borderRadius: '12px', padding: '28px', textAlign: 'center', cursor: 'pointer', background: form.fileName ? '#F0FDF4' : '#FAFAFA', marginBottom: '20px' }}
          >
            <Upload size={22} color="#4F46E5" style={{ marginBottom: '8px' }} />
            {form.fileName ? (
              <div style={{ fontSize: '13.5px', fontWeight: 600, color: '#10B981' }}>{form.fileName} ✓</div>
            ) : (
              <div style={{ fontSize: '13px', color: '#64748B' }}>Klik untuk pilih berkas (.pdf / .docx / .zip)</div>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button type="button" onClick={onClose} className="btn-secondary" style={{ width: 'auto', padding: '10px 20px' }}>Batal</button>
            <button type="submit" className="btn-primary" style={{ width: 'auto', margin: 0 }} disabled={uploading}>
              {uploading ? 'Mengunggah...' : 'Unggah'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function KetuaVaultLPJ({ showToast }) {
  const [activeFilter, setActiveFilter] = useState('Semua');
  const [searchQuery, setSearchQuery] = useState('');
  const [documents, setDocuments] = useState([]);
  const [modalLabel, setModalLabel] = useState(null);
  const [modalHapus, setModalHapus] = useState(null);
  const [showUnggah, setShowUnggah] = useState(false);

  const loadDocuments = async () => {
    const res = await documentsApi.getAll();
    if (res.ok && res.data?.data) {
      const mapped = res.data.data.map((d) => ({
        id: d.id,
        nama: d.nama_berkas,
        label: d.kategori,
        divisi: d.uploader_name || 'Pengurus',
        diperbarui: 'Terbaru',
        ukuran: 'PDF',
        status: d.status,
        statusType: d.status === 'Approved' ? 'green' : 'orange',
        tags: [d.kategori]
      }));
      setDocuments(mapped);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, []);

  const filters = ['Semua', 'LPJ', 'Proposal', 'Surat', 'Sipakamase'];

  const filtered = documents.filter(doc => {
    const matchFilter = activeFilter === 'Semua' || doc.label === activeFilter;
    const matchSearch = doc.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.divisi.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.label.toLowerCase().includes(searchQuery.toLowerCase());
    return matchFilter && matchSearch;
  });

  const handleDelete = async (doc) => {
    const res = await documentsApi.delete(doc.id);
    if (res.ok) {
      showToast && showToast(`Dokumen "${doc.nama}" berhasil dihapus`, 'success');
      loadDocuments();
    } else {
      showToast && showToast(res.data?.message || 'Gagal menghapus dokumen', 'error');
    }
  };

  const handleDownload = async (doc) => {
    const ok = await documentsApi.download(doc.id, doc.nama);
    if (ok) {
      showToast && showToast(`Mengunduh "${doc.nama}"...`, 'success');
    } else {
      showToast && showToast('Gagal mengunduh berkas.', 'error');
    }
  };

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
          onConfirm={() => handleDelete(modalHapus)}
        />
      )}
      {showUnggah && (
        <ModalUnggah
          onClose={() => setShowUnggah(false)}
          onUploaded={loadDocuments}
          showToast={showToast}
        />
      )}

      {/* Header */}
      <div className="page-header-block" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <span style={{ fontSize: '12px', fontWeight: 700, color: '#4F46E5', letterSpacing: '0.06em', textTransform: 'uppercase' }}>PUSAT DOKUMEN</span>
          <h1 className="page-title">Repository Vault</h1>
          <p className="page-subtitle">Kelola dan temukan dokumen organisasi dalam satu tempat.</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn-primary" style={{ width: 'auto', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}
            onClick={() => setShowUnggah(true)}>
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
              {['NAMA DOKUMEN', 'LABEL', 'PENGUNGGAH', 'DIPERBARUI', 'FORMAT', 'STATUS', ''].map(h => (
                <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '11px', fontWeight: 700, color: '#94A3B8', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length > 0 ? filtered.map(doc => {
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
                        <div style={{ fontSize: '11.5px', color: '#94A3B8' }}>Dokumen Organisasi</div>
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
                      <button title="Unduh" onClick={() => handleDownload(doc)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '6px', color: '#64748B', borderRadius: '6px' }}>
                        <Download size={16} />
                      </button>
                      <button title="Hapus" onClick={() => setModalHapus(doc)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '6px', color: '#64748B', borderRadius: '6px' }}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            }) : (
              <tr>
                <td colSpan="7" style={{ padding: '40px', textAlign: 'center', color: '#94A3B8', fontSize: '13.5px' }}>
                  Belum ada dokumen di Repository Vault.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Pagination */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 20px', borderTop: '1px solid #F1F5F9' }}>
          <span style={{ fontSize: '13px', color: '#64748B' }}>Menampilkan {filtered.length} dari {documents.length} dokumen</span>
        </div>
      </div>
    </div>
  );
}
