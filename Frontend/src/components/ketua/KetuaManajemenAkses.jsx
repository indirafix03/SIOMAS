import React, { useState, useEffect } from 'react';
import { Shield, Search, Check } from 'lucide-react';
import { apiFetch } from '../../services/api.js';

export default function KetuaManajemenAkses({ showToast }) {
  const [activeTab, setActiveTab] = useState('Menunggu Verifikasi');
  const [search, setSearch] = useState('');
  const [users, setUsers] = useState([]);

  const loadUsers = async () => {
    const res = await apiFetch('/auth/users');
    if (res.ok && res.data?.data) {
      const mapped = res.data.data.map((u) => {
        const parts = (u.nama || 'U').trim().split(' ');
        const initial = parts.length >= 2 ? (parts[0][0] + parts[1][0]).toUpperCase() : (u.nama || 'U').slice(0, 2).toUpperCase();
        return {
          id: u.id,
          nama: u.nama,
          nim: u.nim || u.email,
          divisi: u.job_desc || u.role,
          tanggal: u.created_at ? u.created_at.split(' ')[0] : '-',
          status: u.status_keanggotaan === 'Menunggu Verifikasi' ? 'Menunggu' : u.status_keanggotaan,
          rawStatus: u.status_keanggotaan,
          initial
        };
      });
      setUsers(mapped);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const tabs = ['Menunggu Verifikasi', 'Aktif', 'Alumni'];

  const handleVerifikasi = async (member) => {
    const res = await apiFetch(`/auth/users/${member.id}/verify`, { method: 'PATCH' });
    if (res.ok) {
      showToast && showToast(`Akun ${member.nama} berhasil diverifikasi & diaktifkan!`, 'success');
      loadUsers();
    } else {
      showToast && showToast(res.data?.message || 'Gagal memverifikasi akun', 'error');
    }
  };

  const pendingCount = users.filter(m => m.rawStatus === 'Menunggu Verifikasi').length;
  const activeCount = users.filter(m => m.rawStatus === 'Aktif').length;

  const displayed = users
    .filter(m => m.rawStatus === activeTab)
    .filter(m => m.nama.toLowerCase().includes(search.toLowerCase()) || String(m.nim).toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '24px' }}>
        <div>
          <span style={{ fontSize: '12px', fontWeight: 700, color: '#4F46E5', letterSpacing: '0.06em', textTransform: 'uppercase' }}>ADMINISTRASI AKSES</span>
          <h1 className="page-title">Verifikasi &amp; Manajemen RBAC</h1>
          <p className="page-subtitle">Validasi pendaftar dan tetapkan hak akses berbasis peran.</p>
        </div>
        <span style={{ fontSize: '13px', fontWeight: 700, color: '#D97706' }}>{pendingCount} MENUNGGU</span>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', marginBottom: '24px', maxWidth: '500px' }}>
        <div className="portal-stat-card">
          <div style={{ width: '44px', height: '44px', background: '#EEF2FF', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4F46E5', flexShrink: 0 }}>
            👥
          </div>
          <div className="portal-stat-info">
            <span className="portal-stat-label">Total pengguna</span>
            <span className="portal-stat-number">{users.length}</span>
          </div>
        </div>
        <div className="portal-stat-card">
          <div style={{ width: '44px', height: '44px', background: '#ECFDF5', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10B981', fontSize: '20px', flexShrink: 0 }}>
            ✓
          </div>
          <div className="portal-stat-info">
            <span className="portal-stat-label">Akun aktif</span>
            <span className="portal-stat-number">{activeCount}</span>
          </div>
        </div>
      </div>

      {/* Table Card */}
      <div className="portal-card" style={{ padding: 0 }}>
        {/* Search + Tabs */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #F1F5F9', display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: '1', minWidth: '220px' }}>
            <Search size={16} color="#94A3B8" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
            <input className="form-input" style={{ paddingLeft: '40px' }} placeholder="Cari nama atau NIM..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div style={{ display: 'flex', gap: '6px' }}>
            {tabs.map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  background: activeTab === tab ? '#4F46E5' : '#F8FAFC',
                  color: activeTab === tab ? '#fff' : '#64748B',
                  border: activeTab === tab ? 'none' : '1px solid #E2E8F0',
                  borderRadius: '8px', padding: '6px 14px', cursor: 'pointer',
                  fontSize: '13px', fontFamily: 'inherit', fontWeight: 600
                }}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #F1F5F9' }}>
              {['PENGGUNA', 'DIVISI / JABATAN', 'TANGGAL DAFTAR', 'STATUS', 'AKSI'].map(h => (
                <th key={h} style={{ padding: '12px 20px', textAlign: 'left', fontSize: '11px', fontWeight: 700, color: '#94A3B8', letterSpacing: '0.05em' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {displayed.map(member => (
              <tr key={member.id} style={{ borderBottom: '1px solid #F8FAFC' }}>
                <td style={{ padding: '14px 20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '36px', height: '36px', background: '#E2E8F0', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 700, color: '#64748B', flexShrink: 0 }}>
                      {member.initial}
                    </div>
                    <div>
                      <div style={{ fontSize: '13.5px', fontWeight: 600, color: '#0F172A' }}>{member.nama}</div>
                      <div style={{ fontSize: '12px', color: '#94A3B8' }}>{member.nim}</div>
                    </div>
                  </div>
                </td>
                <td style={{ padding: '14px 20px', fontSize: '13.5px', color: '#64748B' }}>{member.divisi}</td>
                <td style={{ padding: '14px 20px', fontSize: '13.5px', color: '#64748B' }}>{member.tanggal}</td>
                <td style={{ padding: '14px 20px' }}>
                  <span style={{
                    fontSize: '12px', fontWeight: 700, padding: '3px 10px', borderRadius: '6px',
                    background: member.status === 'Menunggu' ? '#FEF3C7' : '#ECFDF5',
                    color: member.status === 'Menunggu' ? '#D97706' : '#059669'
                  }}>
                    {member.status}
                  </span>
                </td>
                <td style={{ padding: '14px 20px' }}>
                  {member.status === 'Menunggu' ? (
                    <button className="btn-primary" style={{ width: 'auto', margin: 0, fontSize: '13px', padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '6px' }}
                      onClick={() => handleVerifikasi(member)}>
                      <Shield size={14} /> Verifikasi &amp; Aktifkan Akun
                    </button>
                  ) : (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#10B981', fontWeight: 600 }}>
                      <Check size={14} /> {member.status}
                    </span>
                  )}
                </td>
              </tr>
            ))}
            {displayed.length === 0 && (
              <tr>
                <td colSpan={5} style={{ padding: '32px', textAlign: 'center', color: '#94A3B8', fontSize: '14px' }}>
                  {activeTab === 'Menunggu Verifikasi' ? 'Belum ada pendaftar baru yang menunggu verifikasi.' : 'Tidak ada data ditemukan'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
