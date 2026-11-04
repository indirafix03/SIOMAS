import React, { useState } from 'react';
import { ChevronLeft, Calendar, MapPin, FileText, Eye, Sparkles } from 'lucide-react';

export default function KetuaDetailKolaborasi({ post, onBack, showToast }) {
  const [imgError, setImgError] = useState(false);

  const data = post || {
    id: 1,
    org: 'SIOMAS',
    orgInitial: 'SI',
    orgColor: '#4F46E5',
    judul: 'Publikasi Kolaborasi UKM',
    desc: '-',
    status: 'Published',
    img: '',
    konten: 'Publikasi Kolaborasi UKM',
    detail: '-',
    tanggal: '-',
    tempat: 'Kampus',
    contactName: 'Pengurus UKM',
    contactRole: 'SIOMAS',
    proposal: '',
    proposalSize: '',
    fileUrl: '',
    followers: 'Aktif'
  };

  const bannerSrc = data.bannerImage || data.image || data.img || '';
  const contactInitials = (data.contactName || 'UK')
    .replace(/[^a-zA-Z0-9\s]/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map(w => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'UK';

  const handlePreview = () => {
    if (data.fileUrl) {
      window.open(data.fileUrl, '_blank');
    } else if (data.proposal) {
      showToast && showToast(`Lampiran tercatat: ${data.proposal}`, 'info');
    }
  };

  return (
    <div>
      {/* Back */}
      <button onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', cursor: 'pointer', color: '#4F46E5', fontSize: '14px', fontWeight: 600, fontFamily: 'inherit', marginBottom: '16px' }}>
        <ChevronLeft size={16} /> Kembali ke Hub Inter-UKM
      </button>

      <div style={{ marginBottom: '20px' }}>
        <span style={{ fontSize: '12px', fontWeight: 700, color: '#4F46E5', letterSpacing: '0.06em', textTransform: 'uppercase' }}>KOLABORASI INTER-UKM</span>
        <h1 className="page-title" style={{ marginTop: '4px' }}>{data.judul}</h1>
        <p style={{ fontSize: '13.5px', color: '#64748B' }}>Dipublikasikan {data.org} • Terbuka untuk seluruh organisasi</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '20px', alignItems: 'start' }}>
        {/* Main Content */}
        <div className="portal-card" style={{ padding: 0, overflow: 'hidden' }}>
          {/* Org Header */}
          <div style={{ padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #F1F5F9' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '40px', height: '40px', background: data.orgColor || '#4F46E5', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: '14px' }}>
                {data.orgInitial || 'SI'}
              </div>
              <div>
                <div style={{ fontSize: '15px', fontWeight: 700, color: '#0F172A' }}>{data.org}</div>
                <div style={{ fontSize: '12px', color: '#94A3B8' }}>Organisasi mahasiswa kampus</div>
              </div>
            </div>
            <span style={{ background: data.status === 'pending' ? '#FEF3C7' : '#ECFDF5', color: data.status === 'pending' ? '#D97706' : '#059669', fontSize: '12px', fontWeight: 700, padding: '4px 12px', borderRadius: '8px' }}>
              {data.status === 'pending' ? 'Menunggu Verifikasi' : 'Published'}
            </span>
          </div>

          {/* Cover Image or Visual Banner */}
          {bannerSrc && !imgError ? (
            <img
              src={bannerSrc}
              alt={data.judul}
              style={{ width: '100%', height: '300px', objectFit: 'cover' }}
              onError={() => setImgError(true)}
            />
          ) : (
            <div style={{
              width: '100%',
              height: '180px',
              background: 'linear-gradient(135deg, #1E1B4B 0%, #4F46E5 100%)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '24px',
              color: '#FFFFFF',
              textAlign: 'center'
            }}>
              <Sparkles size={24} style={{ marginBottom: '8px' }} />
              <div style={{ fontSize: '18px', fontWeight: 800 }}>{data.judul}</div>
              <div style={{ fontSize: '13px', color: '#C7D2FE', marginTop: '4px' }}>{data.org}</div>
            </div>
          )}

          {/* Content */}
          <div style={{ padding: '20px 24px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#0F172A', marginBottom: '8px' }}>{data.konten || data.judul}</h2>
            <p style={{ fontSize: '14px', color: '#64748B', lineHeight: 1.6, marginBottom: '20px' }}>{data.detail || data.desc}</p>

            {/* Info Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '14px', background: '#F8FAFC', borderRadius: '10px' }}>
                <Calendar size={18} color="#4F46E5" />
                <div>
                  <div style={{ fontSize: '11px', color: '#94A3B8' }}>Pelaksanaan</div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: '#0F172A' }}>{data.tanggal}</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '14px', background: '#F8FAFC', borderRadius: '10px' }}>
                <MapPin size={18} color="#4F46E5" />
                <div>
                  <div style={{ fontSize: '11px', color: '#94A3B8' }}>Tempat</div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: '#0F172A' }}>{data.tempat}</div>
                </div>
              </div>
            </div>

            {/* Proposal */}
            {data.proposal && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px', border: '1px solid #E2E8F0', borderRadius: '10px', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '36px', height: '36px', background: '#FEE2E2', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#EF4444' }}>
                    <FileText size={18} />
                  </div>
                  <div>
                    <div style={{ fontSize: '13.5px', fontWeight: 600, color: '#0F172A' }}>{data.proposal}</div>
                    <div style={{ fontSize: '12px', color: '#94A3B8' }}>{data.proposalSize} • Proposal kerja sama</div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handlePreview}
                  style={{ background: 'none', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '8px 14px', cursor: 'pointer', fontSize: '13px', fontWeight: 600, color: '#64748B', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <Eye size={14} /> {data.fileUrl ? 'Buka Berkas' : 'Pratinjau'}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar: Contact Person */}
        <div className="portal-card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: '#94A3B8', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '16px' }}>CONTACT PERSON</div>
          <div style={{ width: '60px', height: '60px', background: '#EEF2FF', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px', fontSize: '20px', fontWeight: 700, color: '#4F46E5' }}>
            {contactInitials}
          </div>
          <div style={{ fontSize: '15px', fontWeight: 700, color: '#0F172A', marginBottom: '4px' }}>{data.contactName}</div>
          <div style={{ fontSize: '12.5px', color: '#64748B', marginBottom: '16px' }}>{data.contactRole}</div>

          <button className="btn-primary" style={{ marginBottom: '10px' }} onClick={() => showToast && showToast('Menghubungi narahubung...', 'success')}>
            Hubungi Narahubung
          </button>
          <button className="btn-secondary" onClick={() => showToast && showToast('Ketertarikan dicatat!', 'success')}>
            Nyatakan Ketertarikan
          </button>
        </div>
      </div>
    </div>
  );
}
