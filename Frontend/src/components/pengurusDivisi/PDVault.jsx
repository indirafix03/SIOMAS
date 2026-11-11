import React, { useState, useEffect, useRef } from 'react';
import {
  Download,
  Search,
  FileText,
  Edit3,
  ChevronLeft,
  ChevronRight,
  Upload,
  X,
  Tag
} from 'lucide-react';
import { documentsApi } from '../../services/api.js';

// Modal Atur Label & Kategorisasi
function ModalAturLabel({ document, onClose, onSave }) {
  const [label, setLabel] = useState(document.label || 'Proposal');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState(document.tags || []);

  const addTag = (e) => {
    if ((e.key === 'Enter' || e.key === ',') && tagInput.trim()) {
      e.preventDefault();
      if (!tags.includes(tagInput.trim())) {
        setTags([...tags, tagInput.trim()]);
      }
      setTagInput('');
    }
  };

  const removeTag = (t) => setTags(tags.filter((tag) => tag !== t));

  const handleSave = () => {
    onSave({ ...document, label, tags });
  };

  return (
    <div className="portal-modal-backdrop" onClick={onClose}>
      <div className="portal-modal-dialog" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '420px' }}>
        <div className="portal-modal-header">
          <div>
            <h3 className="portal-modal-title">Atur Label &amp; Kategorisasi</h3>
            <p className="portal-modal-subtitle">Kategorikan dokumen agar mudah ditemukan.</p>
          </div>
          <button type="button" className="portal-modal-close-btn" onClick={onClose}><X size={20} /></button>
        </div>

        <div className="portal-modal-body">
          <div className="portal-form-group">
            <label className="portal-form-label">Label Dokumen</label>
            <select className="portal-select" value={label} onChange={(e) => setLabel(e.target.value)}>
              <option value="Proposal">Proposal</option>
              <option value="LPJ">LPJ</option>
              <option value="Surat">Surat</option>
              <option value="Sipakamase">Sipakamase</option>
            </select>
          </div>

          <div className="portal-form-group">
            <label className="portal-form-label">Tag tambahan</label>
            <input
              type="text"
              className="portal-input"
              placeholder="Ketik tag lalu tekan Enter"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={addTag}
            />
            {tags.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '10px' }}>
                {tags.map((t) => (
                  <span key={t} style={{
                    display: 'inline-flex', alignItems: 'center', gap: '5px',
                    background: '#EEF2FF', color: '#6366F1',
                    fontSize: '12px', fontWeight: 600, padding: '4px 10px',
                    borderRadius: '20px'
                  }}>
                    {t}
                    <button
                      type="button"
                      onClick={() => removeTag(t)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6366F1', padding: '0', lineHeight: 1 }}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="portal-modal-footer">
          <button type="button" className="btn-secondary" style={{ width: 'auto', padding: '9px 20px' }} onClick={onClose}>Batal</button>
          <button type="button" className="btn-primary-glow" style={{ padding: '9px 22px' }} onClick={handleSave}>
            <Tag size={14} style={{ marginRight: '6px' }} /> Simpan Kategorisasi
          </button>
        </div>
      </div>
    </div>
  );
}

// Modal Unggah Dokumen
function ModalUnggahDokumen({ initialLabel = 'Sipakamase', onClose, onUploaded, showToast }) {
  const [form, setForm] = useState({ nama: '', divisi: 'Divisi Acara', label: initialLabel, file: null, fileName: '' });
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.nama.trim()) {
      showToast('Harap isi nama dokumen.', 'warning');
      return;
    }
    let fileToUpload = form.file;
    if (!fileToUpload) {
      showToast('Harap pilih berkas dokumen terlebih dahulu.', 'warning');
      return;
    }

    setUploading(true);
    const namaBerkas = `${form.nama.trim()} (${form.divisi})`;
    const res = await documentsApi.upload(fileToUpload, namaBerkas, form.label);
    setUploading(false);

    if (res.ok) {
      showToast(`Dokumen "${form.nama}" berhasil diunggah ke database!`, 'success');
      onUploaded();
      onClose();
    } else {
      showToast(res.data?.message || 'Gagal mengunggah dokumen.', 'error');
    }
  };

  return (
    <div className="portal-modal-backdrop" onClick={onClose}>
      <div className="portal-modal-dialog" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '460px' }}>
        <div className="portal-modal-header">
          <div>
            <h3 className="portal-modal-title">Unggah Dokumen Baru</h3>
            <p className="portal-modal-subtitle">Tambahkan dokumen ke Repository Vault.</p>
          </div>
          <button type="button" className="portal-modal-close-btn" onClick={onClose}><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="portal-modal-body">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div className="portal-form-group" style={{ gridColumn: '1 / -1' }}>
                <label className="portal-form-label">Nama Dokumen</label>
                <input className="portal-input" placeholder="Contoh: Proposal Kegiatan Workshop" value={form.nama} onChange={(e) => setForm({ ...form, nama: e.target.value })} required />
              </div>
              <div className="portal-form-group">
                <label className="portal-form-label">Label</label>
                <select className="portal-select" value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })}>
                  <option>Proposal</option>
                  <option>LPJ</option>
                  <option>Surat</option>
                  <option>Sipakamase</option>
                </select>
              </div>
              <div className="portal-form-group">
                <label className="portal-form-label">Divisi</label>
                <select className="portal-select" value={form.divisi} onChange={(e) => setForm({ ...form, divisi: e.target.value })}>
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
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) {
                  setForm({ ...form, file: f, fileName: f.name });
                  showToast(`Berkas "${f.name}" dipilih.`, 'success');
                }
              }}
            />

            {/* Dropzone */}
            <div
              style={{ border: '2px dashed #CBD5E1', borderRadius: '12px', padding: '32px', textAlign: 'center', cursor: 'pointer', background: form.fileName ? '#F0FDF4' : '#FAFAFA', transition: 'all 0.2s' }}
              onClick={() => fileInputRef.current?.click()}
            >
              <div style={{ width: '44px', height: '44px', background: '#EEF2FF', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', color: '#6366F1' }}>
                <Upload size={20} />
              </div>
              {form.fileName ? (
                <p style={{ fontSize: '14px', fontWeight: 600, color: '#10B981' }}>{form.fileName} ✓</p>
              ) : (
                <>
                  <p style={{ fontWeight: 600, color: '#0F172A', marginBottom: '4px' }}>Klik untuk pilih berkas dari perangkat</p>
                  <p style={{ fontSize: '12px', color: '#94A3B8' }}>Format PDF atau DOCX • Maksimal 10 MB</p>
                </>
              )}
            </div>
          </div>
          <div className="portal-modal-footer">
            <button type="button" className="btn-secondary" style={{ width: 'auto', padding: '9px 18px' }} onClick={onClose}>Batal</button>
            <button type="submit" className="btn-primary-glow" style={{ padding: '9px 22px' }} disabled={uploading}>
              <Upload size={14} style={{ marginRight: '6px' }} /> {uploading ? 'Mengunggah...' : 'Unggah Dokumen'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function PDVault({ showToast }) {
  const [activeFilter, setActiveFilter] = useState('Semua');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingDoc, setEditingDoc] = useState(null);
  const [showUnggahModal, setShowUnggahModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [documents, setDocuments] = useState([]);

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
        catatanRevisi: d.catatan_revisi || '',
        approverName: d.approver_name || 'Admin / Ketua UKM',
        statusType: d.status === 'Approved' ? 'green' : d.status === 'Revisi' ? 'red' : 'orange',
        tags: [d.kategori]
      }));
      setDocuments(mapped);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, []);

  const filterOptions = ['Semua', 'LPJ', 'Proposal', 'Surat', 'Sipakamase'];

  const filteredDocs = documents.filter((doc) => {
    const matchesCategory = activeFilter === 'Semua' || doc.label.toLowerCase() === activeFilter.toLowerCase();
    const matchesSearch = doc.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.divisi.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.label.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleSaveCategory = async (updatedDoc) => {
    const res = await documentsApi.updateCategory(updatedDoc.id, updatedDoc.label, updatedDoc.nama);
    if (res.ok) {
      await loadDocuments();
      setEditingDoc(null);
      showToast(`Kategorisasi "${updatedDoc.nama}" berhasil diperbarui ke ${updatedDoc.label}.`, 'success');
    } else {
      showToast(res.data?.message || 'Gagal memperbarui kategori dokumen.', 'error');
    }
  };

  const handleDownload = async (doc) => {
    const ok = await documentsApi.download(doc.id, doc.nama);
    if (ok) {
      showToast(`Mengunduh ${doc.nama}...`, 'success');
    } else {
      showToast('Gagal mengunduh berkas.', 'error');
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="page-header-block">
        <div className="page-title-row" style={{ alignItems: 'flex-end' }}>
          <div>
            <span className="page-category-tag">PUSAT DOKUMEN</span>
            <h1 className="page-title">Repository Vault</h1>
            <p className="page-subtitle">Kelola dan temukan dokumen organisasi dalam satu tempat.</p>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              type="button"
              className="btn-secondary"
              style={{ width: 'auto', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '6px' }}
              onClick={async () => {
                const ok = await documentsApi.downloadBundle(activeFilter);
                if (ok) showToast(`Mengunduh Bundel_${activeFilter}_SIOMAS.zip...`, 'success');
                else showToast('Gagal mengunduh bundel ZIP.', 'error');
              }}
            >
              <Download size={16} /> Unduh Bundel .ZIP ({activeFilter})
            </button>
            <button type="button" className="btn-primary-glow" onClick={() => setShowUnggahModal(true)}>
              <Upload size={16} style={{ marginRight: '6px' }} /> Unggah Dokumen
            </button>
          </div>
        </div>
      </div>

      {/* Table Card */}
      <div className="portal-card" style={{ padding: '24px' }}>
        {/* Search & Filter */}
        <div className="vault-search-filter-row">
          <div className="search-box-wrap">
            <Search size={16} />
            <input
              type="text"
              className="search-box-input"
              placeholder="Cari nama dokumen, divisi, atau label..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="filter-pills-group">
            {filterOptions.map((filter) => (
              <button
                key={filter}
                type="button"
                className={`filter-pill ${activeFilter === filter ? 'active' : ''}`}
                onClick={() => setActiveFilter(filter)}
              >
                {filter === 'Semua' ? `Semua ${documents.length}` : filter}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div style={{ overflowX: 'auto' }}>
          <table className="modern-data-table">
            <thead>
              <tr>
                <th>Nama Dokumen</th>
                <th>Label</th>
                <th>Pengunggah</th>
                <th>Diperbarui</th>
                <th>Format</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredDocs.length > 0 ? filteredDocs.map((doc) => (
                <tr key={doc.id}>
                  <td>
                    <div className="doc-name-cell">
                      <div className="doc-icon-wrap"><FileText size={18} /></div>
                      <div>
                        <div className="doc-title-text">{doc.nama}</div>
                        <div className="doc-sub-text">Dokumen Organisasi</div>
                        {doc.status === 'Revisi' && (
                          <div style={{
                            marginTop: '4px',
                            fontSize: '12px',
                            fontWeight: 600,
                            color: '#DC2626',
                            background: '#FEF2F2',
                            border: '1px solid #FECACA',
                            borderRadius: '6px',
                            padding: '4px 8px',
                            display: 'inline-block'
                          }}>
                            ⚠️ Revisi ({doc.approverName}): {doc.catatanRevisi || 'Mohon perbaiki sesuai pedoman.'}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className={`tag-badge ${doc.label === 'LPJ' ? 'tag-purple' : doc.label === 'Proposal' ? 'tag-gray' : doc.label === 'Sipakamase' ? 'tag-orange' : 'tag-gray'}`}>
                      {doc.label}
                    </span>
                  </td>
                  <td>{doc.divisi}</td>
                  <td>{doc.diperbarui}</td>
                  <td>{doc.ukuran}</td>
                  <td>
                    <span className="status-dot-badge">
                      <span className={doc.statusType === 'green' ? 'dot-green' : 'dot-orange'} />
                      <span style={{ color: doc.statusType === 'green' ? '#047857' : '#B45309' }}>{doc.status}</span>
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '6px' }}>
                      <button type="button" className="table-action-btn" title="Atur Label & Tag" onClick={() => setEditingDoc(doc)}>
                        <Edit3 size={16} />
                      </button>
                      <button type="button" className="table-action-btn" title="Unduh Berkas" onClick={() => handleDownload(doc)}>
                        <Download size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: '#94A3B8' }}>
                    Belum ada dokumen di Repository Vault.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="table-footer-pagination">
          <span>Menampilkan {filteredDocs.length} dari {documents.length} dokumen</span>
          <div className="pagination-btn-group">
            <button type="button" className="page-num-btn" disabled><ChevronLeft size={14} /></button>
            <button type="button" className={`page-num-btn ${currentPage === 1 ? 'active' : ''}`} onClick={() => setCurrentPage(1)}>1</button>
            <button type="button" className="page-num-btn" disabled><ChevronRight size={14} /></button>
          </div>
        </div>
      </div>

      {/* Modal Atur Label */}
      {editingDoc && (
        <ModalAturLabel
          document={editingDoc}
          onClose={() => setEditingDoc(null)}
          onSave={handleSaveCategory}
        />
      )}

      {/* Modal Unggah */}
      {showUnggahModal && (
        <ModalUnggahDokumen
          onClose={() => setShowUnggahModal(false)}
          onUploaded={loadDocuments}
          showToast={showToast}
        />
      )}
    </div>
  );
}
