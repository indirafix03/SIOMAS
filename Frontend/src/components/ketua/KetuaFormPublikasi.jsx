import React, { useState } from 'react';
import { ChevronLeft, Check } from 'lucide-react';

export default function KetuaFormPublikasi({ onBack, showToast }) {
  const [form, setForm] = useState({
    judul: '', kategori: 'Kolaborasi', target: 'Seluruh UKM Kampus',
    deskripsi: '', tanggal: '', lokasi: 'Student Center Kampus',
    narahubung: '', whatsapp: '',
    setuju: false
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(p => ({ ...p, [name]: type === 'checkbox' ? checked : value }));
  };

  return (
    <div>
      <button onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', cursor: 'pointer', color: '#4F46E5', fontSize: '14px', fontWeight: 600, fontFamily: 'inherit', marginBottom: '16px' }}>
        <ChevronLeft size={16} /> Kembali ke Hub Inter-UKM
      </button>

      <div style={{ marginBottom: '20px' }}>
        <span style={{ fontSize: '12px', fontWeight: 700, color: '#4F46E5', letterSpacing: '0.06em', textTransform: 'uppercase' }}>PUBLIKASI INTER-UKM</span>
        <h1 className="page-title" style={{ marginTop: '4px' }}>Buat Publikasi Kolaborasi</h1>
        <p className="page-subtitle">Lengkapi informasi kegiatan untuk ditinjau sebelum disiarkan ke seluruh organisasi kampus.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '20px', alignItems: 'start' }}>
        {/* Form */}
        <div className="portal-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 700 }}>Informasi Publikasi</h3>
              <p style={{ fontSize: '13px', color: '#64748B', marginTop: '2px' }}>Data ini akan tampil pada feed Hub Inter-UKM.</p>
            </div>
            <span style={{ background: '#FEF3C7', color: '#D97706', fontSize: '12px', fontWeight: 700, padding: '3px 10px', borderRadius: '6px' }}>DRAF</span>
          </div>

          <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">Judul Publikasi</label>
              <input className="form-input" name="judul" value={form.judul} onChange={handleChange} placeholder="Contoh: Open Collaboration SIOMAS Leadership Camp" />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Kategori</label>
                <select className="form-select" name="kategori" value={form.kategori} onChange={handleChange}>
                  <option>Kolaborasi</option>
                  <option>Acara</option>
                  <option>Media Partner</option>
                  <option>Lomba</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Target Publikasi</label>
                <select className="form-select" name="target" value={form.target} onChange={handleChange}>
                  <option>Seluruh UKM Kampus</option>
                  <option>UKM Seni & Budaya</option>
                  <option>UKM Akademik</option>
                  <option>BEM & Himpunan</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Deskripsi Kegiatan</label>
              <textarea className="form-input" rows={4} name="deskripsi" value={form.deskripsi} onChange={handleChange} placeholder="Jelaskan tujuan, ruang lingkup, dan bentuk kolaborasi yang ditawarkan..." style={{ resize: 'none' }} />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Tanggal Pelaksanaan</label>
                <input className="form-input" type="date" name="tanggal" value={form.tanggal} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label className="form-label">Lokasi</label>
                <input className="form-input" name="lokasi" value={form.lokasi} onChange={handleChange} placeholder="Student Center Kampus" />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Nama Narahubung</label>
                <input className="form-input" name="narahubung" value={form.narahubung} onChange={handleChange} placeholder="Nama lengkap PIC" />
              </div>
              <div className="form-group">
                <label className="form-label">Nomor WhatsApp</label>
                <input className="form-input" name="whatsapp" value={form.whatsapp} onChange={handleChange} placeholder="+62 812 3456 7890" />
              </div>
            </div>

            {/* Cover image */}
            <div style={{ border: '1px solid #E2E8F0', borderRadius: '10px', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '16px' }}>
              <img src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=120&q=80" alt="" style={{ width: '90px', height: '68px', objectFit: 'cover', borderRadius: '8px' }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#0F172A' }}>Gambar Sampul Publikasi</div>
                <div style={{ fontSize: '12px', color: '#94A3B8', marginTop: '2px' }}>Gambar ditampilkan pada feed dan halaman detail. • JPG/PNG 16:6</div>
                <button style={{ background: 'none', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '5px 12px', cursor: 'pointer', fontSize: '12px', fontFamily: 'inherit', fontWeight: 600, marginTop: '8px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  ↑ Pilih Gambar
                </button>
              </div>
            </div>

            {/* Proposal upload */}
            <div style={{ border: '1.5px dashed #E2E8F0', borderRadius: '10px', padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <div style={{ width: '32px', height: '32px', background: '#EEF2FF', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4F46E5' }}>↑</div>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#0F172A' }}>Lampirkan proposal kolaborasi</div>
                  <div style={{ fontSize: '12px', color: '#94A3B8' }}>PDF atau DOCX • Maksimal 10 MB</div>
                </div>
              </div>
              <button style={{ background: 'none', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '6px 14px', cursor: 'pointer', fontSize: '13px', color: '#0F172A', fontFamily: 'inherit', fontWeight: 600 }}>Pilih Berkas</button>
            </div>

            {/* Confirm checkbox */}
            <div style={{ border: '1px solid #FDE68A', background: '#FFFBEB', borderRadius: '10px', padding: '14px 16px', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
              <input type="checkbox" id="setuju" name="setuju" checked={form.setuju} onChange={handleChange} style={{ marginTop: '2px', accentColor: '#4F46E5' }} />
              <label htmlFor="setuju" style={{ cursor: 'pointer' }}>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#0F172A' }}>Saya memastikan informasi publikasi sudah benar</div>
                <div style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>Konten mengikuti ketentuan publikasi lintas organisasi BR-02.</div>
              </label>
            </div>

            {/* Action buttons */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button className="btn-secondary" style={{ width: 'auto', padding: '11px 20px' }} onClick={() => showToast && showToast('Draft tersimpan', 'success')}>
                Simpan sebagai Draf
              </button>
              <button className="btn-primary" style={{ width: 'auto', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}
                onClick={() => {
                  if (!form.setuju) { showToast && showToast('Centang persetujuan terlebih dahulu', 'error'); return; }
                  showToast && showToast('Publikasi dikirim untuk verifikasi Ketua UKM', 'success');
                }}>
                Lanjut ke Verifikasi ›
              </button>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="portal-card">
          <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '16px' }}>Alur Persetujuan BR-02</h3>
          {[
            { step: 1, title: 'Lengkapi formulir', desc: 'Isi detail dan narahubung.', done: true },
            { step: 2, title: 'Verifikasi Ketua UKM', desc: 'Konten diperiksa sebelum tayang.', done: false },
            { step: 3, title: 'Disiarkan ke kampus', desc: 'Publikasi tampil di seluruh Hub.', done: false }
          ].map((s, i) => (
            <div key={i} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', marginBottom: '14px' }}>
              <div style={{
                width: '28px', height: '28px', borderRadius: '50%',
                background: s.done ? '#4F46E5' : '#E2E8F0',
                color: s.done ? '#fff' : '#94A3B8',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '13px', fontWeight: 700, flexShrink: 0
              }}>
                {s.done ? <Check size={14} /> : s.step}
              </div>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#0F172A' }}>{s.title}</div>
                <div style={{ fontSize: '12px', color: '#64748B' }}>{s.desc}</div>
              </div>
            </div>
          ))}

          <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: '14px', marginTop: '4px' }}>
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#0F172A', marginBottom: '6px' }}>Standar publikasi</div>
            <p style={{ fontSize: '12.5px', color: '#64748B' }}>Hindari data sensitif dan pastikan kegiatan memiliki jadwal serta narahubung yang valid.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
