import React, { useState } from 'react';
import { X, UploadCloud, Image, Check } from 'lucide-react';

export default function ModalPermintaanKolaborasi({ onClose, onSubmit, showToast }) {
  const [formData, setFormData] = useState({
    namaProgram: '',
    ukmTujuan: 'BEM Universitas',
    bentukKolaborasi: 'Mitra Penyelenggara',
    kontribusiDibutuhkan: '',
    kontribusiDitawarkan: '',
    tanggalPelaksanaan: '24-26 November 2024',
    batasRespons: '20 November 2024',
    namaNarahubung: 'Ardi Pratama',
    nomorWhatsapp: '+62 812 3456 7890',
    fileName: 'Proposal_Kerja_Sama_SIOMAS.pdf',
    kirimNotifikasi: true
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.namaProgram) {
      showToast('Harap isi Nama Program atau Kegiatan.', 'warning');
      return;
    }
    onSubmit(formData);
    showToast('Permintaan kolaborasi berhasil diajukan dan sedang menunggu verifikasi.', 'success');
    onClose();
  };

  return (
    <div className="portal-modal-backdrop" onClick={onClose}>
      <div className="portal-modal-dialog wide" onClick={(e) => e.stopPropagation()}>
        <div className="portal-modal-header">
          <div>
            <h3 className="portal-modal-title">Buat Permintaan Kolaborasi</h3>
            <p className="portal-modal-subtitle">Kirim undangan kerja sama kepada organisasi mahasiswa yang dituju.</p>
          </div>
          <button type="button" className="portal-modal-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="portal-modal-body">
            {/* Nama Program */}
            <div className="portal-form-group">
              <label className="portal-form-label">Nama Program atau Kegiatan</label>
              <input
                type="text"
                className="portal-input"
                placeholder="Contoh: SIOMAS Leadership Camp 2024"
                value={formData.namaProgram}
                onChange={(e) => setFormData({ ...formData, namaProgram: e.target.value })}
                required
              />
            </div>

            {/* UKM Tujuan & Bentuk Kolaborasi */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="portal-form-group">
                <label className="portal-form-label">UKM Tujuan</label>
                <select
                  className="portal-select"
                  value={formData.ukmTujuan}
                  onChange={(e) => setFormData({ ...formData, ukmTujuan: e.target.value })}
                >
                  <option value="BEM Universitas">BEM Universitas</option>
                  <option value="UKM Fotografi">UKM Fotografi</option>
                  <option value="Himpunan Informatika">Himpunan Informatika</option>
                  <option value="UKM Seni & Teater">UKM Seni & Teater</option>
                  <option value="UKM Olahraga">UKM Olahraga</option>
                </select>
              </div>

              <div className="portal-form-group">
                <label className="portal-form-label">Bentuk Kolaborasi</label>
                <select
                  className="portal-select"
                  value={formData.bentukKolaborasi}
                  onChange={(e) => setFormData({ ...formData, bentukKolaborasi: e.target.value })}
                >
                  <option value="Mitra Penyelenggara">Mitra Penyelenggara</option>
                  <option value="Media Partner">Media Partner</option>
                  <option value="Sponsorship">Sponsorship</option>
                  <option value="Delegasi Peserta">Delegasi Peserta</option>
                </select>
              </div>
            </div>

            {/* Gambar Sampul */}
            <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <img 
                  src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=200&auto=format&fit=crop&q=80" 
                  alt="Sampul" 
                  style={{ width: '80px', height: '50px', borderRadius: '8px', objectFit: 'cover' }}
                />
                <div>
                  <h6 style={{ fontSize: '13px', fontWeight: 700, margin: 0, color: '#0F172A' }}>Gambar sampul kolaborasi</h6>
                  <p style={{ fontSize: '11px', color: '#94A3B8', margin: '2px 0 0' }}>JPG atau PNG • Rasio rekomendasi 16:9</p>
                </div>
              </div>
              <button 
                type="button" 
                className="portal-outline-btn" 
                style={{ width: 'auto', padding: '6px 14px', fontSize: '12px' }}
                onClick={() => showToast('Pilih gambar baru dari penyimpanan Anda.', 'info')}
              >
                Ganti Gambar
              </button>
            </div>

            {/* Kontribusi */}
            <div className="portal-form-group">
              <label className="portal-form-label">Kontribusi yang Dibutuhkan</label>
              <textarea
                className="portal-textarea"
                rows="2"
                placeholder="Jelaskan dukungan, sumber daya, atau tanggung jawab yang diharapkan dari UKM tujuan..."
                value={formData.kontribusiDibutuhkan}
                onChange={(e) => setFormData({ ...formData, kontribusiDibutuhkan: e.target.value })}
              />
            </div>

            <div className="portal-form-group">
              <label className="portal-form-label">Kontribusi yang Ditawarkan</label>
              <textarea
                className="portal-textarea"
                rows="2"
                placeholder="Jelaskan manfaat, dukungan, atau fasilitas yang ditawarkan oleh SIOMAS..."
                value={formData.kontribusiDitawarkan}
                onChange={(e) => setFormData({ ...formData, kontribusiDitawarkan: e.target.value })}
              />
            </div>

            {/* Tanggal Pelaksanaan & Batas Respons */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="portal-form-group">
                <label className="portal-form-label">Tanggal Pelaksanaan</label>
                <input
                  type="text"
                  className="portal-input"
                  placeholder="Contoh: 24-26 November 2024"
                  value={formData.tanggalPelaksanaan}
                  onChange={(e) => setFormData({ ...formData, tanggalPelaksanaan: e.target.value })}
                />
              </div>

              <div className="portal-form-group">
                <label className="portal-form-label">Batas Respons</label>
                <input
                  type="text"
                  className="portal-input"
                  placeholder="Contoh: 20 November 2024"
                  value={formData.batasRespons}
                  onChange={(e) => setFormData({ ...formData, batasRespons: e.target.value })}
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
                  value={formData.namaNarahubung}
                  onChange={(e) => setFormData({ ...formData, namaNarahubung: e.target.value })}
                />
              </div>

              <div className="portal-form-group">
                <label className="portal-form-label">Nomor WhatsApp</label>
                <input
                  type="text"
                  className="portal-input"
                  placeholder="+62 812 3456 7890"
                  value={formData.nomorWhatsapp}
                  onChange={(e) => setFormData({ ...formData, nomorWhatsapp: e.target.value })}
                />
              </div>
            </div>

            {/* Lampiran Proposal Dropzone */}
            <div className="portal-dropzone">
              <div className="dropzone-left">
                <div className="dropzone-icon">
                  <UploadCloud size={20} />
                </div>
                <div className="dropzone-text">
                  <h5>Lampirkan proposal kerja sama</h5>
                  <p>{formData.fileName || 'PDF atau DOCX • Maksimal 10 MB'}</p>
                </div>
              </div>
              <button 
                type="button" 
                className="portal-outline-btn"
                style={{ width: 'auto', padding: '7px 16px', fontSize: '12.5px' }}
                onClick={() => {
                  setFormData({ ...formData, fileName: 'Proposal_Kolaborasi_Final.pdf' });
                  showToast('Berkas proposal berhasil dipilih.', 'success');
                }}
              >
                Pilih Berkas
              </button>
            </div>

            {/* Notification Checkbox */}
            <div style={{ background: '#FFFBEB', border: '1px solid #FEF3C7', borderRadius: '12px', padding: '14px 16px', display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
              <input
                type="checkbox"
                id="notif_check"
                checked={formData.kirimNotifikasi}
                onChange={(e) => setFormData({ ...formData, kirimNotifikasi: e.target.checked })}
                style={{ marginTop: '3px', width: '16px', height: '16px', cursor: 'pointer' }}
              />
              <label htmlFor="notif_check" style={{ fontSize: '13px', color: '#92400E', cursor: 'pointer', lineHeight: '1.4' }}>
                <strong>Kirim notifikasi kepada UKM tujuan</strong>
                <div style={{ fontSize: '12px', color: '#B45309', marginTop: '2px' }}>
                  Pengurus organisasi tujuan akan menerima pemberitahuan dan batas waktu respons.
                </div>
              </label>
            </div>
          </div>

          <div className="portal-modal-footer">
            <button 
              type="button" 
              className="btn-secondary" 
              style={{ width: 'auto', padding: '9px 18px', fontSize: '13.5px' }}
              onClick={onClose}
            >
              Batal
            </button>
            <button 
              type="submit" 
              className="btn-primary-glow"
              style={{ padding: '9px 22px', fontSize: '13.5px' }}
            >
              Ajukan Persetujuan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
