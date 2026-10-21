import React, { useState } from 'react';
import { 
  ChevronLeft, 
  Calendar, 
  MapPin, 
  FileText, 
  Eye, 
  Heart, 
  MessageSquare, 
  CheckCircle2, 
  ExternalLink 
} from 'lucide-react';

export default function AnggotaHubDetail({ post, onBack, showToast }) {
  const [interested, setInterested] = useState(false);

  const detail = post || {
    id: 1,
    judul: 'Campus Creative Week 2024',
    orgName: 'BEM Universitas',
    orgCode: 'BU',
    orgType: 'Organisasi terverifikasi • 12.4K pengikut',
    status: 'Published',
    bannerImage: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=1200&auto=format&fit=crop&q=80',
    headline: 'Ruang kreatif untuk karya dan kolaborasi mahasiswa',
    deskripsi: 'Campus Creative Week menghadirkan pameran, workshop, pertunjukan, dan forum kolaborasi selama tiga hari. Kami mengundang SIOMAS sebagai mitra program dan media partner.',
    pelaksanaan: '24–26 November 2024',
    tempat: 'Student Center',
    fileName: 'Proposal_Campus_Creative_Week.pdf',
    fileSize: '3.2 MB',
    contactPerson: 'Nadya Ayuningtyas',
    contactRole: 'Koordinator Kolaborasi BEM Universitas',
    contactWa: '+62 812 9988 7766'
  };

  const handleInterest = () => {
    setInterested(!interested);
    showToast(
      !interested 
        ? 'Anda telah menyatakan ketertarikan pada kolaborasi ini! Koordinator akan segera menghubungi.'
        : 'Ketertarikan dibatalkan.',
      'success'
    );
  };

  const handleContact = () => {
    showToast(`Membuka kontak WhatsApp ${detail.contactPerson} (${detail.contactWa})...`, 'info');
  };

  const handlePreviewPdf = () => {
    showToast(`Membuka pratinjau berkas ${detail.fileName}...`, 'info');
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
                {detail.orgCode || 'BU'}
              </div>
              <div>
                <h4 style={{ fontSize: '16px', fontWeight: 800, color: '#0F172A', margin: 0 }}>{detail.orgName}</h4>
                <p style={{ fontSize: '12px', color: '#94A3B8', margin: '2px 0 0' }}>{detail.orgType}</p>
              </div>
            </div>

            <span className="tag-badge tag-green" style={{ fontSize: '12px', padding: '4px 10px' }}>
              {detail.status || 'Published'}
            </span>
          </div>

          {/* Big Photo Banner */}
          <div style={{ width: '100%', height: '360px', overflow: 'hidden', background: '#F1F5F9' }}>
            <img 
              src={detail.bannerImage} 
              alt={detail.judul} 
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </div>

          {/* Text Description */}
          <div style={{ padding: '28px' }}>
            <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#0F172A', marginBottom: '10px' }}>
              {detail.headline}
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
            <div style={{ background: '#FAFAFA', border: '1px solid #E2E8F0', borderRadius: '14px', padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div className="doc-icon-wrap" style={{ width: '42px', height: '42px' }}>
                  <FileText size={20} />
                </div>
                <div>
                  <h5 style={{ fontSize: '14px', fontWeight: 700, color: '#0F172A', margin: 0 }}>{detail.fileName}</h5>
                  <p style={{ fontSize: '12px', color: '#94A3B8', margin: '2px 0 0' }}>PDF • {detail.fileSize} • Proposal kerja sama</p>
                </div>
              </div>

              <button 
                type="button" 
                className="portal-outline-btn"
                style={{ width: 'auto', display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', fontSize: '13px' }}
                onClick={handlePreviewPdf}
              >
                <Eye size={15} /> Pratinjau
              </button>
            </div>
          </div>
        </div>

        {/* Right: Contact Person Card */}
        <div>
          <div className="portal-card" style={{ textAlign: 'center', padding: '32px 24px' }}>
            <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', color: '#94A3B8', display: 'block', marginBottom: '20px' }}>
              CONTACT PERSON
            </span>

            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#EEF2FF', color: '#4F46E5', fontSize: '20px', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              NA
            </div>

            <h4 style={{ fontSize: '17px', fontWeight: 800, color: '#0F172A', marginBottom: '4px' }}>
              {detail.contactPerson}
            </h4>
            <p style={{ fontSize: '13px', color: '#64748B', lineHeight: '1.4', marginBottom: '24px' }}>
              {detail.contactRole}
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
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
                {interested ? 'Ketertarikan Dinyatakan' : 'Nyatakan Ketertarikan'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
