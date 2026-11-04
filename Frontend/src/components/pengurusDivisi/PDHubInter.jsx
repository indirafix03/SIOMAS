import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Heart, Share2, Users, ChevronRight } from 'lucide-react';
import PDFormPublikasi from './PDFormPublikasi.jsx';
import PDModalKolaborasi from './PDModalKolaborasi.jsx';
import { interUkmApi, schedulesApi, parseInterUkmPost } from '../../services/api.js';

const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

export default function PDHubInter({ onNavigate, onSelectPost, showToast }) {
  const [showFormPublikasi, setShowFormPublikasi] = useState(false);
  const [showModalKolaborasi, setShowModalKolaborasi] = useState(false);
  const [posts, setPosts] = useState([]);
  const [agendaBersama, setAgendaBersama] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadHubData = useCallback(async () => {
    setLoading(true);
    const [feedRes, myRes, schedRes] = await Promise.all([
      interUkmApi.getFeed(),
      interUkmApi.getMyPosts(),
      schedulesApi.getAll()
    ]);

    const feedList = feedRes.ok && feedRes.data?.data ? feedRes.data.data : [];
    const myList = myRes.ok && myRes.data?.data ? myRes.data.data : [];
    const mergedMap = new Map();
    [...myList, ...feedList].forEach(item => mergedMap.set(item.id, parseInterUkmPost(item)));
    setPosts(Array.from(mergedMap.values()));

    const schedList = schedRes.ok && schedRes.data?.data ? schedRes.data.data : [];
    const clsList = ['blue', 'green', ''];
    const colorList = ['#6366F1', '#10B981', '#D97706'];
    setAgendaBersama(
      schedList.slice(0, 3).map((s, idx) => {
        const d = new Date(s.waktu);
        const valid = !isNaN(d.getTime());
        return {
          id: s.id,
          day: valid ? String(d.getDate()) : '--',
          month: valid ? MONTHS_SHORT[d.getMonth()] : '---',
          title: s.judul_kegiatan,
          loc: s.lokasi || 'Kampus',
          cls: clsList[idx % clsList.length],
          color: colorList[idx % colorList.length],
          bg: idx % 3 === 2 ? '#FFFBEB' : undefined
        };
      })
    );
    setLoading(false);
  }, []);

  useEffect(() => {
    loadHubData();
  }, [loadHubData]);

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
        onSubmitSuccess={() => {
          setShowFormPublikasi(false);
          loadHubData();
        }}
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
            {posts.length > 0 && (
              <button type="button" className="portal-link-btn" onClick={loadHubData}>
                Segarkan <ChevronRight size={14} />
              </button>
            )}
          </div>

          {loading ? (
            <div className="portal-card" style={{ textAlign: 'center', padding: '40px 20px', color: '#94A3B8' }}>
              Memuat publikasi Hub Inter-UKM...
            </div>
          ) : posts.length === 0 ? (
            <div className="portal-card" style={{ textAlign: 'center', padding: '48px 24px', color: '#64748B' }}>
              <div style={{ fontSize: '15px', fontWeight: 600, color: '#0F172A', marginBottom: '6px' }}>Belum ada publikasi kolaborasi Inter-UKM</div>
              <p style={{ fontSize: '13px', color: '#94A3B8', margin: 0 }}>
                Klik <strong>Publikasikan ke Hub</strong> atau <strong>Buat Permintaan Kolaborasi</strong> untuk mengajukan publikasi baru.
              </p>
            </div>
          ) : (
            posts.map((post) => (
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

                {post.image && (
                  <div className="hub-post-image-wrap">
                    <img src={post.image} alt={post.judul} onError={e => { e.target.parentElement.style.display = 'none'; }} />
                  </div>
                )}

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
            ))
          )}
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
              {agendaBersama.length === 0 ? (
                <div style={{ fontSize: '12.5px', color: '#94A3B8', textAlign: 'center', padding: '12px 0' }}>
                  Belum ada agenda bersama.
                </div>
              ) : (
                agendaBersama.map((item) => (
                  <div key={item.id} className="upcoming-schedule-item">
                    <div className={`schedule-date-badge ${item.cls}`} style={item.bg ? { background: item.bg, color: item.color } : {}}>
                      <span className="schedule-date-day">{item.day}</span>
                      <span className="schedule-date-month">{item.month}</span>
                    </div>
                    <div className="schedule-details">
                      <h5 className="schedule-title">{item.title}</h5>
                      <span className="schedule-meta">{item.loc}</span>
                    </div>
                  </div>
                ))
              )}
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
          onSubmit={() => {
            setShowModalKolaborasi(false);
            loadHubData();
          }}
          showToast={showToast}
        />
      )}
    </div>
  );
}
