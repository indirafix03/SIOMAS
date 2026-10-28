import React, { useState } from 'react';
import { Upload, ChevronDown, Shield } from 'lucide-react';

export default function PDUnggahLPJ({ showToast }) {
  const [form, setForm] = useState({
    judulLPJ: '',
    divisi: 'Divisi Acara',
    deskripsi: '',
    fileName: '',
    fileSize: ''
  });
  const [isDragging, setIsDragging] = useState(false);
  const [status, setStatus] = useState('Draf');

  const handleFileSelect = () => {
    setForm({ ...form, fileName: 'LPJ_SIOMAS_Fest_2024.pdf', fileSize: '12.6 MB' });
    showToast('Berkas berhasil dipilih. Uji validasi berkas...', 'info');
    setTimeout(() => showToast('Berkas lolos validasi format dan ukuran.', 'success'), 1200);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect();
  };

  const handleSubmit = (isDraf = false) => {
    if (!form.judulLPJ.trim()) {
      showToast('Harap isi Judul LPJ terlebih dahulu.', 'warning');
      return;
    }
    if (isDraf) {
      setStatus('Draf');
      showToast(`LPJ "${form.judulLPJ}" disimpan sebagai draf.`, 'success');
    } else {
      if (!form.fileName) {
        showToast('Harap lampirkan berkas LPJ sebelum mengunggah.', 'warning');
        return;
      }
      setStatus('Terkirim');
      showToast(`LPJ "${form.judulLPJ}" berhasil diunggah dan sedang dalam proses validasi admin.`, 'success');
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="page-header-block">
        <span className="page-category-tag">MODUL KOORDINATOR</span>
        <h1 className="page-title">Unggah Draf LPJ</h1>
        <p className="page-subtitle">Kirim laporan pertanggungjawaban divisi untuk proses validasi.</p>
      </div>

      {/* Two-column layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '24px', alignItems: 'start' }}>
        {/* Left: Main Form */}
        <div className="portal-card" style={{ padding: '28px' }}>
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
                placeholder="Contoh: LPJ SIOMAS Fest 2024"
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
            onClick={handleFileSelect}
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
                <p style={{ fontSize: '12px', color: '#94A3B8' }}>Format PDF atau DOCX • Maksimal 10 MB</p>
              </>
            )}
          </div>

          {form.fileName && (
            <p style={{ fontSize: '12px', color: '#6366F1', fontWeight: 600, marginBottom: '20px' }}>
              Uji validasi berkas {form.fileSize}
            </p>
          )}

          {/* Action Buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', paddingTop: '8px', borderTop: '1px solid #F1F5F9' }}>
            <button
              type="button"
              className="portal-outline-btn"
              style={{ width: 'auto', padding: '10px 20px', fontSize: '13.5px' }}
              onClick={() => handleSubmit(true)}
            >
              Simpan sebagai Draf
            </button>
            <button
              type="button"
              className="btn-primary-glow"
              style={{ padding: '10px 24px', fontSize: '13.5px' }}
              onClick={() => handleSubmit(false)}
            >
              <Upload size={15} style={{ marginRight: '6px' }} /> Unggah LPJ
            </button>
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
