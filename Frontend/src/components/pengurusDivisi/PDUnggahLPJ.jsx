import React, { useState, useEffect, useRef } from 'react';
import { Upload, Shield, FileText, AlertCircle, CheckCircle2, RefreshCw, Edit3, Trash2, Bookmark } from 'lucide-react';
import { lpjApi } from '../../services/api.js';

const DRAFTS_STORAGE_KEY = 'siomas_lpj_saved_drafts';
const ACTIVE_FORM_KEY = 'siomas_lpj_active_form';

export default function PDUnggahLPJ({ showToast }) {
  const [form, setForm] = useState(() => {
    try {
      const savedActive = localStorage.getItem(ACTIVE_FORM_KEY);
      if (savedActive) {
        const parsed = JSON.parse(savedActive);
        return {
          judulLPJ: parsed.judulLPJ || '',
          divisi: parsed.divisi || 'Divisi Acara',
          deskripsi: parsed.deskripsi || '',
          file: null,
          fileName: '',
          fileSize: ''
        };
      }
    } catch (_) {}
    return {
      judulLPJ: '',
      divisi: 'Divisi Acara',
      deskripsi: '',
      file: null,
      fileName: '',
      fileSize: ''
    };
  });
  const [savedDrafts, setSavedDrafts] = useState(() => {
    try {
      const raw = localStorage.getItem(DRAFTS_STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (_) {
      return [];
    }
  });
  const [activeDraftId, setActiveDraftId] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [status, setStatus] = useState('Draf');
  const [submitting, setSubmitting] = useState(false);
  const [mySubmissions, setMySubmissions] = useState([]);
  const [editingDocId, setEditingDocId] = useState(null);
  const fileInputRef = useRef(null);

  // Auto-save form text ke localStorage agar tidak hilang saat berpindah menu
  useEffect(() => {
    try {
      localStorage.setItem(
        ACTIVE_FORM_KEY,
        JSON.stringify({
          judulLPJ: form.judulLPJ,
          divisi: form.divisi,
          deskripsi: form.deskripsi
        })
      );
    } catch (_) {}
  }, [form.judulLPJ, form.divisi, form.deskripsi]);

  const persistDraftsList = (nextList) => {
    setSavedDrafts(nextList);
    try {
      localStorage.setItem(DRAFTS_STORAGE_KEY, JSON.stringify(nextList));
    } catch (_) {}
  };

  const loadMySubmissions = async () => {
    const res = await lpjApi.getMySubmissions();
    if (res.ok && res.data?.data) {
      setMySubmissions(res.data.data);
    }
  };

  useEffect(() => {
    loadMySubmissions();
  }, []);

  const formatBytes = (bytes) => {
    if (!bytes) return '0 KB';
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const handleFileChosen = (chosenFile) => {
    if (!chosenFile) return;
    const ext = chosenFile.name.includes('.')
      ? `.${chosenFile.name.split('.').pop().toLowerCase()}`
      : '';
    if (ext !== '.pdf') {
      if (fileInputRef.current) fileInputRef.current.value = '';
      showToast &&
        showToast(
          `Format berkas "${chosenFile.name}" ditolak! Pengurus Divisi hanya dapat mengunggah berkas PDF (.pdf).`,
          'error'
        );
      return;
    }
    if (chosenFile.size > 10 * 1024 * 1024) {
      if (fileInputRef.current) fileInputRef.current.value = '';
      showToast && showToast('Ukuran berkas melebihi batas maksimal 10 MB.', 'error');
      return;
    }
    setForm((prev) => ({
      ...prev,
      file: chosenFile,
      fileName: chosenFile.name,
      fileSize: formatBytes(chosenFile.size)
    }));
    showToast && showToast(`Berkas PDF "${chosenFile.name}" berhasil dipilih.`, 'success');
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer?.files?.[0]) {
      handleFileChosen(e.dataTransfer.files[0]);
    }
  };

  const handlePrepareRevision = (doc) => {
    const rawName = doc.nama_berkas || '';
    const match = rawName.match(/^(.+?)\s*\((.+)\)$/);
    const cleanTitle = match ? match[1].trim() : rawName;
    const cleanDiv = match ? match[2].trim() : 'Divisi Acara';
    setEditingDocId(doc.id);
    setStatus('Revisi');
    setForm((prev) => ({
      ...prev,
      judulLPJ: cleanTitle,
      divisi: cleanDiv,
      deskripsi: doc.catatan_revisi ? `Perbaikan atas catatan: ${doc.catatan_revisi}` : ''
    }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
    showToast && showToast('Mode perbaikan aktif: silakan pilih berkas LPJ baru lalu klik Unggah Perbaikan LPJ.', 'info');
  };

  const handleResumeDraft = (draft) => {
    setActiveDraftId(draft.id);
    setEditingDocId(null);
    setStatus('Draf');
    setForm((prev) => ({
      ...prev,
      judulLPJ: draft.judulLPJ || '',
      divisi: draft.divisi || 'Divisi Acara',
      deskripsi: draft.deskripsi || ''
    }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
    showToast && showToast(`Draf "${draft.judulLPJ}" dimuat kembali ke formulir. Silakan lanjutkan pengisian.`, 'info');
  };

  const handleDeleteDraft = (draftId) => {
    const updated = savedDrafts.filter((d) => d.id !== draftId);
    persistDraftsList(updated);
    if (activeDraftId === draftId) setActiveDraftId(null);
    showToast && showToast('Draf lokal berhasil dihapus.', 'info');
  };

  const handleSubmit = async (isDraf = false) => {
    if (!form.judulLPJ.trim()) {
      showToast && showToast('Harap isi Judul LPJ terlebih dahulu.', 'warning');
      return;
    }

    // Jika klik "Simpan sebagai Draf", simpan ke Draf Tersimpan (localStorage) agar bisa dilanjutkan nanti
    if (isDraf) {
      const nowStr = new Date().toLocaleString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      const draftItem = {
        id: activeDraftId || Date.now(),
        judulLPJ: form.judulLPJ.trim(),
        divisi: form.divisi,
        deskripsi: form.deskripsi.trim(),
        lastFileName: form.fileName || '',
        savedAt: nowStr
      };
      const exists = savedDrafts.some((d) => d.id === draftItem.id);
      const nextDrafts = exists
        ? savedDrafts.map((d) => (d.id === draftItem.id ? draftItem : d))
        : [draftItem, ...savedDrafts];

      persistDraftsList(nextDrafts);
      setActiveDraftId(draftItem.id);
      setStatus('Draf Tersimpan');
      showToast &&
        showToast(
          `Draf LPJ "${draftItem.judulLPJ}" berhasil disimpan! Anda dapat melanjutkan pengisian kapan saja pada bagian Draf Tersimpan di bawah.`,
          'success'
        );
      return;
    }

    const uploadFile = form.file;
    if (!uploadFile) {
      showToast && showToast('Harap pilih berkas LPJ berformat PDF (.pdf) terlebih dahulu sebelum mengunggah.', 'warning');
      return;
    }

    setSubmitting(true);
    const namaBerkas = `${form.judulLPJ.trim()} (${form.divisi})`;
    const targetDocId = editingDocId || (revisiDocs.length > 0 ? revisiDocs[0].id : null);
    const res = targetDocId
      ? await lpjApi.updateDraft(targetDocId, uploadFile, namaBerkas)
      : await lpjApi.uploadDraft(uploadFile, namaBerkas);
    setSubmitting(false);

    if (res.ok) {
      setStatus('Terkirim');
      showToast && showToast(
        targetDocId
          ? `Perbaikan LPJ "${form.judulLPJ}" berhasil dikirim ulang ke Admin/Ketua!`
          : `LPJ "${form.judulLPJ}" berhasil diunggah dan masuk ke antrean validasi Admin/Ketua!`,
        'success'
      );
      if (activeDraftId) {
        persistDraftsList(savedDrafts.filter((d) => d.id !== activeDraftId));
        setActiveDraftId(null);
      }
      setEditingDocId(null);
      setForm({
        judulLPJ: '',
        divisi: 'Divisi Acara',
        deskripsi: '',
        file: null,
        fileName: '',
        fileSize: ''
      });
      try {
        localStorage.removeItem(ACTIVE_FORM_KEY);
      } catch (_) {}
      if (fileInputRef.current) fileInputRef.current.value = '';
      loadMySubmissions();
    } else {
      showToast && showToast(res.data?.message || 'Gagal mengunggah LPJ.', 'error');
    }
  };

  const revisiDocs = mySubmissions.filter((d) => d.status === 'Revisi');

  return (
    <div>
      {/* Header */}
      <div className="page-header-block">
        <span className="page-category-tag">MODUL KOORDINATOR</span>
        <h1 className="page-title">Unggah Draf LPJ</h1>
        <p className="page-subtitle">Kirim laporan pertanggungjawaban divisi untuk proses validasi Ketua/Admin.</p>
      </div>

      {/* Banner Peringatan Revisi dari Admin/Ketua jika ada LPJ berstatus Revisi */}
      {revisiDocs.length > 0 && (
        <div style={{
          background: '#FEF2F2',
          border: '1.5px solid #FECACA',
          borderRadius: '14px',
          padding: '16px 20px',
          marginBottom: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#DC2626', fontWeight: 800, fontSize: '13.5px' }}>
            <AlertCircle size={18} />
            <span>Terdapat {revisiDocs.length} Dokumen LPJ yang Memerlukan Revisi dari Admin / Ketua UKM:</span>
          </div>
          {revisiDocs.map((doc) => (
            <div key={doc.id} style={{
              background: '#FFFFFF',
              border: '1px solid #FEE2E2',
              borderRadius: '10px',
              padding: '12px 16px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '12px',
              flexWrap: 'wrap'
            }}>
              <div>
                <div style={{ fontSize: '13.5px', fontWeight: 700, color: '#0F172A' }}>{doc.nama_berkas}</div>
                <div style={{ fontSize: '13px', color: '#B91C1C', marginTop: '3px', fontWeight: 600 }}>
                  Pesan Revisi ({doc.approver_name || 'Admin / Ketua UKM'}): &ldquo;{doc.catatan_revisi || 'Mohon perbaiki sesuai pedoman administrasi.'}&rdquo;
                </div>
              </div>
              <button
                type="button"
                onClick={() => handlePrepareRevision(doc)}
                style={{
                  background: '#DC2626',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '8px 14px',
                  fontSize: '12.5px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <RefreshCw size={14} /> Perbaiki &amp; Unggah Ulang
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Two-column layout */}
      <div className="responsive-hub-grid">
        {/* Left: Main Form */}
        <div style={{ minWidth: 0 }}>
          <div className="portal-card" style={{ padding: '28px', marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h3 className="portal-card-title">Informasi Dokumen</h3>
                <p className="portal-card-subtitle">Pastikan detail dokumen sudah sesuai.</p>
              </div>
              <span style={{
                fontSize: '12px', fontWeight: 700, padding: '4px 12px', borderRadius: '20px',
                background: status === 'Draf' ? '#FFEDD5' : '#DCFCE7',
                color: status === 'Draf' ? '#EA580C' : '#16A34A'
              }}>
                {status}
              </span>
            </div>

            {/* Judul & Divisi */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div className="portal-form-group">
                <label className="portal-form-label">Judul LPJ</label>
                <input
                  className="portal-input"
                  placeholder="Contoh: LPJ Kegiatan Pengabdian Masyarakat"
                  value={form.judulLPJ}
                  onChange={(e) => setForm({ ...form, judulLPJ: e.target.value })}
                />
              </div>
              <div className="portal-form-group">
                <label className="portal-form-label">Divisi</label>
                <div style={{ position: 'relative' }}>
                  <select
                    className="portal-select"
                    value={form.divisi}
                    onChange={(e) => setForm({ ...form, divisi: e.target.value })}
                  >
                    <option>Divisi Acara</option>
                    <option>PSDM</option>
                    <option>Sekretariat</option>
                    <option>Bendahara</option>
                    <option>Humas</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Deskripsi */}
            <div className="portal-form-group" style={{ marginBottom: '20px' }}>
              <label className="portal-form-label">Deskripsi singkat</label>
              <textarea
                className="portal-textarea"
                rows="4"
                placeholder="Tuliskan ringkasan kegiatan dan pertanggungjawaban..."
                value={form.deskripsi}
                onChange={(e) => setForm({ ...form, deskripsi: e.target.value })}
              />
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              style={{ display: 'none' }}
              onChange={(e) => handleFileChosen(e.target.files?.[0])}
            />

            {/* File Dropzone */}
            <div
              style={{
                border: `2px dashed ${isDragging ? '#6366F1' : '#CBD5E1'}`,
                borderRadius: '14px',
                padding: '48px 24px',
                textAlign: 'center',
                cursor: 'pointer',
                background: isDragging ? '#EEF2FF' : form.fileName ? '#F0FDF4' : '#FAFAFA',
                transition: 'all 0.2s',
                marginBottom: '8px'
              }}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <div style={{ width: '52px', height: '52px', background: '#EEF2FF', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px', color: '#6366F1' }}>
                <Upload size={24} />
              </div>
              {form.fileName ? (
                <>
                  <p style={{ fontSize: '15px', fontWeight: 700, color: '#10B981', marginBottom: '4px' }}>{form.fileName}</p>
                  <p style={{ fontSize: '13px', color: '#64748B' }}>Ukuran: {form.fileSize}</p>
                </>
              ) : (
                <>
                  <p style={{ fontSize: '15px', fontWeight: 700, color: '#0F172A', marginBottom: '6px' }}>Seret &amp; lepas berkas ke sini</p>
                  <p style={{ fontSize: '13px', color: '#64748B', marginBottom: '4px' }}>
                    atau <span style={{ color: '#6366F1', fontWeight: 600 }}>pilih dari perangkat</span>
                  </p>
                  <p style={{ fontSize: '12px', color: '#94A3B8' }}>Khusus Format PDF (.pdf) • Maksimal 10 MB</p>
                </>
              )}
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', paddingTop: '16px', borderTop: '1px solid #F1F5F9' }}>
              <button
                type="button"
                className="portal-outline-btn"
                style={{ width: 'auto', padding: '10px 20px', fontSize: '13.5px' }}
                disabled={submitting}
                onClick={() => handleSubmit(true)}
              >
                Simpan sebagai Draf
              </button>
              <button
                type="button"
                className="btn-primary-glow"
                style={{ padding: '10px 24px', fontSize: '13.5px' }}
                disabled={submitting}
                onClick={() => handleSubmit(false)}
              >
                <Upload size={15} style={{ marginRight: '6px' }} /> {submitting ? 'Mengunggah...' : editingDocId ? 'Unggah Perbaikan LPJ' : 'Unggah LPJ'}
              </button>
            </div>
          </div>

          {/* Daftar Draf LPJ Tersimpan (Lokal - Bisa Dilanjutkan Kapan Saja) */}
          {savedDrafts.length > 0 && (
            <div className="portal-card" style={{ padding: '24px', marginBottom: '24px', border: '1.5px solid #FED7AA', background: '#FFFBEB' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Bookmark size={18} color="#EA580C" />
                  <h3 className="portal-card-title" style={{ margin: 0, color: '#9A3412' }}>
                    Draf LPJ Tersimpan ({savedDrafts.length})
                  </h3>
                </div>
                <span style={{ fontSize: '11.5px', fontWeight: 700, color: '#C2410C', background: '#FFEDD5', padding: '3px 10px', borderRadius: '999px' }}>
                  Belum Diajukan ke Ketua
                </span>
              </div>
              <p style={{ fontSize: '12.5px', color: '#9A3412', marginBottom: '14px' }}>
                Draf di bawah ini tersimpan di perangkat Anda. Klik <strong>Lanjutkan Pengisian</strong> untuk memuat kembali isian ke formulir di atas.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {savedDrafts.map((dr) => (
                  <div
                    key={dr.id}
                    style={{
                      background: '#FFFFFF',
                      border: activeDraftId === dr.id ? '2px solid #EA580C' : '1px solid #FED7AA',
                      borderRadius: '10px',
                      padding: '12px 16px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: '12px',
                      flexWrap: 'wrap'
                    }}
                  >
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ fontSize: '13.5px', fontWeight: 700, color: '#0F172A' }}>
                        {dr.judulLPJ} <span style={{ fontWeight: 500, color: '#64748B' }}>({dr.divisi})</span>
                      </div>
                      {dr.deskripsi && (
                        <div style={{ fontSize: '12.5px', color: '#475569', marginTop: '2px' }}>
                          {dr.deskripsi.length > 100 ? `${dr.deskripsi.slice(0, 100)}...` : dr.deskripsi}
                        </div>
                      )}
                      <div style={{ fontSize: '11.5px', color: '#94A3B8', marginTop: '4px' }}>
                        Disimpan pada: {dr.savedAt}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <button
                        type="button"
                        onClick={() => handleResumeDraft(dr)}
                        style={{
                          background: '#EA580C',
                          color: '#FFFFFF',
                          border: 'none',
                          borderRadius: '8px',
                          padding: '7px 12px',
                          fontSize: '12px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '5px',
                          fontFamily: 'inherit'
                        }}
                      >
                        <Edit3 size={13} /> Lanjutkan Pengisian
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteDraft(dr.id)}
                        title="Hapus Draf"
                        style={{
                          background: '#FEF2F2',
                          color: '#DC2626',
                          border: '1px solid #FECACA',
                          borderRadius: '8px',
                          padding: '7px 10px',
                          fontSize: '12px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center'
                        }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Riwayat LPJ yang Diunggah */}
          <div className="portal-card" style={{ padding: '24px' }}>
            <h3 className="portal-card-title" style={{ marginBottom: '4px' }}>Riwayat Pengajuan LPJ Saya</h3>
            <p className="portal-card-subtitle" style={{ marginBottom: '16px' }}>Status validasi dan catatan langsung dari Admin / Ketua UKM.</p>

            {mySubmissions.length === 0 ? (
              <div style={{ padding: '24px', textAlign: 'center', color: '#94A3B8', fontSize: '13px', background: '#F8FAFC', borderRadius: '10px' }}>
                Belum ada LPJ yang diunggah.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {mySubmissions.map((doc) => (
                  <div
                    key={doc.id}
                    style={{
                      padding: '14px 16px',
                      border: `1.5px solid ${doc.status === 'Revisi' ? '#FECACA' : doc.status === 'Approved' ? '#BBF7D0' : '#F1F5F9'}`,
                      background: doc.status === 'Revisi' ? '#FFFBFB' : '#FFFFFF',
                      borderRadius: '12px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                          width: '36px', height: '36px',
                          background: doc.status === 'Revisi' ? '#FEE2E2' : '#EEF2FF',
                          borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: doc.status === 'Revisi' ? '#DC2626' : '#4F46E5'
                        }}>
                          <FileText size={18} />
                        </div>
                        <div>
                          <div style={{ fontSize: '13.5px', fontWeight: 700, color: '#0F172A' }}>{doc.nama_berkas}</div>
                          <div style={{ fontSize: '12px', color: '#64748B' }}>Pengunggah: {doc.uploader_name || 'Pengurus'}</div>
                        </div>
                      </div>
                      <span style={{
                        fontSize: '12px', fontWeight: 700, padding: '4px 12px', borderRadius: '999px',
                        background: doc.status === 'Approved' ? '#DCFCE7' : doc.status === 'Revisi' ? '#FEE2E2' : '#FEF3C7',
                        color: doc.status === 'Approved' ? '#15803D' : doc.status === 'Revisi' ? '#B91C1C' : '#D97706'
                      }}>
                        {doc.status === 'Draft' ? 'Menunggu Validasi' : doc.status === 'Revisi' ? 'Perlu Revisi' : 'Valid / Disetujui'}
                      </span>
                    </div>

                    {/* Kotak Catatan Revisi / Persetujuan dari Admin */}
                    {doc.status === 'Revisi' && (
                      <div style={{
                        marginTop: '10px',
                        padding: '10px 12px',
                        background: '#FEF2F2',
                        border: '1px solid #FECACA',
                        borderRadius: '8px',
                        fontSize: '12.5px',
                        color: '#991B1B',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '8px'
                      }}>
                        <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '1px', color: '#DC2626' }} />
                        <div>
                          <strong>Catatan Revisi dari {doc.approver_name || 'Admin / Ketua UKM'}:</strong>
                          <div style={{ marginTop: '2px' }}>{doc.catatan_revisi || 'Mohon perbaiki dokumen sesuai pedoman administrasi.'}</div>
                        </div>
                      </div>
                    )}

                    {doc.status === 'Approved' && doc.catatan_revisi && (
                      <div style={{
                        marginTop: '10px',
                        padding: '8px 12px',
                        background: '#F0FDF4',
                        border: '1px solid #BBF7D0',
                        borderRadius: '8px',
                        fontSize: '12px',
                        color: '#166534',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}>
                        <CheckCircle2 size={14} style={{ flexShrink: 0, color: '#16A34A' }} />
                        <span><strong>Catatan Validator ({doc.approver_name || 'Admin'}):</strong> {doc.catatan_revisi}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: Panduan */}
        <div className="portal-card" style={{ padding: '24px' }}>
          <div style={{ width: '44px', height: '44px', background: '#EEF2FF', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: '#6366F1' }}>
            <Shield size={22} />
          </div>
          <h4 style={{ fontSize: '16px', fontWeight: 700, color: '#0F172A', marginBottom: '16px', textAlign: 'center' }}>
            Panduan pengunggahan
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {[
              'Gunakan format dokumen resmi',
              'Pastikan tanda tangan lengkap',
              'Ukuran berkas maksimal 10 MB',
              'Admin akan meninjau dalam 2×24 jam'
            ].map((tip) => (
              <div key={tip} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                <div style={{ width: '18px', height: '18px', background: '#DCFCE7', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '1px' }}>
                  <svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="#16A34A" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </div>
                <span style={{ fontSize: '13px', color: '#475569' }}>{tip}</span>
              </div>
            ))}
          </div>

          <div style={{ marginTop: '24px', padding: '16px', background: '#F8FAFC', borderRadius: '10px' }}>
            <h5 style={{ fontSize: '13px', fontWeight: 700, color: '#0F172A', marginBottom: '6px' }}>Butuh bantuan?</h5>
            <p style={{ fontSize: '12px', color: '#64748B', lineHeight: '1.5' }}>
              Hubungi sekretariat melalui Hub Inter-UKM.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
