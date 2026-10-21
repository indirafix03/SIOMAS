import React, { useState } from 'react';
import { 
  ChevronLeft, 
  UploadCloud, 
  ShieldCheck, 
  CheckCircle2, 
  FileText, 
  Image as ImageIcon 
} from 'lucide-react';

export default function AnggotaFormPublikasi({ onBack, onSubmitSuccess, showToast }) {
  const [formData, setFormData] = useState({
    judul: '',
    kategori: 'Kolaborasi',
    target: 'Seluruh UKM Kampus',
    deskripsi: '',
    tanggal: '24–26 November 2024',
    lokasi: 'Student Center Kampus',
    pic: 'Ardi Pratama',
    whatsapp: '+62 812 3456 7890',
    proposalFile: 'Proposal_Campus_Collaboration.pdf',
    fotoFile: 'Banner_Preview.png',
    isAgreed: false
  });

  const handleSubmit = (asDraft = false) => {
    if (!formData.judul) {
      showToast('Harap masukkan Judul Publikasi.', 'warning');
      return;
    }
    if (!asDraft && !formData.isAgreed) {
      showToast('Harap centang konfirmasi kesesuaian data publikasi BR-02.', 'warning');
      return;
    }

    if (asDraft) {
      showToast('Draf publikasi kolaborasi berhasil disimpan.', 'info');
    } else {
      showToast('Publikasi kolaborasi berhasil diajukan untuk verifikasi Ketua UKM!', 'success');
    }
    onSubmitSuccess && onSubmitSuccess();
  };

  return (
    <div>
      {/* Back button */}
      <button type="button" className="back-link-btn" onClick={onBack}>
        <ChevronLeft size={16} /> Kembali ke Hub Inter-UKM
      </button>

      {/* Header */}
      <div className="page-header-block">
        <span className="page-category-tag">PUBLIKASI INTER-UKM</span>
        <h1 className="page-title">Buat Publikasi Kolaborasi</h1>
        <p className="page-subtitle">Lengkapi informasi kegiatan untuk ditinjau sebelum disiarkan ke seluruh organisasi kampus.</p>
      </div>

      <div className="detail-layout-grid">
        {/* Left Form */}
        <div className="detail-main-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <div>
              <h3 style={{ fontSize: '17px', fontWeight: 800, color: '#0F172A', margin: 0 }}>Informasi Publikasi</h3>
              <p style={{ fontSize: '12.5px', color: '#64748B', margin: '3px 0 0' }}>Data ini akan tampil pada feed Hub Inter-UKM.</p>
            </div>
            <span className="tag-badge tag-gray" style={{ letterSpacing: '0.5px' }}>DRAF</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {/* Judul */}
            <div className="portal-form-group">
              <label className="portal-form-label">Judul Publikasi</label>
              <input 
                type="text"
                className="portal-input"
                placeholder="Contoh: Open Collaboration SIOMAS Leadership Camp"
                value={formData.judul}
                onChange={(e) => setFormData({ ...formData, judul: e.target.value })}
              />
            </div>

            {/* Row Kategori & Target */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="portal-form-group">
                <label className="portal-form-label">Kategori</label>
                <select 
                  className="portal-select"
                  value={formData.kategori}
                  onChange={(e) => setFormData({ ...formData, kategori: e.target.value })}
                >
                  <option value="Kolaborasi">Kolaborasi</option>
                  <option value="Acara">Acara Kampus</option>
                  <option value="Media Partner">Media Partner</option>
                </select>
              </div>

              <div className="portal-form-group">
                <label className="portal-form-label">Target Publikasi</label>
                <select 
                  className="portal-select"
                  value={formData.target}
                  onChange={(e) => setFormData({ ...formData, target: e.target.value })}
                >
                  <option value="Seluruh UKM Kampus">Seluruh UKM Kampus</option>
                  <option value="BEM & DPM Saja">BEM & DPM Saja</option>
                  <option value="UKM Seni & Olahraga">UKM Seni & Olahraga</option>
                </select>
              </div>
            </div>

            {/* Deskripsi Kegiatan */}
            <div className="portal-form-group">
              <label className="portal-form-label">Deskripsi Kegiatan</label>
              <textarea 
                className="portal-textarea"
                rows="4"
                placeholder="Jelaskan tujuan, ruang lingkup, dan bentuk kolaborasi yang ditawarkan..."
                value={formData.deskripsi}
                onChange={(e) => setFormData({ ...formData, deskripsi: e.target.value })}
              />
            </div>

            {/* Tanggal & Lokasi */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="portal-form-group">
                <label className="portal-form-label">Tanggal Pelaksanaan</label>
                <input 
                  type="text"
                  className="portal-input"
                  value={formData.tanggal}
                  onChange={(e) => setFormData({ ...formData, tanggal: e.target.value })}
                />
              </div>

              <div className="portal-form-group">
                <label className="portal-form-label">Lokasi</label>
                <input 
                  type="text"
                  className="portal-input"
                  placeholder="Student Center Kampus"
                  value={formData.lokasi}
                  onChange={(e) => setFormData({ ...formData, lokasi: e.target.value })}
                />
              </div>
            </div>

            {/* PIC & WA */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="portal-form-group">
                <label className="portal-form-label">Nama Narahubung</label>
                <input 
                  type="text"
                  className="portal-input"
                  placeholder="Nama lengkap PIC"
                  value={formData.pic}
                  onChange={(e) => setFormData({ ...formData, pic: e.target.value })}
                />
              </div>

              <div className="portal-form-group">
                <label className="portal-form-label">Nomor WhatsApp</label>
                <input 
                  type="text"
                  className="portal-input"
                  placeholder="+62 812 3456 7890"
                  value={formData.whatsapp}
                  onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                />
              </div>
            </div>

            {/* Lampiran Proposal */}
            <div className="portal-dropzone">
              <div className="dropzone-left">
                <div className="dropzone-icon">
                  <FileText size={20} />
                </div>
                <div className="dropzone-text">
                  <h5>Lampirkan proposal kolaborasi</h5>
                  <p>{formData.proposalFile}</p>
                </div>
              </div>
              <button 
                type="button" 
                className="portal-outline-btn"
                style={{ width: 'auto', padding: '6px 14px', fontSize: '12px' }}
                onClick={() => showToast('Berkas proposal dipilih.', 'success')}
              >
                Pilih Berkas
              </button>
            </div>

            {/* Lampiran Foto Kegiatan */}
            <div className="portal-dropzone">
              <div className="dropzone-left">
                <div className="dropzone-icon" style={{ background: '#ECFDF5', color: '#10B981' }}>
                  <ImageIcon size={20} />
                </div>
                <div className="dropzone-text">
                  <h5>Lampirkan foto kegiatan</h5>
                  <p>{formData.fotoFile}</p>
                </div>
              </div>
              <button 
                type="button" 
                className="portal-outline-btn"
                style={{ width: 'auto', padding: '6px 14px', fontSize: '12px' }}
                onClick={() => showToast('Foto sampul dipilih.', 'success')}
              >
                Pilih Foto
              </button>
            </div>

            {/* Agreement Checkbox */}
            <div style={{ background: '#FFFBEB', border: '1px solid #FEF3C7', borderRadius: '12px', padding: '14px 16px', display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
              <input 
                type="checkbox"
                id="agree_br02"
                checked={formData.isAgreed}
                onChange={(e) => setFormData({ ...formData, isAgreed: e.target.checked })}
                style={{ marginTop: '3px', width: '16px', height: '16px', cursor: 'pointer' }}
              />
              <label htmlFor="agree_br02" style={{ fontSize: '13px', color: '#92400E', cursor: 'pointer', lineHeight: '1.4' }}>
                <strong>Saya memastikan informasi publikasi sudah benar</strong>
                <div style={{ fontSize: '12px', color: '#B45309', marginTop: '2px' }}>
                  Konten mengikuti ketentuan publikasi lintas organisasi BR-02.
                </div>
              </label>
            </div>

            {/* Buttons */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '14px', marginTop: '12px' }}>
              <button 
                type="button" 
                className="portal-link-btn"
                style={{ fontSize: '14px', color: '#64748B' }}
                onClick={() => handleSubmit(true)}
              >
                Simpan sebagai Draf
              </button>
              <button 
                type="button" 
                className="btn-primary-glow"
                onClick={() => handleSubmit(false)}
              >
                Ajukan Persetujuan
              </button>
            </div>
          </div>
        </div>

        {/* Right Sidebar: Alur BR-02 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="portal-card" style={{ padding: '24px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#EEF2FF', color: '#4F46E5', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
              <ShieldCheck size={22} />
            </div>

            <h4 style={{ fontSize: '16px', fontWeight: 800, color: '#0F172A', marginBottom: '16px' }}>
              Alur Persetujuan BR-02
            </h4>

            {/* Steps */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <div style={{ width: '26px', height: '26px', borderRadius: '50%', background: '#4F46E5', color: '#FFFFFF', fontSize: '12px', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  1
                </div>
                <div>
                  <h5 style={{ fontSize: '13.5px', fontWeight: 700, color: '#0F172A', margin: 0 }}>Lengkapi formulir</h5>
                  <p style={{ fontSize: '12px', color: '#64748B', margin: '2px 0 0' }}>Isi detail dan narahubung.</p>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <div style={{ width: '26px', height: '26px', borderRadius: '50%', background: '#F1F5F9', color: '#64748B', fontSize: '12px', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  2
                </div>
                <div>
                  <h5 style={{ fontSize: '13.5px', fontWeight: 700, color: '#0F172A', margin: 0 }}>Verifikasi Ketua UKM</h5>
                  <p style={{ fontSize: '12px', color: '#64748B', margin: '2px 0 0' }}>Konten diperiksa sebelum tayang.</p>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <div style={{ width: '26px', height: '26px', borderRadius: '50%', background: '#F1F5F9', color: '#64748B', fontSize: '12px', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  3
                </div>
                <div>
                  <h5 style={{ fontSize: '13.5px', fontWeight: 700, color: '#0F172A', margin: 0 }}>Disiarkan ke kampus</h5>
                  <p style={{ fontSize: '12px', color: '#64748B', margin: '2px 0 0' }}>Publikasi tampil di seluruh Hub.</p>
                </div>
              </div>
            </div>
          </div>

          <div style={{ background: '#FAFAFA', border: '1px solid #E2E8F0', borderRadius: '14px', padding: '18px 20px' }}>
            <h5 style={{ fontSize: '13px', fontWeight: 700, color: '#0F172A', margin: '0 0 6px' }}>Standar publikasi</h5>
            <p style={{ fontSize: '12px', color: '#64748B', lineHeight: '1.5', margin: 0 }}>
              Hindari data sensitif dan pastikan kegiatan memiliki jadwal serta narahubung yang valid.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
