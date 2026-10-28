import React, { useState } from 'react';
import { ChevronLeft, FileText, Eye } from 'lucide-react';

export default function PDDetailKolaborasi({ post, onBack, showToast }) {
  const data = post || {
    judul: 'Campus Creative Week 2024',
    publishedBy: 'BEM Universitas',
    isPublished: true,
    deskripsi: 'Campus Creative Week menghadirkan pameran, workshop, pertunjukan, dan forum kolaborasi selama tiga hari. Kami mengundang SIOMAS sebagai mitra program dan media partner.',
    headline: 'Ruang kreatif untuk karya dan kolaborasi mahasiswa',
    image: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=1000&auto=format&fit=crop&q=80',
    pelaksanaan: '24–26 November 2024',
    tempat: 'Student Center',
    fileName: 'Proposal_Campus_Creative_Week.pdf',
    fileSize: '3.2 MB',
    contactPerson: 'Nadya Ayuningtyas',
    contactRole: 'Koordinator Kolaborasi BEM Universitas',
    contactWa: '+62 812 9988 7766',
    orgCode: 'BU',
    orgBadgeClass: 'org-blue'
  };

  const [expressed, setExpressed] = useState(false);

  const handleHubungi = () => {
    showToast(`Membuka WhatsApp ke ${data.contactPerson}: ${data.contactWa}`, 'success');
    window.open(`https://wa.me/${(data.contactWa || '').replace(/[^0-9]/g, '')}`, '_blank');
  };

  const handleNyatakan = () => {
    setExpressed(true);
    showToast(`Ketertarikan berhasil dinyatakan. ${data.contactPerson} akan segera menghubungi Anda.`, 'success');
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
                {data.orgCode}
              </div>
              <div>
                <h4 style={{ fontSize: '16px', fontWeight: 800, color: '#0F172A', margin: '0 0 2px' }}>{data.publishedBy}</h4>
                <p style={{ fontSize: '12px', color: '#64748B', margin: 0 }}>Organisasi terverifikasi • 12.4K pengikut</p>
              </div>
            </div>
            {data.isPublished && (
              <span style={{ fontSize: '12px', fontWeight: 700, padding: '5px 14px', borderRadius: '20px', background: '#DCFCE7', color: '#16A34A' }}>
                Published
              </span>
            )}
          </div>

          {/* Cover Image */}
          <div style={{ borderRadius: '12px', overflow: 'hidden', marginBottom: '20px' }}>
            <img src={data.image} alt={data.judul} style={{ width: '100%', height: '340px', objectFit: 'cover' }} />
          </div>
          <p style={{ fontSize: '11px', color: '#94A3B8', textAlign: 'right', marginTop: '-16px', marginBottom: '20px' }}>
            Foto oleh Vitaly Gariev melalui Unsplash
          </p>

          {/* Headline & Desc */}
          <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#0F172A', marginBottom: '10px' }}>{data.headline}</h3>
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
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '14px 18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{ background: '#FEE2E2', borderRadius: '8px', padding: '8px', color: '#DC2626' }}>
                <FileText size={18} />
              </div>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#0F172A' }}>{data.fileName}</div>
                <div style={{ fontSize: '12px', color: '#94A3B8' }}>PDF • {data.fileSize} • Proposal kerja sama</div>
              </div>
            </div>
            <button type="button" className="portal-outline-btn" style={{ width: 'auto', padding: '8px 16px', fontSize: '12.5px', display: 'flex', alignItems: 'center', gap: '6px' }} onClick={() => showToast(`Membuka pratinjau ${data.fileName}`, 'info')}>
              <Eye size={14} /> Pratinjau
            </button>
          </div>
        </div>

        {/* Right: Contact Person */}
        <div className="portal-card" style={{ padding: '24px', textAlign: 'center' }}>
          <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '1px', color: '#94A3B8', textTransform: 'uppercase', marginBottom: '16px' }}>CONTACT PERSON</p>

          <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px', fontSize: '20px', fontWeight: 800, color: '#6366F1' }}>
            {data.contactPerson ? data.contactPerson.split(' ').map((n) => n[0]).join('').slice(0, 2) : 'NA'}
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
