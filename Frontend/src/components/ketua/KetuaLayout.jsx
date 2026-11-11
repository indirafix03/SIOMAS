import React, { useState, useEffect } from 'react';
import {
  LayoutGrid,
  BarChart2,
  Calendar,
  FolderArchive,
  ShieldCheck,
  CheckSquare,
  Users,
  Shield,
  Bell,
  Eye,
  LogOut,
  ChevronRight,
  Menu,
  X
} from 'lucide-react';
import { lpjApi, sipakamaseApi, interUkmApi, apiFetch } from '../../services/api.js';

export default function KetuaLayout({
  activeView,
  onNavigate,
  currentUser,
  onLogout,
  children,
  unreadCount = 0
}) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [badges, setBadges] = useState({
    lpj: 0,
    sipakamase: 0,
    interukm: 0,
    akses: 0
  });

  useEffect(() => {
    const fetchCounts = async () => {
      const [lpjRes, sipaRes, interRes, usersRes] = await Promise.all([
        lpjApi.getPendingValidation(),
        sipakamaseApi.getAll({ status: 'Draft' }),
        interUkmApi.getPending(),
        apiFetch('/auth/users?status=Menunggu%20Verifikasi')
      ]);

      setBadges({
        lpj: lpjRes.ok ? (lpjRes.data?.data?.length || 0) : 0,
        sipakamase: sipaRes.ok ? (sipaRes.data?.data?.length || 0) : 0,
        interukm: interRes.ok ? (interRes.data?.data?.length || 0) : 0,
        akses: usersRes.ok ? (usersRes.data?.data?.length || 0) : 0
      });
    };

    fetchCounts();
  }, [activeView]);

  const breadcrumbMap = {
    'k-beranda': 'Beranda',
    'k-dashboard-eksekutif': 'Dashboard Eksekutif',
    'k-kalender-agenda': 'Kalender Agenda',
    'k-vault-lpj': 'Repository Vault',
    'k-validasi-lpj': 'Validasi LPJ',
    'k-verifikasi-sipakamase': 'Verifikasi Sipakamase',
    'k-hub-inter-ukm': 'Hub Inter-UKM',
    'k-detail-kolaborasi': 'Detail Kolaborasi',
    'k-form-publikasi': 'Form Publikasi Hub',
    'k-manajemen-akses': 'Manajemen Akses',
    'k-log-notifikasi': 'Log Notifikasi',
    'k-audit-log': 'Audit Log',
    'k-profil': 'Profil Saya',
    'k-detail-pengumuman': 'Detail Pengumuman',
    'k-unggah-lpj': 'Unggah LPJ'
  };

  const currentLabel = breadcrumbMap[activeView] || 'Beranda';

  const getInitials = (name) => {
    if (!name) return 'AP';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  const navItems = [
    { key: 'k-beranda', label: 'Beranda', icon: LayoutGrid },
    { key: 'k-dashboard-eksekutif', label: 'Dashboard Eksekutif', icon: BarChart2 },
    { key: 'k-kalender-agenda', label: 'Kalender Agenda', icon: Calendar },
    { key: 'k-vault-lpj', label: 'Vault LPJ & Dokumen', icon: FolderArchive },
    { key: 'k-validasi-lpj', label: 'Validasi LPJ', icon: ShieldCheck, badge: badges.lpj },
    { key: 'k-verifikasi-sipakamase', label: 'Verifikasi Sipakamase', icon: CheckSquare, badge: badges.sipakamase },
    { key: 'k-hub-inter-ukm', label: 'Hub Inter-UKM', icon: Users, badge: badges.interukm },
    { key: 'k-manajemen-akses', label: 'Manajemen Akses', icon: Shield, badge: badges.akses },
    { key: 'k-log-notifikasi', label: 'Log Notifikasi', icon: Bell },
    { key: 'k-audit-log', label: 'Audit Log', icon: Eye }
  ];

  const isHubRelated = ['k-detail-kolaborasi', 'k-form-publikasi'].includes(activeView);
  const isBerandaRelated = ['k-detail-pengumuman'].includes(activeView);

  const handleNavClick = (viewKey) => {
    setMobileNavOpen(false);
    onNavigate(viewKey);
  };

  return (
    <div className="portal-container">
      {mobileNavOpen && (
        <div
          className="portal-sidebar-backdrop"
          onClick={() => setMobileNavOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`portal-sidebar ${mobileNavOpen ? 'open' : ''}`}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '36px' }}>
            <a
              href="#/k-beranda"
              className="portal-sidebar-brand"
              style={{ marginBottom: 0 }}
              onClick={(e) => { e.preventDefault(); handleNavClick('k-beranda'); }}
            >
              <div className="portal-brand-logo">S</div>
              <div className="portal-brand-text">
                <h2>SIOMAS</h2>
                <p>Sistem Organisasi Mahasiswa</p>
              </div>
            </a>
            <button
              type="button"
              className="portal-mobile-close-btn"
              onClick={() => setMobileNavOpen(false)}
              aria-label="Tutup Menu"
            >
              <X size={20} />
            </button>
          </div>

          <div className="portal-sidebar-section-title">Menu Utama</div>
          <ul className="portal-nav-list">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                activeView === item.key ||
                (item.key === 'k-hub-inter-ukm' && isHubRelated) ||
                (item.key === 'k-beranda' && isBerandaRelated);

              return (
                <li key={item.key}>
                  <button
                    type="button"
                    className={`portal-nav-item ${isActive ? 'active' : ''}`}
                    onClick={() => handleNavClick(item.key)}
                  >
                    <Icon size={18} />
                    <span>{item.label}</span>
                    {item.badge > 0 && (
                      <span style={{
                        marginLeft: 'auto',
                        background: '#EF4444',
                        color: '#fff',
                        fontSize: '11px',
                        fontWeight: 700,
                        borderRadius: '999px',
                        minWidth: '20px',
                        height: '20px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '0 5px'
                      }}>
                        {item.badge}
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="portal-sidebar-footer">
          <div className="portal-help-card">
            <div className="portal-help-icon">
              <Users size={18} />
            </div>
            <h4>Butuh bantuan?</h4>
            <p>Hubungi pusat dukungan SIOMAS.</p>
            <button
              type="button"
              className="portal-help-btn"
              onClick={() => alert('Pusat Bantuan SIOMAS:\nEmail: support@siomas.ac.id\nWhatsApp: +62 812 3456 7890')}
            >
              Pusat Bantuan
            </button>
          </div>

          <button
            type="button"
            className="portal-logout-btn"
            onClick={onLogout}
          >
            <LogOut size={18} />
            <span>Keluar dari SIOMAS</span>
          </button>
        </div>
      </aside>

      {/* Main Area */}
      <div className="portal-main-area">
        <header className="portal-topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              type="button"
              className="portal-mobile-menu-btn"
              onClick={() => setMobileNavOpen(true)}
              aria-label="Buka Menu Navigasi"
            >
              <Menu size={20} />
            </button>
            <div className="portal-breadcrumb">
              <span className="root">SIOMAS</span>
              <span className="divider">/</span>
              <span className="current">{currentLabel}</span>
            </div>
          </div>

          <div className="portal-topbar-actions">
            <div className="portal-status-badge">
              <span className="label">Wewenang</span>
              <span className="value">{currentUser?.ukm ? `Ketua • ${currentUser.ukm}` : 'Ketua UKM'}</span>
            </div>

            <button
              type="button"
              className="portal-notif-btn"
              title="Notifikasi"
              onClick={() => onNavigate('k-log-notifikasi')}
            >
              <Bell size={18} />
              {unreadCount > 0 && <span className="portal-notif-dot" />}
            </button>

            <div
              className="portal-user-chip"
              onClick={() => onNavigate('k-profil')}
              title="Profil Saya"
            >
              <div className="portal-avatar-init">
                {getInitials(currentUser?.nama)}
              </div>
              <div className="portal-user-info">
                <span className="portal-user-name">{currentUser?.nama || 'Ketua UKM'}</span>
                <span className="portal-user-role">Ketua UKM</span>
              </div>
              <ChevronRight size={14} color="#94A3B8" />
            </div>
          </div>
        </header>

        <main className="portal-page-content">
          {children}
        </main>
      </div>
    </div>
  );
}
