import React, { useState } from 'react';
import { ChevronLeft, FileText, Eye, Sparkles } from 'lucide-react';

export default function PDDetailKolaborasi({ post, onBack, showToast }) {
  const [expressed, setExpressed] = useState(false);
  const [imgError, setImgError] = useState(false);

  const data = post || {
    judul: 'Publikasi Kolaborasi UKM',
    publishedBy: 'SIOMAS',
    isPublished: true,
    deskripsi: '-',
    headline: 'Publikasi Kolaborasi UKM',
    image: '',
    pelaksanaan: '-',
    tempat: 'Kampus',
    fileName: '',
    fileSize: '',
    fileUrl: '',
    contactPerson: 'Pengurus UKM',
    contactRole: 'SIOMAS',
    contactWa: '-',
    orgCode: 'SI',
    orgBadgeClass: 'org-blue'
  };

  const bannerSrc = data.bannerImage || data.image || data.img || '';
  const contactInitials = (data.contactPerson || 'UK')
    .replace(/[^a-zA-Z0-9\s]/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map(w => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'UK';

  const handleHubungi = () => {
    const cleanPhone = (data.contactWa || '').replace(/[^0-9]/g, '');
    if (cleanPhone) {
      window.open(`https://wa.me/${cleanPhone}`, '_blank');
    }
    showToast(`Membuka WhatsApp ke ${data.contactPerson}: ${data.contactWa}`, 'success');
  };

  const handleNyatakan = () => {
    setExpressed(true);
    showToast(`Ketertarikan berhasil dinyatakan. ${data.contactPerson} akan segera menghubungi Anda.`, 'success');
  };

  const handlePreview = () => {
    if (data.fileUrl) {
      window.open(data.fileUrl, '_blank');
    } else if (data.fileName) {
      showToast(`Lampiran tercatat: ${data.fileName}`, 'info');
    }
  };

  return (
    <div>
      {/* Back Link */}
      <div style={{ marginBottom: '12px' }}>
        <button
          type="button"
          style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', color: '#6366F1', fontSize: '13px', fontWeight: 600 }}
          onClick={onBack}
        >
          <ChevronLeft size={16} /> Kembali ke Hub Inter-UKM
        </button>
      </div>

      {/* Title Block */}
      <div style={{ marginBottom: '24px' }}>
        <span className="page-category-tag">KOLABORASI INTER-UKM</span>
        <h1 style={{ fontSize: '32px', fontWeight: 800, color: '#0F172A', marginBottom: '6px' }}>{data.judul}</h1>
        <p style={{ fontSize: '13px', color: '#64748B' }}>
          Dipublikasikan {data.publishedBy} • Terbuka untuk seluruh organisasi
        </p>
      </div>

      {/* Two-column layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: '24px', alignItems: 'start' }}>
        {/* Left: Main Content */}
        <div className="portal-card" style={{ padding: '28px' }}>
          {/* Org Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div className={`org-avatar-badge ${data.orgBadgeClass || 'org-blue'}`} style={{ width: '44px', height: '44px', fontSize: '14px' }}>
                {data.orgCode || 'SI'}
              </div>
              <div>
                <h4 style={{ fontSize: '16px', fontWeight: 800, color: '#0F172A', margin: '0 0 2px' }}>{data.publishedBy}</h4>
                <p style={{ fontSize: '12px', color: '#64748B', margin: 0 }}>Organisasi mahasiswa kampus</p>
              </div>
            </div>
            <span style={{ fontSize: '12px', fontWeight: 700, padding: '5px 14px', borderRadius: '20px', background: data.isPublished ? '#DCFCE7' : '#FEF3C7', color: data.isPublished ? '#16A34A' : '#D97706' }}>
              {data.isPublished ? 'Published' : 'Menunggu Verifikasi'}
            </span>
          </div>

          {/* Cover Image or Visual Banner */}
          {bannerSrc && !imgError ? (
            <div style={{ borderRadius: '12px', overflow: 'hidden', marginBottom: '20px' }}>
              <img
                src={bannerSrc}
                alt={data.judul}
                style={{ width: '100%', height: '320px', objectFit: 'cover' }}
                onError={() => setImgError(true)}
              />
            </div>
          ) : (
            <div style={{
              borderRadius: '12px',
              height: '180px',
              background: 'linear-gradient(135deg, #1E1B4B 0%, #4F46E5 100%)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '24px',
              color: '#FFFFFF',
              textAlign: 'center',
              marginBottom: '20px'
            }}>
              <Sparkles size={24} style={{ marginBottom: '8px' }} />
              <div style={{ fontSize: '18px', fontWeight: 800 }}>{data.judul}</div>
              <div style={{ fontSize: '12.5px', color: '#C7D2FE', marginTop: '4px' }}>{data.publishedBy}</div>
            </div>
          )}

          {/* Headline & Desc */}
          <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#0F172A', marginBottom: '10px' }}>{data.headline || data.judul}</h3>
          <p style={{ fontSize: '14px', color: '#475569', lineHeight: '1.7', marginBottom: '24px' }}>{data.deskripsi}</p>

          {/* Info Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', background: '#F8FAFC', borderRadius: '12px', padding: '16px', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ background: '#EEF2FF', borderRadius: '8px', padding: '8px', color: '#6366F1' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              </div>
              <div>
                <div style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 600, marginBottom: '2px' }}>Pelaksanaan</div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#0F172A' }}>{data.pelaksanaan}</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ background: '#EEF2FF', borderRadius: '8px', padding: '8px', color: '#6366F1' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
              </div>
              <div>
                <div style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 600, marginBottom: '2px' }}>Tempat</div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#0F172A' }}>{data.tempat}</div>
              </div>
            </div>
          </div>

          {/* Proposal File */}
          {data.fileName && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '14px 18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ background: '#FEE2E2', borderRadius: '8px', padding: '8px', color: '#DC2626' }}>
                  <FileText size={18} />
                </div>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#0F172A' }}>{data.fileName}</div>
                  <div style={{ fontSize: '12px', color: '#94A3B8' }}>{data.fileSize} • Proposal kerja sama</div>
                </div>
              </div>
              <button type="button" className="portal-outline-btn" style={{ width: 'auto', padding: '8px 16px', fontSize: '12.5px', display: 'flex', alignItems: 'center', gap: '6px' }} onClick={handlePreview}>
                <Eye size={14} /> {data.fileUrl ? 'Buka Berkas' : 'Pratinjau'}
              </button>
            </div>
          )}
        </div>

        {/* Right: Contact Person */}
        <div className="portal-card" style={{ padding: '24px', textAlign: 'center' }}>
          <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '1px', color: '#94A3B8', textTransform: 'uppercase', marginBottom: '16px' }}>CONTACT PERSON</p>

          <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px', fontSize: '20px', fontWeight: 800, color: '#6366F1' }}>
            {contactInitials}
          </div>

          <h4 style={{ fontSize: '15px', fontWeight: 700, color: '#0F172A', margin: '0 0 4px' }}>{data.contactPerson}</h4>
          <p style={{ fontSize: '12px', color: '#64748B', marginBottom: '20px', lineHeight: '1.5' }}>{data.contactRole}</p>

          <button
            type="button"
            className="btn-primary-glow"
            style={{ width: '100%', justifyContent: 'center', marginBottom: '10px', padding: '12px' }}
            onClick={handleHubungi}
          >
            Hubungi Narahubung
          </button>

          <button
            type="button"
            className="portal-outline-btn"
            style={{ width: '100%', padding: '11px', fontWeight: 600, background: expressed ? '#F0FDF4' : undefined, color: expressed ? '#16A34A' : undefined, borderColor: expressed ? '#16A34A' : undefined }}
            onClick={handleNyatakan}
            disabled={expressed}
          >
            {expressed ? '✓ Tertarik Berkolaborasi' : 'Nyatakan Ketertarikan'}
          </button>
        </div>
      </div>
    </div>
  );
}
