import React, { useState, useEffect } from 'react';
import { Users, Calendar, FileText, Link2, Shield } from 'lucide-react';
import { apiFetch, schedulesApi, documentsApi, lpjApi, interUkmApi } from '../../services/api.js';

export default function KetuaDashboardEksekutif({ onNavigate }) {
  const [counts, setCounts] = useState({
    activeUsers: 0,
    totalUsers: 0,
    schedulesCount: 0,
    lpjApprovedPct: 0,
    interUkmCount: 0
  });

  useEffect(() => {
    async function loadData() {
      const [usersRes, schedRes, docsRes, lpjPendingRes, interRes] = await Promise.all([
        apiFetch('/auth/users'),
        schedulesApi.getAll(),
        documentsApi.getAll(),
        lpjApi.getPendingValidation(),
        interUkmApi.getFeed()
      ]);

      const allUsers = usersRes.ok && usersRes.data?.data ? usersRes.data.data : [];
      const activeUsers = allUsers.filter(u => u.status_keanggotaan === 'Aktif').length;
      const scheds = schedRes.ok && schedRes.data?.data ? schedRes.data.data : [];
      const approvedDocs = docsRes.ok && docsRes.data?.data ? docsRes.data.data : [];
      const pendingLpj = lpjPendingRes.ok && lpjPendingRes.data?.data ? lpjPendingRes.data.data : [];
      const interFeed = interRes.ok && interRes.data?.data ? interRes.data.data : [];

      const totalDocs = approvedDocs.length + pendingLpj.length;
      const lpjPct = totalDocs > 0 ? Math.round((approvedDocs.length / totalDocs) * 100) : 0;

      setCounts({
        activeUsers,
        totalUsers: allUsers.length,
        schedulesCount: scheds.length,
        lpjApprovedPct: lpjPct,
        interUkmCount: interFeed.length
      });
    }
    loadData();
  }, []);

  const stats = [
    { label: 'Anggota aktif', value: String(counts.activeUsers), sub: 'Periode berjalan', icon: Users, color: '#6366F1', bg: '#EEF2FF' },
    { label: 'Program berjalan', value: String(counts.schedulesCount), sub: 'Periode berjalan', icon: Calendar, color: '#10B981', bg: '#ECFDF5' },
    { label: 'LPJ approved', value: `${counts.lpjApprovedPct}%`, sub: 'Periode berjalan', icon: FileText, color: '#F59E0B', bg: '#FFFBEB' },
    { label: 'Kolaborasi aktif', value: String(counts.interUkmCount), sub: 'Periode berjalan', icon: Link2, color: '#4F46E5', bg: '#EEF2FF' }
  ];

  const userValidPct = counts.totalUsers > 0 ? Math.round((counts.activeUsers / counts.totalUsers) * 100) : 0;
  const health = [
    { label: 'Kelengkapan LPJ', pct: counts.lpjApprovedPct },
    { label: 'Validitas akun', pct: userValidPct },
    { label: 'Program terjadwal', pct: counts.schedulesCount > 0 ? 100 : 0 },
    { label: 'Kolaborasi Inter-UKM', pct: counts.interUkmCount > 0 ? 100 : 0 }
  ];

  return (
    <div>
      {/* Hero Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #0F172A 0%, #1E1B4B 100%)',
        borderRadius: '16px',
        padding: '32px 36px',
        marginBottom: '24px',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute', top: '-40px', right: '-40px',
          width: '200px', height: '200px', borderRadius: '50%',
          background: 'rgba(99, 102, 241, 0.3)', filter: 'blur(40px)'
        }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <span style={{
            background: '#4F46E5', color: '#fff', fontSize: '11px', fontWeight: 700,
            padding: '4px 12px', borderRadius: '999px', letterSpacing: '0.06em', textTransform: 'uppercase'
          }}>EXECUTIVE OVERVIEW</span>
          <h1 style={{ fontSize: '32px', fontWeight: 700, color: '#fff', marginTop: '12px', marginBottom: '8px', letterSpacing: '-0.02em' }}>
            Kinerja organisasi dalam satu pandangan
          </h1>
          <p style={{ fontSize: '13.5px', color: '#94A3B8', marginBottom: '20px' }}>
            Ringkasan operasional, kepatuhan administrasi, dan aktivitas organisasi secara real-time dari database.
          </p>
          <button
            type="button"
            onClick={() => onNavigate('k-audit-log')}
            style={{
              background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)',
              color: '#fff', padding: '10px 20px', borderRadius: '10px', cursor: 'pointer',
              fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px'
            }}
          >
            <Shield size={16} /> Akses Konsol Audit Log
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="portal-stats-grid" style={{ marginBottom: '24px' }}>
        {stats.map((s, i) => {
          const Icon = s.icon;
          return (
            <div key={i} className="portal-stat-card">
              <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.color, flexShrink: 0 }}>
                <Icon size={22} />
              </div>
              <div className="portal-stat-info">
                <span className="portal-stat-label">{s.label}</span>
                <span className="portal-stat-number">{s.value}</span>
                <span style={{ fontSize: '12px', color: '#64748B' }}>{s.sub}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Health indicators */}
      <div className="portal-card">
        <div className="portal-card-header">
          <h3 className="portal-card-title">Kesehatan administrasi</h3>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '12px' }}>
          {health.map((h, i) => (
            <div key={i}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontSize: '13px', color: '#0F172A', fontWeight: 500 }}>{h.label}</span>
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#4F46E5' }}>{h.pct}%</span>
              </div>
              <div style={{ height: '8px', background: '#EEF2FF', borderRadius: '999px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${h.pct}%`, background: '#4F46E5', borderRadius: '999px', transition: 'width 0.6s ease' }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
