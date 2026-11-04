import React, { useState, useRef } from 'react';
import { X, UploadCloud, Users } from 'lucide-react';
import { interUkmApi } from '../../services/api.js';

export default function PDModalKolaborasi({ onClose, onSubmit, showToast }) {
  const [formData, setFormData] = useState({
    namaProgram: '',
    ukmTujuan: 'BEM Universitas',
    bentukKolaborasi: 'Mitra Penyelenggara',
    kontribusiDibutuhkan: '',
    kontribusiDitawarkan: '',
    tanggalPelaksanaan: '',
    batasRespons: '',
    namaNarahubung: '',
    nomorWhatsapp: '+62 812 3456 7890',
    fileName: '',
    kirimNotifikasi: true
  });
  const [proposalFileObj, setProposalFileObj] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setProposalFileObj(file);
    setFormData(prev => ({ ...prev, fileName: `${file.name} (${(file.size / 1024).toFixed(1)} KB)` }));
    showToast && showToast(`Berkas "${file.name}" berhasil dipilih.`, 'success');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.namaProgram.trim()) {
      showToast('Harap isi Nama Program atau Kegiatan.', 'warning');
      return;
    }

    setSubmitting(true);
    const isi = [
      `Bentuk Kolaborasi: ${formData.bentukKolaborasi}`,
      formData.kontribusiDibutuhkan ? `Kontribusi Dibutuhkan: ${formData.kontribusiDibutuhkan}` : '',
      formData.kontribusiDitawarkan ? `Kontribusi Ditawarkan: ${formData.kontribusiDitawarkan}` : '',
      formData.tanggalPelaksanaan ? `Pelaksanaan: ${formData.tanggalPelaksanaan}` : '',
      formData.namaNarahubung ? `PIC: ${formData.namaNarahubung} (${formData.nomorWhatsapp})` : '',
      formData.fileName ? `Lampiran: ${formData.fileName}` : ''
    ].filter(Boolean).join(' • ');

    const res = await interUkmApi.createPost({
      ukm_pengirim: formData.ukmTujuan,
      judul: formData.namaProgram.trim(),
      isi_pengumuman: isi,
      proposal: proposalFileObj || undefined
    });
    setSubmitting(false);

    if (res.ok) {
      showToast('Permintaan kolaborasi berhasil diajukan untuk persetujuan Ketua UKM!', 'success');
      onSubmit(formData);
      onClose();
    } else {
      showToast(res.data?.message || 'Gagal mengajukan permintaan kolaborasi.', 'error');
    }
  };

  return (
    <div className="portal-modal-backdrop" onClick={onClose}>
      <div className="portal-modal-dialog wide" onClick={(e) => e.stopPropagation()}>
        <div className="portal-modal-header">
          <div>
            <h3 className="portal-modal-title">Buat Permintaan Kolaborasi</h3>
            <p className="portal-modal-subtitle">Kirim undangan kerja sama kepada organisasi mahasiswa yang dituju.</p>
          </div>
          <button type="button" className="portal-modal-close-btn" onClick={onClose}><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="portal-modal-body">
            {/* Nama Program */}
            <div className="portal-form-group">
              <label className="portal-form-label">Nama Program atau Kegiatan</label>
              <input
                type="text"
                className="portal-input"
                placeholder="Contoh: SIOMAS Leadership Camp"
                value={formData.namaProgram}
                onChange={(e) => setFormData({ ...formData, namaProgram: e.target.value })}
                required
              />
            </div>

            {/* UKM Tujuan & Bentuk */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="portal-form-group">
                <label className="portal-form-label">UKM Tujuan</label>
                <select className="portal-select" value={formData.ukmTujuan} onChange={(e) => setFormData({ ...formData, ukmTujuan: e.target.value })}>
                  <option>BEM Universitas</option>
                  <option>UKM Fotografi</option>
                  <option>Himpunan Informatika</option>
                  <option>UKM Seni &amp; Teater</option>
                  <option>UKM Olahraga</option>
                </select>
              </div>
              <div className="portal-form-group">
                <label className="portal-form-label">Bentuk Kolaborasi</label>
                <select className="portal-select" value={formData.bentukKolaborasi} onChange={(e) => setFormData({ ...formData, bentukKolaborasi: e.target.value })}>
                  <option>Mitra Penyelenggara</option>
                  <option>Media Partner</option>
                  <option>Sponsorship</option>
                  <option>Delegasi Peserta</option>
                </select>
              </div>
            </div>

            {/* Kontribusi */}
            <div className="portal-form-group">
              <label className="portal-form-label">Kontribusi yang Dibutuhkan</label>
              <textarea className="portal-textarea" rows="2" placeholder="Jelaskan dukungan, sumber daya, atau tanggung jawab yang diharapkan dari UKM tujuan..." value={formData.kontribusiDibutuhkan} onChange={(e) => setFormData({ ...formData, kontribusiDibutuhkan: e.target.value })} />
            </div>
            <div className="portal-form-group">
              <label className="portal-form-label">Kontribusi yang Ditawarkan</label>
              <textarea className="portal-textarea" rows="2" placeholder="Jelaskan manfaat, dukungan, atau fasilitas yang ditawarkan oleh SIOMAS..." value={formData.kontribusiDitawarkan} onChange={(e) => setFormData({ ...formData, kontribusiDitawarkan: e.target.value })} />
            </div>

            {/* Tanggal & Batas */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="portal-form-group">
                <label className="portal-form-label">Tanggal Pelaksanaan</label>
                <input type="date" className="portal-input" value={formData.tanggalPelaksanaan} onChange={(e) => setFormData({ ...formData, tanggalPelaksanaan: e.target.value })} />
              </div>
              <div className="portal-form-group">
                <label className="portal-form-label">Batas Respons</label>
                <input type="date" className="portal-input" value={formData.batasRespons} onChange={(e) => setFormData({ ...formData, batasRespons: e.target.value })} />
              </div>
            </div>

            {/* PIC & WA */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="portal-form-group">
                <label className="portal-form-label">Nama Narahubung</label>
                <input type="text" className="portal-input" placeholder="Nama lengkap PIC" value={formData.namaNarahubung} onChange={(e) => setFormData({ ...formData, namaNarahubung: e.target.value })} />
              </div>
              <div className="portal-form-group">
                <label className="portal-form-label">Nomor WhatsApp</label>
                <input type="text" className="portal-input" placeholder="+62 812 3456 7890" value={formData.nomorWhatsapp} onChange={(e) => setFormData({ ...formData, nomorWhatsapp: e.target.value })} />
              </div>
            </div>

            {/* Lampiran */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.doc,.docx"
              style={{ display: 'none' }}
              onChange={handleFileChange}
            />
            <div
              className="portal-dropzone"
              style={{ cursor: 'pointer' }}
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="dropzone-left">
                <div className="dropzone-icon"><UploadCloud size={20} /></div>
                <div className="dropzone-text">
                  <h5>Lampirkan proposal kerja sama</h5>
                  <p style={{ color: formData.fileName ? '#4F46E5' : undefined, fontWeight: formData.fileName ? 600 : undefined }}>
                    {formData.fileName || 'PDF atau DOCX • Maksimal 10 MB'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="portal-outline-btn"
                style={{ width: 'auto', padding: '7px 16px', fontSize: '12.5px' }}
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
              >
                Pilih Berkas
              </button>
            </div>
          </div>

          <div className="portal-modal-footer">
            <button type="button" className="btn-secondary" style={{ width: 'auto', padding: '9px 18px', fontSize: '13.5px' }} onClick={onClose}>Batal</button>
            <button type="submit" disabled={submitting} className="btn-primary-glow" style={{ padding: '9px 22px', fontSize: '13.5px' }}>
              <Users size={16} style={{ marginRight: '6px' }} /> {submitting ? 'Mengirim...' : 'Ajukan Persetujuan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
