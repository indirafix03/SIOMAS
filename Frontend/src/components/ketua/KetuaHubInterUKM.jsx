import React, { useState } from 'react';
import { Users, Calendar, Share2, X, ChevronRight } from 'lucide-react';

const posts = [
  {
    id: 1,
    org: 'BEM Universitas',
    orgInitial: 'BU',
    orgColor: '#3B82F6',
    waktu: '1 jam lalu',
    kategori: 'Kolaborasi',
    kategoriColor: '#4F46E5',
    judul: 'Open Collaboration: Campus Creative Week',
    img: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=700&q=80',
    desc: 'Kami mengundang seluruh UKM untuk berkolaborasi dalam rangkaian Campus Creative Week 2024.',
    tertarik: 24,
    status: 'pending',
    contactName: 'Nadya Ayuningtyas',
    contactRole: 'Koordinator Kolaborasi BEM Universitas',
    tanggal: '24-26 November 2024',
    tempat: 'Student Center'
  },
  {
    id: 2,
    org: 'UKM Fotografi',
    orgInitial: 'UF',
    orgColor: '#10B981',
    waktu: '2 jam lalu',
    kategori: 'Acara',
    kategoriColor: '#059669',
    judul: 'Pameran Foto: Ruang dan Cerita',
    img: 'https://images.unsplash.com/photo-1605153864431-a2795a1b2f95?w=700&q=80',
    desc: 'Pameran terbuka hasil karya mahasiswa akan hadir pekan depan di Galeri Kampus.',
    tertarik: 36,
    status: 'approved'
  },
  {
    id: 3,
    org: 'Himpunan Informatika',
    orgInitial: 'HI',
    orgColor: '#6366F1',
    waktu: '3 jam lalu',
    kategori: 'Media Partner',
    kategoriColor: '#7C3AED',
    judul: 'Mencari Media Partner untuk TechnoFest',
    img: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=700&q=80',
    desc: 'Mari jadi bagian dari festival teknologi terbesar di kampus tahun ini.',
    tertarik: 48,
    status: 'pending'
  }
];

const agendaBersama = [
  { day: 21, month: 'NOV', title: 'Forum Ketua UKM', place: 'Gedung Rektorat', org: '4 organisasi bergabung', color: '#4F46E5' },
  { day: 24, month: 'NOV', title: 'Campus Creative Week', place: 'Student Center', org: '7 organisasi bergabung', color: '#10B981' },
  { day: 30, month: 'NOV', title: 'TechnoFest 2024', place: 'Auditorium Utama', org: '13 organisasi bergabung', color: '#F59E0B' }
];

// Modal: Buat Permintaan Kolaborasi
function ModalBuatKolab({ onClose, onSubmit }) {
  const [form, setForm] = useState({
    program: '', ukmTujuan: '', bentuk: 'Mitra Penyelenggara',
    kontribusiDibutuhkan: '', kontribusiDitawarkan: '',
    tanggal: '', batasRespons: '', narahubung: '', whatsapp: '',
    notif: true
  });
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(p => ({ ...p, [name]: type === 'checkbox' ? checked : value }));
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '24px' }}>
      <div style={{ background: '#fff', borderRadius: '16px', width: '100%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 24px 60px -12px rgba(0,0,0,0.2)' }}>
        <div style={{ padding: '28px 28px 0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: 700 }}>Buat Permintaan Kolaborasi</h2>
              <p style={{ fontSize: '13px', color: '#64748B', marginTop: '2px' }}>Kirim undangan kerja sama kepada organisasi mahasiswa yang dituju.</p>
            </div>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}><X size={20} /></button>
          </div>
        </div>

        <div style={{ padding: '0 28px 28px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div className="form-group">
            <label className="form-label">Nama Program atau Kegiatan</label>
            <input className="form-input" name="program" value={form.program} onChange={handleChange} placeholder="Contoh: SIOMAS Leadership Camp 2024" />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">UKM Tujuan</label>
              <select className="form-select" name="ukmTujuan" value={form.ukmTujuan} onChange={handleChange}>
                <option value="">Pilih organisasi tujuan</option>
                <option>BEM Universitas</option>
                <option>UKM Fotografi</option>
                <option>Himpunan Informatika</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Bentuk Kolaborasi</label>
              <select className="form-select" name="bentuk" value={form.bentuk} onChange={handleChange}>
                <option>Mitra Penyelenggara</option>
                <option>Media Partner</option>
                <option>Sponsor</option>
                <option>Co-host</option>
              </select>
            </div>
          </div>

          {/* Cover image placeholder */}
          <div style={{ border: '1px solid #E2E8F0', borderRadius: '10px', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '14px' }}>
            <img src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=120&q=80" alt="" style={{ width: '80px', height: '60px', objectFit: 'cover', borderRadius: '8px' }} />
            <div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: '#0F172A' }}>Gambar sampul kolaborasi</div>
              <div style={{ fontSize: '12px', color: '#94A3B8' }}>JPG atau PNG • Rekomendasi 16:9</div>
              <button style={{ background: '#EEF2FF', color: '#4F46E5', border: 'none', borderRadius: '8px', padding: '5px 12px', cursor: 'pointer', fontSize: '12px', fontFamily: 'inherit', fontWeight: 600, marginTop: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                ↑ Ganti Gambar
              </button>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Kontribusi yang Dibutuhkan</label>
            <textarea className="form-input" rows={3} name="kontribusiDibutuhkan" value={form.kontribusiDibutuhkan} onChange={handleChange} placeholder="Jelaskan dukungan, sumber daya, atau tanggung jawab yang diharapkan dari UKM tujuan..." style={{ resize: 'none' }} />
          </div>

          <div className="form-group">
            <label className="form-label">Kontribusi yang Ditawarkan</label>
            <textarea className="form-input" rows={3} name="kontribusiDitawarkan" value={form.kontribusiDitawarkan} onChange={handleChange} placeholder="Jelaskan manfaat, dukungan, atau fasilitas yang ditawarkan oleh SIOMAS..." style={{ resize: 'none' }} />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Tanggal Pelaksanaan</label>
              <input className="form-input" type="date" name="tanggal" value={form.tanggal} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label className="form-label">Batas Respons</label>
              <input className="form-input" type="date" name="batasRespons" value={form.batasRespons} onChange={handleChange} />
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

          <div style={{ border: '1.5px dashed #E2E8F0', borderRadius: '10px', padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <div style={{ width: '32px', height: '32px', background: '#EEF2FF', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4F46E5' }}>↑</div>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#0F172A' }}>Lampirkan proposal kerja sama</div>
                <div style={{ fontSize: '12px', color: '#94A3B8' }}>PDF atau DOCX • Maksimal 10 MB</div>
              </div>
            </div>
            <button style={{ background: 'none', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '6px 12px', cursor: 'pointer', fontSize: '12px', color: '#4F46E5', fontFamily: 'inherit', fontWeight: 600 }}>
              Pilih Berkas
            </button>
          </div>

          <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: '10px', padding: '12px 14px', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
            <input type="checkbox" id="notifKolab" name="notif" checked={form.notif} onChange={handleChange} style={{ marginTop: '2px', accentColor: '#4F46E5' }} />
            <label htmlFor="notifKolab" style={{ cursor: 'pointer' }}>
              <div style={{ fontSize: '13px', fontWeight: 600, color: '#0F172A' }}>Kirim notifikasi kepada UKM tujuan</div>
              <div style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>Pengurus organisasi tujuan akan menerima pemberitahuan dan batas waktu respons.</div>
            </label>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '8px' }}>
            <button onClick={onClose} className="btn-secondary" style={{ width: 'auto', padding: '10px 20px' }}>Batal</button>
            <button className="btn-primary" style={{ width: 'auto', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}
              onClick={() => { onSubmit(form); onClose(); }}>
              <Users size={16} /> Kirim Permintaan
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Modal: Verifikasi Publikasi Inter-UKM
function ModalVerifikasiPublikasi({ post, onClose, onApprove, onReject }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div style={{ background: '#fff', borderRadius: '16px', width: '100%', maxWidth: '480px', padding: '28px', boxShadow: '0 24px 60px -12px rgba(0,0,0,0.2)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 700 }}>Verifikasi Publikasi Inter-UKM</h2>
            <p style={{ fontSize: '13px', color: '#64748B', marginTop: '2px' }}>Pastikan konten memenuhi aturan publikasi BR-02</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}><X size={20} /></button>
        </div>

        <div style={{ border: '1px solid #E2E8F0', borderRadius: '12px', padding: '16px', marginBottom: '20px' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: '#D97706', letterSpacing: '0.06em', marginBottom: '8px' }}>MENUNGGU PERSETUJUAN</div>
          <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0F172A', marginBottom: '4px' }}>{post?.judul}</h3>
          <p style={{ fontSize: '13px', color: '#64748B' }}>{post?.desc}</p>

          <div style={{ background: '#ECFDF5', border: '1px solid #D1FAE5', borderRadius: '8px', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: '8px', marginTop: '12px' }}>
            <span style={{ color: '#10B981', fontSize: '16px' }}>✓</span>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: '#0F172A' }}>Konten lolos pemeriksaan awal!</div>
              <div style={{ fontSize: '12px', color: '#64748B' }}>Identitas organisasi, jadwal, dan narahubung telah lengkap.</div>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button style={{ background: '#EF4444', color: '#fff', border: 'none', borderRadius: '10px', padding: '10px 20px', cursor: 'pointer', fontSize: '13.5px', fontWeight: 600, fontFamily: 'inherit' }}
            onClick={() => { onReject(); onClose(); }}>
            Tolak Publikasi
          </button>
          <button className="btn-primary" style={{ width: 'auto', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}
            onClick={() => { onApprove(); onClose(); }}>
            ✓ Setujui & Siarkan
          </button>
        </div>
      </div>
    </div>
  );
}

export default function KetuaHubInterUKM({ onNavigate, onSelectPost, showToast }) {
  const [showKolab, setShowKolab] = useState(false);
  const [verifikasiPost, setVerifikasiPost] = useState(null);
  const [publishedIds, setPublishedIds] = useState([]);

  const pendingPosts = posts.filter(p => p.status === 'pending' && !publishedIds.includes(p.id));

  return (
    <div>
      {showKolab && (
        <ModalBuatKolab
          onClose={() => setShowKolab(false)}
          onSubmit={() => showToast && showToast('Permintaan kolaborasi telah dikirim!', 'success')}
        />
      )}
      {verifikasiPost && (
        <ModalVerifikasiPublikasi
          post={verifikasiPost}
          onClose={() => setVerifikasiPost(null)}
          onApprove={() => {
            setPublishedIds(prev => [...prev, verifikasiPost.id]);
            showToast && showToast(`Publikasi "${verifikasiPost.judul}" telah disetujui!`, 'success');
          }}
          onReject={() => showToast && showToast('Publikasi ditolak', 'error')}
        />
      )}

      {/* Hero Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #0F172A 0%, #1E1B4B 100%)',
        borderRadius: '16px', padding: '28px 32px', marginBottom: '24px',
        position: 'relative', overflow: 'hidden',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center'
      }}>
        <div style={{ position: 'absolute', top: '-40px', right: '40px', width: '160px', height: '160px', borderRadius: '50%', background: 'rgba(99,102,241,0.3)', filter: 'blur(40px)' }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <span style={{ background: 'rgba(99,102,241,0.3)', color: '#A5B4FC', fontSize: '11px', fontWeight: 700, padding: '4px 12px', borderRadius: '999px', letterSpacing: '0.06em' }}>KOLABORASI KAMPUS</span>
          <h1 style={{ fontSize: '32px', fontWeight: 700, color: '#fff', marginTop: '10px', marginBottom: '6px' }}>Hub Inter-UKM</h1>
          <p style={{ fontSize: '13.5px', color: '#94A3B8' }}>Temukan peluang, bangun koneksi, dan ciptakan dampak bersama organisasi mahasiswa se-kampus.</p>
        </div>
        <button
          className="btn-primary"
          style={{ margin: 0, width: 'auto', display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap', position: 'relative', zIndex: 1 }}
          onClick={() => onNavigate('k-form-publikasi')}
        >
          + Publikasikan ke Hub
        </button>
      </div>

      {/* Main Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '20px', alignItems: 'start' }}>
        {/* Feed */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#0F172A' }}>Aktivitas Terbaru</h2>
              <p style={{ fontSize: '13px', color: '#94A3B8' }}>Kabar dari organisasi di seluruh kampus</p>
            </div>
            <button className="portal-link-btn">Lihat semua <ChevronRight size={14} /></button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {posts.map(post => (
              <div key={post.id} className="portal-card" style={{ padding: 0, overflow: 'hidden' }}>
                {/* Header */}
                <div style={{ padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '36px', height: '36px', background: post.orgColor, borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '13px', fontWeight: 700, flexShrink: 0 }}>
                      {post.orgInitial}
                    </div>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 700, color: '#0F172A' }}>{post.org}</div>
                      <div style={{ fontSize: '12px', color: '#94A3B8' }}>{post.waktu}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    {post.status === 'pending' && !publishedIds.includes(post.id) && (
                      <button
                        onClick={() => setVerifikasiPost(post)}
                        style={{ background: '#FEF3C7', color: '#D97706', border: 'none', borderRadius: '8px', padding: '4px 12px', cursor: 'pointer', fontSize: '11px', fontWeight: 700, fontFamily: 'inherit' }}
                      >
                        Verifikasi
                      </button>
                    )}
                    {(post.status === 'approved' || publishedIds.includes(post.id)) && (
                      <span style={{ background: '#ECFDF5', color: '#059669', fontSize: '11px', fontWeight: 700, padding: '4px 12px', borderRadius: '8px' }}>Published</span>
                    )}
                    <span style={{ background: post.status === 'pending' ? '#EEF2FF' : '#ECFDF5', color: post.status === 'pending' ? '#4F46E5' : '#059669', fontSize: '11px', fontWeight: 700, padding: '4px 10px', borderRadius: '6px' }}>
                      {post.kategori}
                    </span>
                  </div>
                </div>

                {/* Title */}
                <div style={{ padding: '0 16px 10px' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0F172A' }}>{post.judul}</h3>
                </div>

                {/* Image */}
                <img src={post.img} alt={post.judul} style={{ width: '100%', height: '200px', objectFit: 'cover' }} onError={e => { e.target.style.display = 'none'; }} />

                {/* Desc + actions */}
                <div style={{ padding: '12px 16px' }}>
                  <p style={{ fontSize: '13px', color: '#64748B', marginBottom: '12px' }}>{post.desc}</p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', gap: '14px' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '13px', color: '#64748B' }}>
                        <Users size={14} /> {post.tertarik} tertarik
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '13px', color: '#64748B' }}>
                        <Share2 size={14} /> Bagikan
                      </span>
                    </div>
                    <button
                      onClick={() => onSelectPost && onSelectPost(post)}
                      style={{ background: 'none', border: '1.5px solid #E2E8F0', borderRadius: '8px', padding: '6px 14px', cursor: 'pointer', fontSize: '13px', fontWeight: 600, color: '#0F172A', fontFamily: 'inherit' }}
                    >
                      Lihat Detail
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Agenda Bersama */}
          <div className="portal-card">
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#0F172A', marginBottom: '4px' }}>Agenda Bersama</h3>
            <p style={{ fontSize: '12px', color: '#94A3B8', marginBottom: '14px' }}>Terbuka untuk semua UKM</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {agendaBersama.map((a, i) => (
                <div key={i} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                  <div style={{ background: a.color, color: '#fff', borderRadius: '8px', padding: '4px 8px', textAlign: 'center', minWidth: '44px', flexShrink: 0 }}>
                    <div style={{ fontSize: '16px', fontWeight: 700 }}>{a.day}</div>
                    <div style={{ fontSize: '10px', fontWeight: 600 }}>{a.month}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#0F172A' }}>{a.title}</div>
                    <div style={{ fontSize: '12px', color: '#94A3B8' }}>{a.place}</div>
                    <div style={{ fontSize: '11px', color: '#94A3B8' }}>{a.org}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Kolaborasi CTA */}
          <div className="portal-card" style={{ textAlign: 'center' }}>
            <div style={{ width: '48px', height: '48px', background: '#EEF2FF', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px', color: '#4F46E5' }}>
              <Users size={24} />
            </div>
            <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#0F172A', marginBottom: '6px' }}>Punya ide kolaborasi?</h4>
            <p style={{ fontSize: '12.5px', color: '#64748B', marginBottom: '12px' }}>Temukan mitra organisasi yang tepat untuk mewujudkan programmu.</p>
            <button className="btn-primary" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '13px' }}
              onClick={() => setShowKolab(true)}>
              Buat Permintaan Kolaborasi
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
