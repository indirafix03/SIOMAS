import React, { useState } from 'react';
import { Plus, Heart, Share2, Users, Calendar, ChevronRight } from 'lucide-react';
import PDFormPublikasi from './PDFormPublikasi.jsx';
import PDModalKolaborasi from './PDModalKolaborasi.jsx';

export default function PDHubInter({ onNavigate, onSelectPost, showToast }) {
  const [showFormPublikasi, setShowFormPublikasi] = useState(false);
  const [showModalKolaborasi, setShowModalKolaborasi] = useState(false);

  const [posts, setPosts] = useState([
    {
      id: 1,
      orgName: 'BEM Universitas',
      orgCode: 'BU',
      orgBadgeClass: 'org-blue',
      timeAgo: '1 jam lalu',
      category: 'Kolaborasi',
      tagClass: 'tag-purple',
      judul: 'Open Collaboration: Campus Creative Week',
      headline: 'Ruang kreatif untuk karya dan kolaborasi mahasiswa',
      image: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=1000&auto=format&fit=crop&q=80',
      deskripsi: 'Kami mengundang seluruh UKM untuk berkolaborasi dalam rangkaian Campus Creative Week 2024.',
      likes: 24, isLiked: false,
      pelaksanaan: '24–26 November 2024', tempat: 'Student Center',
      fileName: 'Proposal_Campus_Creative_Week.pdf', fileSize: '3.2 MB',
      contactPerson: 'Nadya Ayuningtyas',
      contactRole: 'Koordinator Kolaborasi BEM Universitas',
      contactWa: '+62 812 9988 7766',
      publishedBy: 'BEM Universitas',
      isPublished: true
    },
    {
      id: 2,
      orgName: 'UKM Fotografi',
      orgCode: 'UF',
      orgBadgeClass: 'org-green',
      timeAgo: '2 jam lalu',
      category: 'Acara',
      tagClass: 'tag-gray',
      judul: 'Pameran Foto: Ruang dan Cerita',
      headline: 'Apresiasi visual sudut kehidupan kampus dan kota',
      image: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=1000&auto=format&fit=crop&q=80',
      deskripsi: 'Pameran terbuka hasil karya mahasiswa akan hadir pekan depan di Galeri Kampus.',
      likes: 36, isLiked: false,
      pelaksanaan: '28–30 November 2024', tempat: 'Galeri Seni Kampus',
      fileName: 'Katalog_Pameran_Foto.pdf', fileSize: '4.8 MB',
      contactPerson: 'Fajar Nugraha',
      contactRole: 'Ketua UKM Fotografi',
      contactWa: '+62 813 4455 6677',
      publishedBy: 'UKM Fotografi',
      isPublished: true
    },
    {
      id: 3,
      orgName: 'Himpunan Informatika',
      orgCode: 'HI',
      orgBadgeClass: 'org-indigo',
      timeAgo: '3 jam lalu',
      category: 'Media Partner',
      tagClass: 'tag-gray',
      judul: 'Mencari Media Partner untuk TechnoFest',
      headline: 'Festival inovasi teknologi terbesar tingkat universitas',
      image: 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=1000&auto=format&fit=crop&q=80',
      deskripsi: 'Mari jadi bagian dari festival teknologi terbesar di kampus tahun ini.',
      likes: 48, isLiked: false,
      pelaksanaan: '05–07 Desember 2024', tempat: 'Auditorium Kampus',
      fileName: 'Paket_Media_Partner.pdf', fileSize: '2.1 MB',
      contactPerson: 'Bima Satria',
      contactRole: 'Divisi Partnership Himpunan',
      contactWa: '+62 821 7788 9900',
      publishedBy: 'Himpunan Informatika',
      isPublished: true
    }
  ]);

  const handleToggleLike = (postId) => {
    setPosts(posts.map((post) => {
      if (post.id === postId) {
        const nextLiked = !post.isLiked;
        return { ...post, isLiked: nextLiked, likes: nextLiked ? post.likes + 1 : post.likes - 1 };
      }
      return post;
    }));
  };

  const handleShare = (post) => {
    if (navigator.clipboard) navigator.clipboard.writeText(window.location.href);
    showToast(`Tautan "${post.judul}" berhasil disalin!`, 'success');
  };

  if (showFormPublikasi) {
    return (
      <PDFormPublikasi
        onBack={() => setShowFormPublikasi(false)}
        onSubmitSuccess={() => { setShowFormPublikasi(false); showToast('Publikasi berhasil diajukan!', 'success'); }}
        showToast={showToast}
      />
    );
  }

  return (
    <div>
      {/* Hero Banner */}
      <div className="hub-hero-banner">
        <div className="hub-hero-text">
          <span className="hub-hero-tag">KOLABORASI KAMPUS</span>
          <h1 className="hub-hero-title">Hub Inter-UKM</h1>
          <p className="hub-hero-desc">
            Temukan peluang, bangun koneksi, dan ciptakan dampak bersama organisasi mahasiswa se-kampus.
          </p>
        </div>
        <button type="button" className="btn-primary-glow" onClick={() => setShowFormPublikasi(true)}>
          <Plus size={18} /> Publikasikan ke Hub
        </button>
      </div>

      {/* Main Grid */}
      <div className="hub-layout-grid">
        {/* Left: Feed */}
        <div className="hub-feed-column">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0F172A', margin: 0 }}>Aktivitas Terbaru</h3>
              <p style={{ fontSize: '13px', color: '#64748B', margin: '2px 0 0' }}>Kabar dari organisasi di seluruh kampus</p>
            </div>
            <button type="button" className="portal-link-btn" onClick={() => showToast('Menampilkan seluruh feed kolaborasi.', 'info')}>
              Lihat semua <ChevronRight size={14} />
            </button>
          </div>

          {posts.map((post) => (
            <div key={post.id} className="hub-post-card">
              <div className="hub-post-header">
                <div className="hub-post-org">
                  <div className={`org-avatar-badge ${post.orgBadgeClass}`}>{post.orgCode}</div>
                  <div>
                    <span className="org-name-text">{post.orgName}</span>
                    <span style={{ margin: '0 6px', color: '#CBD5E1' }}>•</span>
                    <span className="org-time-ago">{post.timeAgo}</span>
                  </div>
                </div>
                <span className={`tag-badge ${post.tagClass}`}>{post.category}</span>
              </div>

              <h4 className="hub-post-title">{post.judul}</h4>

              <div className="hub-post-image-wrap">
                <img src={post.image} alt={post.judul} />
              </div>

              <p className="hub-post-desc">{post.deskripsi}</p>

              <div className="hub-post-footer">
                <div className="hub-post-actions-left">
                  <button type="button" className={`hub-action-btn ${post.isLiked ? 'active' : ''}`} onClick={() => handleToggleLike(post.id)}>
                    <Heart size={16} fill={post.isLiked ? '#EF4444' : 'none'} color={post.isLiked ? '#EF4444' : 'currentColor'} />
                    <span>{post.likes} tertarik</span>
                  </button>
                  <button type="button" className="hub-action-btn" onClick={() => handleShare(post)}>
                    <Share2 size={16} />
                    <span>Bagikan</span>
                  </button>
                </div>
                <button type="button" className="btn-detail-pill" onClick={() => onSelectPost(post)}>Lihat Detail</button>
              </div>
            </div>
          ))}
        </div>

        {/* Right: Sidebar */}
        <div className="hub-sidebar-column">
          {/* Agenda Bersama */}
          <div className="portal-card">
            <div className="portal-card-header" style={{ marginBottom: '16px' }}>
              <div>
                <h4 className="portal-card-title">Agenda Bersama</h4>
                <p className="portal-card-subtitle">Terbuka untuk semua UKM</p>
              </div>
            </div>
            <div className="upcoming-schedules-list">
              {[
                { day: '21', month: 'Nov', title: 'Forum Ketua UKM', loc: 'Gedung Rektorat', count: '4', cls: 'blue', color: '#6366F1' },
                { day: '24', month: 'Nov', title: 'Campus Creative Week', loc: 'Student Center', count: '7', cls: 'green', color: '#10B981' },
                { day: '30', month: 'Nov', title: 'TechnoFest 2024', loc: 'Auditorium Utama', count: '10', cls: '', color: '#D97706', bg: '#FFFBEB' }
              ].map((item) => (
                <div key={item.day} className="upcoming-schedule-item">
                  <div className={`schedule-date-badge ${item.cls}`} style={item.bg ? { background: item.bg, color: item.color } : {}}>
                    <span className="schedule-date-day">{item.day}</span>
                    <span className="schedule-date-month">{item.month}</span>
                  </div>
                  <div className="schedule-details">
                    <h5 className="schedule-title">{item.title}</h5>
                    <span className="schedule-meta">{item.loc}</span>
                    <span style={{ fontSize: '11px', color: item.color, fontWeight: 600 }}>{item.count} organisasi bergabung</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Promo: Buat Permintaan Kolaborasi */}
          <div className="hub-promo-card">
            <div className="hub-promo-icon"><Users size={24} /></div>
            <h4>Punya ide kolaborasi?</h4>
            <p>Temukan mitra organisasi yang tepat untuk mewujudkan programmu.</p>
            <button type="button" className="portal-outline-btn" style={{ fontWeight: 700 }} onClick={() => setShowModalKolaborasi(true)}>
              Buat Permintaan Kolaborasi
            </button>
          </div>
        </div>
      </div>

      {/* Modal Permintaan Kolaborasi */}
      {showModalKolaborasi && (
        <PDModalKolaborasi
          onClose={() => setShowModalKolaborasi(false)}
          onSubmit={() => { setShowModalKolaborasi(false); showToast('Permintaan kolaborasi berhasil diajukan!', 'success'); }}
          showToast={showToast}
        />
      )}
    </div>
  );
}
