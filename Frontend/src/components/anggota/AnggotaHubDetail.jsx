import React, { useState } from 'react';
import { 
  ChevronLeft, 
  Calendar, 
  MapPin, 
  FileText, 
  Eye, 
  Heart, 
  MessageSquare,
  Sparkles
} from 'lucide-react';
import { interUkmApi } from '../../services/api.js';

export default function AnggotaHubDetail({ post, onBack, showToast }) {
  const [interested, setInterested] = useState(Boolean(post?.isLiked));
  const [interestCount, setInterestCount] = useState(post?.tertarik || post?.likes || 0);
  const [imgError, setImgError] = useState(false);

  const detail = post || {
    id: 1,
    judul: 'Publikasi Kolaborasi UKM',
    orgName: 'SIOMAS',
    orgCode: 'SI',
    orgType: 'Organisasi mahasiswa kampus',
    status: 'Published',
    bannerImage: '',
    headline: 'Publikasi Kolaborasi UKM',
    deskripsi: '-',
    pelaksanaan: '-',
    tempat: 'Kampus',
    fileName: '',
    fileSize: '',
    fileUrl: '',
    contactPerson: 'Pengurus UKM',
    contactRole: 'SIOMAS',
    contactWa: '-'
  };

  const bannerSrc = detail.bannerImage || detail.image || detail.img || '';
  const contactInitials = (detail.contactPerson || 'UK')
    .replace(/[^a-zA-Z0-9\s]/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map(w => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'UK';

  const handleInterest = async () => {
    const res = await interUkmApi.toggleInterest(detail.id);
    if (res.ok && res.data?.data) {
      const updated = res.data.data;
      setInterested(Boolean(updated.is_interested));
      setInterestCount(updated.interest_count || 0);
      showToast(
        updated.is_interested
          ? 'Ketertarikan Anda telah dicatat di sistem! Narahubung dapat melihat daftar peminat.'
          : 'Ketertarikan kolaborasi dibatalkan.',
        'success'
      );
    } else {
      setInterested(!interested);
      showToast(res.data?.message || 'Ketertarikan diperbarui.', 'info');
    }
  };

  const handleContact = () => {
    let cleanPhone = (detail.contactWa || '').replace(/[^0-9]/g, '');
    if (cleanPhone.startsWith('0')) {
      cleanPhone = '62' + cleanPhone.slice(1);
    }
    const text = encodeURIComponent(
      `Halo ${detail.contactPerson}, saya tertarik untuk berdiskusi mengenai publikasi kolaborasi "${detail.judul}" di Hub Inter-UKM SIOMAS.`
    );
    if (cleanPhone) {
      window.open(`https://wa.me/${cleanPhone}?text=${text}`, '_blank');
      showToast(`Membuka WhatsApp ke ${detail.contactPerson} (${detail.contactWa})...`, 'success');
    } else {
      showToast(`Nomor WhatsApp narahubung (${detail.contactPerson}) belum dicantumkan.`, 'warning');
    }
  };

  const handlePreviewPdf = () => {
    if (detail.fileUrl) {
      window.open(detail.fileUrl, '_blank');
    } else if (detail.fileName) {
      showToast(`Lampiran tercatat: ${detail.fileName}`, 'info');
    } else {
      showToast('Tidak ada berkas lampiran pada publikasi ini.', 'info');
    }
  };

  return (
    <div>
      {/* Back button */}
      <button type="button" className="back-link-btn" onClick={onBack}>
        <ChevronLeft size={16} /> Kembali ke Hub Inter-UKM
      </button>

      {/* Header Info */}
      <div className="page-header-block">
        <span className="page-category-tag">KOLABORASI INTER-UKM</span>
        <h1 className="page-title">{detail.judul}</h1>
        <p className="page-subtitle">Dipublikasikan {detail.orgName} • Terbuka untuk seluruh organisasi</p>
      </div>

      <div className="detail-layout-grid">
        {/* Left: Main Details Card */}
        <div className="detail-main-card" style={{ padding: '0', overflow: 'hidden' }}>
          {/* Org Header inside Card */}
          <div style={{ padding: '24px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #F1F5F9' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div className="org-avatar-badge org-blue" style={{ width: '44px', height: '44px', borderRadius: '12px', fontSize: '16px' }}>
                {detail.orgCode || 'SI'}
              </div>
              <div>
                <h4 style={{ fontSize: '16px', fontWeight: 800, color: '#0F172A', margin: 0 }}>{detail.orgName}</h4>
                <p style={{ fontSize: '12px', color: '#94A3B8', margin: '2px 0 0' }}>{detail.orgType || 'Organisasi mahasiswa kampus'}</p>
              </div>
            </div>

            <span className="tag-badge tag-green" style={{ fontSize: '12px', padding: '4px 10px' }}>
              {detail.status === 'pending' ? 'Menunggu Verifikasi' : 'Published'}
            </span>
          </div>

          {/* Photo Banner or Clean Visual Banner */}
          {bannerSrc && !imgError ? (
            <div style={{ width: '100%', height: '320px', overflow: 'hidden', background: '#F1F5F9' }}>
              <img 
                src={bannerSrc} 
                alt={detail.judul} 
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                onError={() => setImgError(true)}
              />
            </div>
          ) : (
            <div style={{
              width: '100%',
              height: '200px',
              background: 'linear-gradient(135deg, #1E1B4B 0%, #4F46E5 100%)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '24px',
              color: '#FFFFFF',
              textAlign: 'center'
            }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px' }}>
                <Sparkles size={24} />
              </div>
              <div style={{ fontSize: '18px', fontWeight: 800 }}>{detail.judul}</div>
              <div style={{ fontSize: '13px', color: '#C7D2FE', marginTop: '4px' }}>{detail.orgName}</div>
            </div>
          )}

          {/* Text Description */}
          <div style={{ padding: '28px' }}>
            <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#0F172A', marginBottom: '10px' }}>
              {detail.headline || detail.judul}
            </h3>
            <p style={{ fontSize: '14.5px', color: '#475569', lineHeight: '1.7', margin: 0 }}>
              {detail.deskripsi}
            </p>

            {/* 2 Tiles: Pelaksanaan & Tempat */}
            <div className="meta-grid-tiles" style={{ margin: '24px 0 20px' }}>
              <div className="meta-tile">
                <Calendar size={20} className="meta-tile-icon" />
                <div>
                  <div className="meta-tile-label">Pelaksanaan</div>
                  <div className="meta-tile-value">{detail.pelaksanaan}</div>
                </div>
              </div>

              <div className="meta-tile">
                <MapPin size={20} className="meta-tile-icon" />
                <div>
                  <div className="meta-tile-label">Tempat</div>
                  <div className="meta-tile-value">{detail.tempat}</div>
                </div>
              </div>
            </div>

            {/* Attachment preview box */}
            {detail.fileName && (
              <div style={{ background: '#FAFAFA', border: '1px solid #E2E8F0', borderRadius: '14px', padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div className="doc-icon-wrap" style={{ width: '42px', height: '42px' }}>
                    <FileText size={20} />
                  </div>
                  <div>
                    <h5 style={{ fontSize: '14px', fontWeight: 700, color: '#0F172A', margin: 0 }}>{detail.fileName}</h5>
                    <p style={{ fontSize: '12px', color: '#94A3B8', margin: '2px 0 0' }}>{detail.fileSize} • Dokumen lampiran kolaborasi</p>
                  </div>
                </div>

                <button 
                  type="button" 
                  className="portal-outline-btn"
                  style={{ width: 'auto', display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', fontSize: '13px' }}
                  onClick={handlePreviewPdf}
                >
                  <Eye size={15} /> {detail.fileUrl ? 'Buka Berkas' : 'Pratinjau'}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right: Contact Person Card */}
        <div>
          <div className="portal-card" style={{ textAlign: 'center', padding: '32px 24px' }}>
            <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', color: '#94A3B8', display: 'block', marginBottom: '20px' }}>
              CONTACT PERSON
            </span>

            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#EEF2FF', color: '#4F46E5', fontSize: '20px', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              {contactInitials}
            </div>

            <h4 style={{ fontSize: '17px', fontWeight: 800, color: '#0F172A', marginBottom: '4px' }}>
              {detail.contactPerson}
            </h4>
            <p style={{ fontSize: '13px', color: '#64748B', lineHeight: '1.4', marginBottom: '4px' }}>
              {detail.contactRole}
            </p>
            {detail.contactWa && detail.contactWa !== '-' && (
              <p style={{ fontSize: '12px', color: '#4F46E5', fontWeight: 600, marginBottom: '20px' }}>
                WA: {detail.contactWa}
              </p>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: detail.contactWa && detail.contactWa !== '-' ? 0 : '20px' }}>
              <button 
                type="button" 
                className="btn-primary-glow"
                style={{ width: '100%', justifyContent: 'center', padding: '12px' }}
                onClick={handleContact}
              >
                <MessageSquare size={16} /> Hubungi Narahubung
              </button>

              <button 
                type="button" 
                className="portal-outline-btn"
                style={{ 
                  width: '100%', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  gap: '6px', 
                  padding: '11px',
                  borderColor: interested ? '#10B981' : '#E2E8F0',
                  color: interested ? '#059669' : '#0F172A',
                  background: interested ? '#ECFDF5' : '#FFFFFF'
                }}
                onClick={handleInterest}
              >
                <Heart size={16} fill={interested ? '#10B981' : 'none'} />
                {interested ? `Ketertarikan Dinyatakan (${interestCount})` : `Nyatakan Ketertarikan (${interestCount})`}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
