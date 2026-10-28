import React, { useState } from 'react';
import { ChevronLeft, UploadCloud, Shield, ChevronRight, X } from 'lucide-react';

export default function PDFormPublikasi({ onBack, onSubmitSuccess, showToast }) {
  const [form, setForm] = useState({
    judulPublikasi: '',
    kategori: 'Kolaborasi',
    targetPublikasi: 'Seluruh UKM Kampus',
    deskripsiKegiatan: '',
    tanggalPelaksanaan: '',
    lokasi: 'Student Center Kampus',
    namaNarahubung: '',
    nomorWhatsapp: '+62 812 3456 7890',
    fileName: '',
    setujuKetentuan: false
  });

  const [status, setStatus] = useState('DRAF');

  const handleSubmit = (isDraf = false) => {
    if (!form.judulPublikasi.trim()) {
      showToast('Harap isi Judul Publikasi.', 'warning');
      return;
    }
    if (!isDraf && !form.setujuKetentuan) {
      showToast('Harap centang pernyataan kebenaran informasi.', 'warning');
      return;
    }

    if (isDraf) {
      setStatus('DRAF');
      showToast(`Publikasi "${form.judulPublikasi}" disimpan sebagai draf.`, 'success');
    } else {
      setStatus('Menunggu Review');
      onSubmitSuccess();
      showToast('Publikasi berhasil diajukan untuk persetujuan Ketua UKM.', 'success');
    }
  };

  return (
    <div>
      {/* Back + Breadcrumb */}
      <div style={{ marginBottom: '16px' }}>
        <button
          type="button"
          style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', color: '#6366F1', fontSize: '13px', fontWeight: 600 }}
          onClick={onBack}
        >
          <ChevronLeft size={16} /> Kembali ke Hub Inter-UKM
        </button>
      </div>

      <div className="page-header-block" style={{ paddingBottom: '24px' }}>
        <span className="page-category-tag">PUBLIKASI INTER-UKM</span>
        <h1 className="page-title">Buat Publikasi Kolaborasi</h1>
        <p className="page-subtitle">Lengkapi informasi kegiatan untuk ditinjau sebelum disiarkan ke seluruh organisasi kampus.</p>
      </div>

      {/* Two-column layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '24px', alignItems: 'start' }}>
        {/* Left: Form */}
        <div className="portal-card" style={{ padding: '28px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <div>
              <h3 className="portal-card-title">Informasi Publikasi</h3>
              <p className="portal-card-subtitle">Data ini akan tampil pada feed Hub Inter-UKM.</p>
            </div>
            <span style={{ fontSize: '11px', fontWeight: 700, padding: '4px 12px', borderRadius: '20px', background: '#FFEDD5', color: '#EA580C' }}>
              {status}
            </span>
          </div>

          {/* Judul Publikasi */}
          <div className="portal-form-group">
            <label className="portal-form-label">Judul Publikasi</label>
            <input className="portal-input" placeholder="Contoh: Open Collaboration SIOMAS Leadership Camp" value={form.judulPublikasi} onChange={(e) => setForm({ ...form, judulPublikasi: e.target.value })} />
          </div>

          {/* Kategori & Target */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="portal-form-group">
              <label className="portal-form-label">Kategori</label>
              <select className="portal-select" value={form.kategori} onChange={(e) => setForm({ ...form, kategori: e.target.value })}>
                <option>Kolaborasi</option>
                <option>Acara</option>
                <option>Media Partner</option>
                <option>Workshop</option>
              </select>
            </div>
            <div className="portal-form-group">
              <label className="portal-form-label">Target Publikasi</label>
              <select className="portal-select" value={form.targetPublikasi} onChange={(e) => setForm({ ...form, targetPublikasi: e.target.value })}>
                <option>Seluruh UKM Kampus</option>
                <option>UKM Tertentu</option>
                <option>Himpunan</option>
              </select>
            </div>
          </div>

          {/* Deskripsi */}
          <div className="portal-form-group">
            <label className="portal-form-label">Deskripsi Kegiatan</label>
            <textarea className="portal-textarea" rows="4" placeholder="Jelaskan tujuan, ruang lingkup, dan bentuk kolaborasi yang ditawarkan..." value={form.deskripsiKegiatan} onChange={(e) => setForm({ ...form, deskripsiKegiatan: e.target.value })} />
          </div>

          {/* Tanggal & Lokasi */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="portal-form-group">
              <label className="portal-form-label">Tanggal Pelaksanaan</label>
              <input type="date" className="portal-input" value={form.tanggalPelaksanaan} onChange={(e) => setForm({ ...form, tanggalPelaksanaan: e.target.value })} />
            </div>
            <div className="portal-form-group">
              <label className="portal-form-label">Lokasi</label>
              <input className="portal-input" placeholder="Student Center Kampus" value={form.lokasi} onChange={(e) => setForm({ ...form, lokasi: e.target.value })} />
            </div>
          </div>

          {/* Narahubung & WA */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="portal-form-group">
              <label className="portal-form-label">Nama Narahubung</label>
              <input className="portal-input" placeholder="Nama lengkap PIC" value={form.namaNarahubung} onChange={(e) => setForm({ ...form, namaNarahubung: e.target.value })} />
            </div>
            <div className="portal-form-group">
              <label className="portal-form-label">Nomor WhatsApp</label>
              <input className="portal-input" placeholder="+62 812 3456 7890" value={form.nomorWhatsapp} onChange={(e) => setForm({ ...form, nomorWhatsapp: e.target.value })} />
            </div>
          </div>

          {/* Gambar Sampul */}
          <div style={{ border: '1px solid #E2E8F0', borderRadius: '12px', overflow: 'hidden', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '12px 16px' }}>
              <img src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=200&auto=format&fit=crop&q=80" alt="Sampul" style={{ width: '80px', height: '50px', borderRadius: '8px', objectFit: 'cover' }} />
              <div style={{ flex: 1 }}>
                <h6 style={{ fontSize: '13px', fontWeight: 700, margin: '0 0 2px', color: '#0F172A' }}>Gambar Sampul Publikasi</h6>
                <p style={{ fontSize: '11px', color: '#94A3B8', margin: 0 }}>Gambar ditampilkan pada feed dan halaman detail • JPG/PNG 16:6</p>
              </div>
              <button type="button" className="portal-outline-btn" style={{ width: 'auto', padding: '7px 14px', fontSize: '12px', flexShrink: 0 }} onClick={() => showToast('Pilih gambar sampul dari perangkat Anda.', 'info')}>
                <UploadCloud size={13} style={{ marginRight: '5px' }} /> Pilih Gambar
              </button>
            </div>
          </div>

          {/* Lampiran Proposal */}
          <div className="portal-dropzone" style={{ marginBottom: '16px' }}>
            <div className="dropzone-left">
              <div className="dropzone-icon"><UploadCloud size={20} /></div>
              <div className="dropzone-text">
                <h5>Lampirkan proposal kolaborasi</h5>
                <p>{form.fileName || 'PDF atau DOCX • Maksimal 10 MB'}</p>
              </div>
            </div>
            <button type="button" className="portal-outline-btn" style={{ width: 'auto', padding: '7px 16px', fontSize: '12.5px' }} onClick={() => { setForm({ ...form, fileName: 'Proposal_Kolaborasi.pdf' }); showToast('Berkas berhasil dipilih.', 'success'); }}>
              Pilih Berkas
            </button>
          </div>

          {/* Pernyataan */}
          <div style={{ background: '#FFFBEB', border: '1px solid #FEF3C7', borderRadius: '12px', padding: '14px 16px', display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '24px' }}>
            <input type="checkbox" id="pd_setuju_ketentuan" checked={form.setujuKetentuan} onChange={(e) => setForm({ ...form, setujuKetentuan: e.target.checked })} style={{ marginTop: '3px', width: '16px', height: '16px', cursor: 'pointer' }} />
            <label htmlFor="pd_setuju_ketentuan" style={{ fontSize: '13px', color: '#92400E', cursor: 'pointer', lineHeight: '1.4' }}>
              <strong>Saya memastikan informasi publikasi sudah benar</strong>
              <div style={{ fontSize: '12px', color: '#B45309', marginTop: '2px' }}>Konten mengikuti ketentuan publikasi lintas organisasi BR-02.</div>
            </label>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <button type="button" className="btn-secondary" style={{ width: 'auto', padding: '10px 20px', fontSize: '13.5px' }} onClick={() => handleSubmit(true)}>
              Simpan sebagai Draf
            </button>
            <button type="button" className="btn-primary-glow" style={{ padding: '10px 24px', fontSize: '13.5px' }} onClick={() => handleSubmit(false)}>
              <ChevronRight size={14} style={{ marginRight: '5px' }} /> Ajukan Persetujuan
            </button>
          </div>
        </div>

        {/* Right: Alur Persetujuan */}
        <div>
          <div className="portal-card" style={{ padding: '24px', marginBottom: '16px' }}>
            <div style={{ width: '40px', height: '40px', background: '#EEF2FF', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '14px', color: '#6366F1' }}>
              <Shield size={20} />
            </div>
            <h4 style={{ fontSize: '15px', fontWeight: 700, color: '#0F172A', marginBottom: '16px' }}>Alur Persetujuan BR-02</h4>
            {[
              { num: 1, title: 'Lengkapi formulir', desc: 'Isi detail dan narahubung', active: true },
              { num: 2, title: 'Verifikasi Ketua UKM', desc: 'Konten diperiksa sebelum tayang', active: false },
              { num: 3, title: 'Disiarkan ke kampus', desc: 'Publikasi tampil di seluruh Hub', active: false }
            ].map((step) => (
              <div key={step.num} style={{ display: 'flex', gap: '14px', marginBottom: '16px', alignItems: 'flex-start' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: step.active ? '#6366F1' : '#E2E8F0', color: step.active ? '#fff' : '#94A3B8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 700, flexShrink: 0 }}>
                  {step.num}
                </div>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: step.active ? '#0F172A' : '#64748B' }}>{step.title}</div>
                  <div style={{ fontSize: '12px', color: '#94A3B8' }}>{step.desc}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="portal-card" style={{ padding: '20px' }}>
            <h5 style={{ fontSize: '13px', fontWeight: 700, color: '#0F172A', marginBottom: '10px' }}>Standar publikasi</h5>
            <p style={{ fontSize: '12px', color: '#64748B', lineHeight: '1.6' }}>
              Hindari data sensitif dan pastikan kegiatan memiliki jadwal serta narahubung yang valid.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
