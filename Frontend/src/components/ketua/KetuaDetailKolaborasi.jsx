import React, { useState } from 'react';
import { ChevronLeft, Users, Calendar, MapPin, FileText, Eye } from 'lucide-react';

export default function KetuaDetailKolaborasi({ post, onBack, showToast }) {
  const data = post || {
    id: 1,
    org: 'BEM Universitas',
    orgInitial: 'BU',
    orgColor: '#3B82F6',
    judul: 'Campus Creative Week 2024',
    desc: 'Dipublikasikan BEM Universitas • Terbuka untuk seluruh organisasi',
    status: 'Published',
    img: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&q=80',
    konten: 'Ruang kreatif untuk karya dan kolaborasi mahasiswa',
    detail: 'Campus Creative Week menghadirkan pameran, workshop, pertunjukan, dan forum kolaborasi selama tiga hari. Kami mengundang SIOMAS sebagai mitra program dan media partner.',
    tanggal: '24-26 November 2024',
    tempat: 'Student Center',
    contactName: 'Nadya Ayuningtyas',
    contactRole: 'Koordinator Kolaborasi BEM Universitas',
    proposal: 'Proposal_Campus_Creative_Week.pdf',
    proposalSize: '3.2 MB',
    followers: '12.4K'
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
        <p style={{ fontSize: '13.5px', color: '#64748B' }}>{data.desc}</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '20px', alignItems: 'start' }}>
        {/* Main Content */}
        <div className="portal-card" style={{ padding: 0 }}>
          {/* Org Header */}
          <div style={{ padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #F1F5F9' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '40px', height: '40px', background: data.orgColor, borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: '14px' }}>
                {data.orgInitial}
              </div>
              <div>
                <div style={{ fontSize: '15px', fontWeight: 700, color: '#0F172A' }}>{data.org}</div>
                <div style={{ fontSize: '12px', color: '#94A3B8' }}>Organisasi terverifikasi • {data.followers} pengikut</div>
              </div>
            </div>
            <span style={{ background: '#ECFDF5', color: '#059669', fontSize: '12px', fontWeight: 700, padding: '4px 12px', borderRadius: '8px' }}>Published</span>
          </div>

          {/* Cover Image */}
          <img src={data.img} alt={data.judul} style={{ width: '100%', height: '300px', objectFit: 'cover' }} onError={e => { e.target.style.display = 'none'; }} />
          <div style={{ padding: '8px 24px 4px', fontSize: '11.5px', color: '#94A3B8' }}>Foto: Unsplash</div>

          {/* Content */}
          <div style={{ padding: '20px 24px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#0F172A', marginBottom: '8px' }}>{data.konten}</h2>
            <p style={{ fontSize: '14px', color: '#64748B', lineHeight: 1.6, marginBottom: '20px' }}>{data.detail}</p>

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
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px', border: '1px solid #E2E8F0', borderRadius: '10px', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '36px', height: '36px', background: '#FEE2E2', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#EF4444' }}>
                  <FileText size={18} />
                </div>
                <div>
                  <div style={{ fontSize: '13.5px', fontWeight: 600, color: '#0F172A' }}>{data.proposal}</div>
                  <div style={{ fontSize: '12px', color: '#94A3B8' }}>PDF • {data.proposalSize} • Proposal kerja sama</div>
                </div>
              </div>
              <button style={{ background: 'none', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '8px 14px', cursor: 'pointer', fontSize: '13px', fontWeight: 600, color: '#64748B', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Eye size={14} /> Pratinjau
              </button>
            </div>
          </div>
        </div>

        {/* Sidebar: Contact Person */}
        <div className="portal-card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: '#94A3B8', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '16px' }}>CONTACT PERSON</div>
          <div style={{ width: '60px', height: '60px', background: '#E2E8F0', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px', fontSize: '20px', fontWeight: 700, color: '#0F172A' }}>
            {data.contactName?.split(' ').map(w => w[0]).join('').slice(0, 2)}
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
