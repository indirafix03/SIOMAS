import React, { useState, useEffect } from 'react';
import {
  Download,
  Search,
  FileText,
  Edit3,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import ModalEditDokumen from './ModalEditDokumen.jsx';
import { documentsApi } from '../../services/api.js';

export default function AnggotaVault({ showToast }) {
  const [activeFilter, setActiveFilter] = useState('Semua');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingDoc, setEditingDoc] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [documents, setDocuments] = useState([]);

  useEffect(() => {
    const loadDocs = async () => {
      const res = await documentsApi.getAll();
      if (res.ok && res.data?.data) {
        const mapped = res.data.data.map((d) => ({
          id: d.id,
          nama: d.nama_berkas,
          label: d.kategori,
          divisi: d.uploader_name || 'Organisasi',
          diperbarui: 'Terbaru',
          ukuran: 'PDF',
          status: d.status,
          statusType: d.status === 'Approved' ? 'green' : 'orange',
          tags: [d.kategori]
        }));
        setDocuments(mapped);
      }
    };
    loadDocs();
  }, []);

  const filterOptions = ['Semua', 'LPJ', 'Proposal', 'Surat', 'Sipakamase'];

  const filteredDocs = documents.filter((doc) => {
    const matchesCategory = activeFilter === 'Semua' || doc.label.toLowerCase() === activeFilter.toLowerCase();
    const matchesSearch = doc.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          doc.divisi.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          doc.label.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleSaveCategory = (updatedDoc) => {
    setDocuments(documents.map((d) => d.id === updatedDoc.id ? updatedDoc : d));
    setEditingDoc(null);
    showToast(`Kategorisasi dokumen "${updatedDoc.nama}" berhasil diperbarui.`, 'success');
  };

  const handleDownload = async (doc) => {
    const ok = await documentsApi.download(doc.id, doc.nama);
    if (ok) {
      showToast(`Mengunduh berkas ${doc.nama}...`, 'success');
    } else {
      showToast('Gagal mengunduh berkas.', 'error');
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="page-header-block">
        <div className="page-title-row">
          <div>
            <span className="page-category-tag">PUSAT DOKUMEN</span>
            <h1 className="page-title">Repository Vault</h1>
            <p className="page-subtitle">Kelola dan temukan dokumen organisasi dalam satu tempat.</p>
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="portal-card" style={{ padding: '24px' }}>
        {/* Search & Filter Row */}
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

        {/* Data Table */}
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
              {filteredDocs.length > 0 ? (
                filteredDocs.map((doc) => (
                  <tr key={doc.id}>
                    <td>
                      <div className="doc-name-cell">
                        <div className="doc-icon-wrap">
                          <FileText size={18} />
                        </div>
                        <div>
                          <div className="doc-title-text">{doc.nama}</div>
                          <div className="doc-sub-text">Dokumen Organisasi</div>
                        </div>
                      </div>
                    </td>

                    <td>
                      <span className={`tag-badge ${
                        doc.label === 'LPJ' ? 'tag-purple' :
                        doc.label === 'Proposal' ? 'tag-gray' :
                        doc.label === 'Sipakamase' ? 'tag-orange' : 'tag-gray'
                      }`}>
                        {doc.label}
                      </span>
                    </td>

                    <td>{doc.divisi}</td>
                    <td>{doc.diperbarui}</td>
                    <td>{doc.ukuran}</td>

                    <td>
                      <span className="status-dot-badge">
                        <span className={doc.statusType === 'green' ? 'dot-green' : 'dot-orange'} />
                        <span style={{ color: doc.statusType === 'green' ? '#047857' : '#B45309' }}>
                          {doc.status}
                        </span>
                      </span>
                    </td>

                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '6px' }}>
                        <button
                          type="button"
                          className="table-action-btn"
                          title="Ubah Label & Tag"
                          onClick={() => setEditingDoc(doc)}
                        >
                          <Edit3 size={16} />
                        </button>
                        <button
                          type="button"
                          className="table-action-btn"
                          title="Unduh Berkas"
                          onClick={() => handleDownload(doc)}
                        >
                          <Download size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: '#94A3B8' }}>
                    Belum ada dokumen di Repository Vault.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer Pagination */}
        <div className="table-footer-pagination">
          <span>Menampilkan {filteredDocs.length} dari {documents.length} dokumen</span>
          <div className="pagination-btn-group">
            <button type="button" className="page-num-btn" disabled>
              <ChevronLeft size={14} />
            </button>
            <button
              type="button"
              className={`page-num-btn ${currentPage === 1 ? 'active' : ''}`}
              onClick={() => setCurrentPage(1)}
            >
              1
            </button>
            <button type="button" className="page-num-btn" disabled>
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Edit Kategorisasi Modal */}
      {editingDoc && (
        <ModalEditDokumen
          document={editingDoc}
          onClose={() => setEditingDoc(null)}
          onSave={handleSaveCategory}
        />
      )}
    </div>
  );
}
