import React, { useState } from 'react';
import { 
  Download, 
  Search, 
  FileText, 
  Edit3, 
  ChevronLeft, 
  ChevronRight,
  FolderArchive 
} from 'lucide-react';
import ModalEditDokumen from './ModalEditDokumen.jsx';

export default function AnggotaVault({ showToast }) {
  const [activeFilter, setActiveFilter] = useState('Semua');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingDoc, setEditingDoc] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  const initialDocs = [
    {
      id: 1,
      nama: 'LPJ SIOMAS Fest 2024',
      label: 'LPJ',
      divisi: 'Acara',
      diperbarui: '18 Nov 2024',
      ukuran: '2.4 MB',
      status: 'Approved',
      statusType: 'green',
      tags: ['2024', 'Divisi Acara']
    },
    {
      id: 2,
      nama: 'Proposal Workshop Leadership',
      label: 'Proposal',
      divisi: 'PSDM',
      diperbarui: '15 Nov 2024',
      ukuran: '1.8 MB',
      status: 'Approved',
      statusType: 'green',
      tags: ['PSDM', 'Pelatihan']
    },
    {
      id: 3,
      nama: 'Surat Peminjaman Aula',
      label: 'Surat',
      divisi: 'Sekretariat',
      diperbarui: '12 Nov 2024',
      ukuran: '540 KB',
      status: 'Active',
      statusType: 'green',
      tags: ['Sarpras', 'Aula']
    },
    {
      id: 4,
      nama: 'Sipakamase Periode Oktober',
      label: 'Sipakamase',
      divisi: 'Bendahara',
      diperbarui: '02 Nov 2024',
      ukuran: '3.1 MB',
      status: 'Approved',
      statusType: 'green',
      tags: ['Keuangan', 'Audit']
    },
    {
      id: 5,
      nama: 'LPJ Bakti Sosial',
      label: 'LPJ',
      divisi: 'Humas',
      diperbarui: '28 Okt 2024',
      ukuran: '4.5 MB',
      status: 'Revision',
      statusType: 'orange',
      tags: ['Baksos', 'Revisi']
    }
  ];

  const [documents, setDocuments] = useState(initialDocs);

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

  const handleDownload = (doc) => {
    showToast(`Mengunduh berkas ${doc.nama} (${doc.ukuran})...`, 'success');
    // Simulate blob download
    const element = document.createElement('a');
    const file = new Blob([`SIOMAS Repository Vault - ${doc.nama}\nDivisi: ${doc.divisi}\nLabel: ${doc.label}\nStatus: ${doc.status}`], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `${doc.nama}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleDownloadBundle = () => {
    showToast('Mengunduh seluruh arsip dokumen aktif (.ZIP)...', 'success');
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

          <button 
            type="button" 
            className="portal-outline-btn"
            style={{ width: 'auto', display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px' }}
            onClick={handleDownloadBundle}
          >
            <Download size={16} /> Unduh Bundel
          </button>
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
                {filter === 'Semua' ? 'Semua 24' : filter}
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
                <th>Divisi</th>
                <th>Diperbarui</th>
                <th>Ukuran</th>
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
                          <div className="doc-sub-text">PDF Document</div>
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
                    Tidak ada dokumen yang sesuai dengan pencarian atau filter "{activeFilter}".
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer Pagination */}
        <div className="table-footer-pagination">
          <span>Menampilkan 1-{filteredDocs.length} dari 24 dokumen</span>
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
            <button 
              type="button" 
              className={`page-num-btn ${currentPage === 2 ? 'active' : ''}`}
              onClick={() => setCurrentPage(2)}
            >
              2
            </button>
            <button 
              type="button" 
              className={`page-num-btn ${currentPage === 3 ? 'active' : ''}`}
              onClick={() => setCurrentPage(3)}
            >
              3
            </button>
            <button type="button" className="page-num-btn">
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
