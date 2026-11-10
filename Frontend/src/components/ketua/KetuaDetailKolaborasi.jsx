import React, { useState } from 'react';
import { ChevronLeft, Calendar, MapPin, FileText, Eye, Sparkles, CheckCircle2, XCircle } from 'lucide-react';
import { interUkmApi } from '../../services/api.js';

export default function KetuaDetailKolaborasi({ post, onBack, onStatusChange, showToast }) {
  const [imgError, setImgError] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [localStatus, setLocalStatus] = useState(post?.status || 'approved');
  const [interested, setInterested] = useState(Boolean(post?.isLiked));
  const [interestCount, setInterestCount] = useState(post?.tertarik || post?.likes || 0);

  const data = post || {
    id: 1,
    org: 'SIOMAS',
    orgInitial: 'SI',
    orgColor: '#4F46E5',
    judul: 'Publikasi Kolaborasi UKM',
    desc: '-',
    status: 'approved',
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

  const isPending = localStatus === 'pending';
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

  const handleContact = () => {
    let cleanPhone = (data.contactWa || '').replace(/[^0-9]/g, '');
    if (cleanPhone.startsWith('0')) {
      cleanPhone = '62' + cleanPhone.slice(1);
    }
    const text = encodeURIComponent(
      `Halo ${data.contactName}, saya menghubungi terkait publikasi kolaborasi "${data.judul}" di Hub Inter-UKM SIOMAS.`
    );
    if (cleanPhone) {
      window.open(`https://wa.me/${cleanPhone}?text=${text}`, '_blank');
      showToast && showToast(`Membuka WhatsApp ke ${data.contactName} (${data.contactWa})...`, 'success');
    } else {
      showToast && showToast(`Nomor WhatsApp narahubung (${data.contactName}) belum dicantumkan.`, 'warning');
    }
  };

  const handleInterest = async () => {
    const res = await interUkmApi.toggleInterest(data.id);
    if (res.ok && res.data?.data) {
      const updated = res.data.data;
      setInterested(Boolean(updated.is_interested));
      setInterestCount(updated.interest_count || 0);
      showToast && showToast(
        updated.is_interested
          ? 'Ketertarikan Anda pada kolaborasi ini berhasil dicatat!'
          : 'Ketertarikan kolaborasi dibatalkan.',
        'success'
      );
    } else {
      setInterested(!interested);
      showToast && showToast('Ketertarikan dicatat!', 'success');
    }
  };

  const handleApprove = async () => {
    setProcessing(true);
    const res = await interUkmApi.approve(data.id);
    setProcessing(false);
    if (res.ok) {
      setLocalStatus('approved');
      showToast && showToast(`Publikasi "${data.judul}" berhasil disetujui dan disiarkan!`, 'success');
      onStatusChange && onStatusChange('approved');
    } else {
      showToast && showToast(res.data?.message || 'Gagal menyetujui publikasi.', 'error');
    }
  };

  const handleReject = async () => {
    setProcessing(true);
    const res = await interUkmApi.reject(data.id, 'Ditolak oleh Ketua UKM');
    setProcessing(false);
    if (res.ok) {
      setLocalStatus('rejected');
      showToast && showToast(`Publikasi "${data.judul}" telah ditolak.`, 'info');
      onStatusChange && onStatusChange('rejected');
      onBack && onBack();
    } else {
      showToast && showToast(res.data?.message || 'Gagal menolak publikasi.', 'error');
    }
  };

  return (
    <div>
      {/* Back */}
      <button onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', cursor: 'pointer', color: '#4F46E5', fontSize: '14px', fontWeight: 600, fontFamily: 'inherit', marginBottom: '16px' }}>
        <ChevronLeft size={16} /> Kembali ke Hub Inter-UKM
      </button>

      {/* Banner Verifikasi jika masih Pending */}
      {isPending && (
        <div style={{
          background: '#FFFBEB',
          border: '1.5px solid #FCD34D',
          borderRadius: '14px',
          padding: '16px 20px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
          flexWrap: 'wrap'
        }}>
          <div>
            <div style={{ fontSize: '12px', fontWeight: 800, color: '#D97706', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              MENUNGGU VERIFIKASI KETUA UKM (BR-02)
            </div>
            <div style={{ fontSize: '14px', fontWeight: 600, color: '#0F172A', marginTop: '2px' }}>
              Publikasi ini diajukan oleh <strong>{data.contactName}</strong> ({data.org}) dan belum tayang di feed publik.
            </div>
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <button
              type="button"
              disabled={processing}
              onClick={handleReject}
              style={{
                background: '#EF4444',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '10px',
                padding: '10px 18px',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: 700,
                fontFamily: 'inherit',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <XCircle size={16} /> Tolak Publikasi
            </button>
            <button
              type="button"
              disabled={processing}
              onClick={handleApprove}
              style={{
                background: '#10B981',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '10px',
                padding: '10px 18px',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: 700,
                fontFamily: 'inherit',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)'
              }}
            >
              <CheckCircle2 size={16} /> ✓ Setujui & Siarkan
            </button>
          </div>
        </div>
      )}

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
            <span style={{ background: isPending ? '#FEF3C7' : '#ECFDF5', color: isPending ? '#D97706' : '#059669', fontSize: '12px', fontWeight: 700, padding: '4px 12px', borderRadius: '8px' }}>
              {isPending ? 'Menunggu Verifikasi' : 'Published'}
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

        {/* Sidebar: Contact Person + Tindakan Verifikasi */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="portal-card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#94A3B8', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '16px' }}>CONTACT PERSON</div>
            <div style={{ width: '60px', height: '60px', background: '#EEF2FF', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px', fontSize: '20px', fontWeight: 700, color: '#4F46E5' }}>
              {contactInitials}
            </div>
            <div style={{ fontSize: '15px', fontWeight: 700, color: '#0F172A', marginBottom: '4px' }}>{data.contactName}</div>
            <div style={{ fontSize: '12.5px', color: '#64748B', marginBottom: '4px' }}>{data.contactRole}</div>
            {data.contactWa && data.contactWa !== '-' && (
              <div style={{ fontSize: '12px', color: '#4F46E5', fontWeight: 600, marginBottom: '14px' }}>WA: {data.contactWa}</div>
            )}

            <button className="btn-primary" style={{ marginBottom: '10px', marginTop: data.contactWa && data.contactWa !== '-' ? 0 : '12px' }} onClick={handleContact}>
              Hubungi Narahubung
            </button>
            <button
              className="btn-secondary"
              style={{
                borderColor: interested ? '#10B981' : undefined,
                color: interested ? '#059669' : undefined,
                background: interested ? '#ECFDF5' : undefined
              }}
              onClick={handleInterest}
            >
              {interested ? `✓ Ketertarikan Dinyatakan (${interestCount})` : `Nyatakan Ketertarikan (${interestCount})`}
            </button>
          </div>

          {isPending && (
            <div className="portal-card" style={{ border: '1.5px solid #FCD34D', background: '#FFFBEB' }}>
              <div style={{ fontSize: '12px', fontWeight: 800, color: '#D97706', marginBottom: '8px', textTransform: 'uppercase' }}>
                Tindakan Ketua UKM
              </div>
              <p style={{ fontSize: '12.5px', color: '#92400E', marginBottom: '14px', lineHeight: 1.5 }}>
                Setujui publikasi ini agar langsung tayang di Hub Inter-UKM seluruh anggota.
              </p>
              <button
                type="button"
                disabled={processing}
                onClick={handleApprove}
                className="btn-primary"
                style={{ background: '#10B981', marginBottom: '8px', width: '100%' }}
              >
                ✓ Setujui & Siarkan
              </button>
              <button
                type="button"
                disabled={processing}
                onClick={handleReject}
                style={{
                  width: '100%',
                  background: '#EF4444',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '10px',
                  fontWeight: 600,
                  fontSize: '13px',
                  cursor: 'pointer',
                  fontFamily: 'inherit'
                }}
              >
                Tolak Publikasi
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
