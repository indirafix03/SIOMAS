import React, { useState, useEffect } from 'react';
import {
  LayoutGrid,
  BarChart2,
  Calendar,
  FolderArchive,
  Upload,
  Users,
  CheckSquare,
  LifeBuoy,
  LogOut,
  Bell,
  ChevronRight,
  Menu,
  X
} from 'lucide-react';
import { lpjApi } from '../../services/api.js';

export default function PDLayout({
  activeView,
  onNavigate,
  currentUser,
  onLogout,
  children,
  unreadCount = 0
}) {
  const [revisiCount, setRevisiCount] = useState(0);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    const loadRevisiCount = async () => {
      const res = await lpjApi.getMySubmissions();
      if (res.ok && res.data?.data) {
        const rev = res.data.data.filter((d) => d.status === 'Revisi').length;
        setRevisiCount(rev);
      }
    };
    loadRevisiCount();
  }, [activeView]);

  const breadcrumbMap = {
    'pd-dashboard': 'Beranda',
    'pd-dasbor': 'Dasbor Koordinator',
    'pd-agenda': 'Kalender Agenda',
    'pd-vault': 'Vault LPJ & Dokumen',
    'pd-unggah-lpj': 'Unggah LPJ',
    'pd-hub-inter': 'Hub Inter-UKM',
    'pd-delegasi': 'Delegasi & Presensi',
    'pd-detail-kolaborasi': 'Detail Kolaborasi',
    'pd-form-publikasi': 'Form Publikasi Hub',
    'pd-profile': 'Profil Saya',
    'pd-detail-pengumuman': 'Detail Pengumuman'
  };

  const currentLabel = breadcrumbMap[activeView] || 'Beranda';

  const getInitials = (name) => {
    if (!name) return 'AP';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  const navItems = [
    { key: 'pd-dashboard', label: 'Beranda', icon: LayoutGrid },
    { key: 'pd-dasbor', label: 'Dasbor Koordinator', icon: BarChart2 },
    { key: 'pd-agenda', label: 'Kalender Agenda', icon: Calendar },
    { key: 'pd-vault', label: 'Vault LPJ & Dokumen', icon: FolderArchive },
    { key: 'pd-unggah-lpj', label: 'Unggah LPJ', icon: Upload, badge: revisiCount },
    { key: 'pd-hub-inter', label: 'Hub Inter-UKM', icon: Users },
    { key: 'pd-delegasi', label: 'Delegasi & Presensi', icon: CheckSquare }
  ];

  const isHubActive = ['pd-hub-inter', 'pd-detail-kolaborasi', 'pd-form-publikasi'].includes(activeView);
  const isDashboardActive = ['pd-dashboard', 'pd-detail-pengumuman'].includes(activeView);

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
              href="#/pd-dashboard"
              className="portal-sidebar-brand"
              style={{ marginBottom: 0 }}
              onClick={(e) => { e.preventDefault(); handleNavClick('pd-dashboard'); }}
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
                (item.key === 'pd-hub-inter' && isHubActive) ||
                (item.key === 'pd-dashboard' && isDashboardActive);

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

        {/* Sidebar Footer */}
        <div className="portal-sidebar-footer">
          <div className="portal-help-card">
            <div className="portal-help-icon">
              <LifeBuoy size={18} />
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
        {/* Top Navbar */}
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
              <span className="label">Status</span>
              <span className="value">Pengurus Divisi</span>
            </div>

            <button
              type="button"
              className="portal-notif-btn"
              title="Notifikasi"
              onClick={() => onNavigate('pd-dashboard')}
            >
              <Bell size={18} />
              {unreadCount > 0 && <span className="portal-notif-dot" />}
            </button>

            <div
              className="portal-user-chip"
              onClick={() => onNavigate('pd-profile')}
              title="Klik untuk membuka Profil"
            >
              <div className="portal-avatar-init">
                {getInitials(currentUser?.nama)}
              </div>
              <div className="portal-user-info">
                <span className="portal-user-name">{currentUser?.nama || 'Ardi Pratama'}</span>
                <span className="portal-user-role">Pengurus Divisi</span>
              </div>
              <ChevronRight size={14} color="#94A3B8" />
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="portal-page-content">
          {children}
        </main>
      </div>
    </div>
  );
}
