import React, { useState, useEffect } from 'react';
import { Shield, Search, Check, Trash2 } from 'lucide-react';
import { apiFetch, authApi } from '../../services/api.js';

const UKM_OPTIONS = [
  'UKM Seni & Budaya',
  'UKM Olahraga',
  'UKM Penalaran & Penelitian',
  'UKM KSR - PMI',
  'UKM Pers Mahasiswa',
  'UKM Mapala',
  'UKM Robotika & Teknologi'
];

export default function KetuaManajemenAkses({ showToast }) {
  const [activeTab, setActiveTab] = useState('Semua');
  const [search, setSearch] = useState('');
  const [users, setUsers] = useState([]);
  const [managedUkm, setManagedUkm] = useState('');
  const [switchingUkm, setSwitchingUkm] = useState(false);

  const loadUsers = async () => {
    const res = await apiFetch('/auth/users');
    if (res.ok && res.data?.data) {
      setManagedUkm(res.data.managed_ukm || '');
      const mapped = res.data.data.map((u) => {
        const parts = (u.nama || 'U').trim().split(' ');
        const initial = parts.length >= 2 ? (parts[0][0] + parts[1][0]).toUpperCase() : (u.nama || 'U').slice(0, 2).toUpperCase();
        return {
          id: u.id,
          nama: u.nama,
          email: u.email,
          nim: u.nim || u.email,
          ukm: u.ukm || 'Belum Ditentukan',
          divisi: u.divisi || u.job_desc || u.role,
          role: u.role,
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

  const tabs = ['Semua', 'Menunggu Verifikasi', 'Aktif', 'Alumni'];

  const handleSwitchKetuaUkm = async (newUkm) => {
    setSwitchingUkm(true);
    const res = await authApi.updateProfile({
      ukm: newUkm,
      divisi: 'Ketua Umum'
    });
    setSwitchingUkm(false);
    if (res.ok && res.data?.data) {
      const updatedUser = res.data.data;
      try {
        if (localStorage.getItem('siomas_user')) {
          localStorage.setItem('siomas_user', JSON.stringify(updatedUser));
        }
        if (sessionStorage.getItem('siomas_user')) {
          sessionStorage.setItem('siomas_user', JSON.stringify(updatedUser));
        }
      } catch (_) { }
      showToast && showToast(
        newUkm
          ? `Wewenang Ketua kini dikunci pada ${newUkm} (hanya menampilkan anggota ${newUkm}).`
          : 'Mode Super-Admin aktif (menampilkan seluruh UKM).',
        'success'
      );
      loadUsers();
    } else {
      showToast && showToast('Gagal mengubah cakupan UKM Ketua.', 'error');
    }
  };

  const handleVerifikasi = async (member) => {
    const res = await apiFetch(`/auth/users/${member.id}/verify`, { method: 'PATCH' });
    if (res.ok) {
      showToast && showToast(`Akun ${member.nama} (${member.ukm}) berhasil diverifikasi & diaktifkan!`, 'success');
      loadUsers();
    } else {
      showToast && showToast(res.data?.message || 'Gagal memverifikasi akun', 'error');
    }
  };

  const handleChangeRole = async (member, newRole) => {
    const res = await apiFetch(`/auth/users/${member.id}`, {
      method: 'PUT',
      body: JSON.stringify({ role: newRole })
    });
    if (res.ok) {
      showToast && showToast(`Role ${member.nama} diperbarui menjadi ${newRole}`, 'success');
      loadUsers();
    } else {
      showToast && showToast(res.data?.message || 'Gagal mengubah role anggota', 'error');
    }
  };

  const handleDeleteUser = async (member) => {
    if (!window.confirm(`Hapus akun ${member.nama} (${member.ukm})?`)) return;
    const res = await apiFetch(`/auth/users/${member.id}`, { method: 'DELETE' });
    if (res.ok) {
      showToast && showToast(`Anggota ${member.nama} berhasil dihapus.`, 'success');
      loadUsers();
    } else {
      showToast && showToast(res.data?.message || 'Gagal menghapus anggota', 'error');
    }
  };

  const pendingCount = users.filter(m => m.rawStatus === 'Menunggu Verifikasi').length;
  const activeCount = users.filter(m => m.rawStatus === 'Aktif').length;

  const displayed = users
    .filter(m => activeTab === 'Semua' || m.rawStatus === activeTab)
    .filter(m =>
      m.nama.toLowerCase().includes(search.toLowerCase()) ||
      String(m.nim).toLowerCase().includes(search.toLowerCase()) ||
      String(m.ukm).toLowerCase().includes(search.toLowerCase())
    );

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '20px', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <span style={{ fontSize: '12px', fontWeight: 700, color: '#4F46E5', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            ADMINISTRASI AKSES • {managedUkm || 'SELURUH UKM'}
          </span>
          <h1 className="page-title">Verifikasi &amp; Manajemen RBAC</h1>
          <p className="page-subtitle">
            {managedUkm
              ? `Anda login sebagai Ketua ${managedUkm}. Hanya anggota dari ${managedUkm} yang dapat Anda lihat dan kontrol.`
              : 'Validasi pendaftar dan tetapkan hak akses berbasis peran serta UKM.'}
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#EEF2FF', padding: '8px 14px', borderRadius: '10px', border: '1px solid #C7D2FE' }}>
            <span style={{ fontSize: '12.5px', fontWeight: 700, color: '#4F46E5' }}>
              Wewenang Organisasi: {managedUkm || 'Super-Admin (Semua UKM)'}
            </span>
          </div>
          <span style={{ fontSize: '13px', fontWeight: 700, color: '#D97706' }}>{pendingCount} MENUNGGU</span>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px', maxWidth: '760px' }}>
        <div className="portal-stat-card">
          <div style={{ width: '44px', height: '44px', background: '#EEF2FF', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4F46E5', flexShrink: 0 }}>
            🏛️
          </div>
          <div className="portal-stat-info">
            <span className="portal-stat-label">Wewenang UKM</span>
            <span className="portal-stat-number" style={{ fontSize: '15px' }}>{managedUkm || 'Semua UKM'}</span>
          </div>
        </div>
        <div className="portal-stat-card">
          <div style={{ width: '44px', height: '44px', background: '#EEF2FF', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4F46E5', flexShrink: 0 }}>
            👥
          </div>
          <div className="portal-stat-info">
            <span className="portal-stat-label">Total anggota UKM ini</span>
            <span className="portal-stat-number">{users.length}</span>
          </div>
        </div>
        <div className="portal-stat-card">
          <div style={{ width: '44px', height: '44px', background: '#ECFDF5', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10B981', fontSize: '20px', flexShrink: 0 }}>
            ✓
          </div>
          <div className="portal-stat-info">
            <span className="portal-stat-label">Anggota aktif</span>
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
            <input className="form-input" style={{ paddingLeft: '40px' }} placeholder="Cari nama atau NIM anggota..." value={search} onChange={e => setSearch(e.target.value)} />
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
        <div className="table-scroll-wrap">
        <table style={{ width: '100%', minWidth: '640px', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #F1F5F9' }}>
              {['PENGGUNA', 'UKM', 'DIVISI / JABATAN', 'ROLE', 'STATUS', 'AKSI'].map(h => (
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
                <td style={{ padding: '14px 20px' }}>
                  <span style={{ background: '#EEF2FF', color: '#4F46E5', fontSize: '12px', fontWeight: 700, padding: '4px 10px', borderRadius: '999px' }}>
                    {member.ukm}
                  </span>
                </td>
                <td style={{ padding: '14px 20px', fontSize: '13px', color: '#64748B' }}>{member.divisi}</td>
                <td style={{ padding: '14px 20px' }}>
                  <select
                    value={member.role}
                    onChange={(e) => handleChangeRole(member, e.target.value)}
                    style={{
                      border: '1px solid #E2E8F0',
                      borderRadius: '6px',
                      padding: '4px 8px',
                      fontSize: '12.5px',
                      fontWeight: 600,
                      color: '#0F172A',
                      background: '#F8FAFC',
                      cursor: 'pointer'
                    }}
                  >
                    <option value="Anggota">Anggota</option>
                    <option value="Pengurus">Pengurus</option>
                  </select>
                </td>
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
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {member.status === 'Menunggu' ? (
                      <button className="btn-primary" style={{ width: 'auto', margin: 0, fontSize: '12.5px', padding: '7px 14px', display: 'flex', alignItems: 'center', gap: '6px' }}
                        onClick={() => handleVerifikasi(member)}>
                        <Shield size={14} /> Verifikasi &amp; Aktifkan
                      </button>
                    ) : (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#10B981', fontWeight: 600 }}>
                        <Check size={14} /> {member.status}
                      </span>
                    )}
                    <button
                      type="button"
                      title="Hapus Anggota"
                      onClick={() => handleDeleteUser(member)}
                      style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', padding: '4px' }}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {displayed.length === 0 && (
              <tr>
                <td colSpan={6} style={{ padding: '32px', textAlign: 'center', color: '#94A3B8', fontSize: '14px' }}>
                  {activeTab === 'Menunggu Verifikasi'
                    ? `Belum ada pendaftar baru di ${managedUkm || 'UKM ini'} yang menunggu verifikasi.`
                    : `Tidak ada anggota berstatus '${activeTab}' di ${managedUkm || 'UKM ini'}.`}
                </td>
              </tr>
            )}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  );
}
