import React from 'react';
import { 
  LayoutGrid, 
  Calendar, 
  FolderArchive, 
  Users, 
  LifeBuoy, 
  LogOut, 
  Bell, 
  ChevronRight 
} from 'lucide-react';

export default function AnggotaLayout({
  activeView,
  onNavigate,
  currentUser,
  onLogout,
  children,
  unreadCount = 0
}) {
  // Breadcrumb label mapping
  const breadcrumbMap = {
    dashboard: 'Beranda',
    agenda: 'Kalender Agenda',
    vault: 'Repository Vault',
    'hub-inter': 'Hub Inter-UKM',
    'detail-pengumuman': 'Detail Pengumuman',
    'detail-kolaborasi': 'Detail Kolaborasi',
    'form-publikasi': 'Form Publikasi Hub',
    profile: 'Profil Saya'
  };

  const currentLabel = breadcrumbMap[activeView] || 'Beranda';

  // Extract initials
  const getInitials = (name) => {
    if (!name) return 'AP';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const navItems = [
    { key: 'dashboard', label: 'Beranda', icon: LayoutGrid },
    { key: 'agenda', label: 'Kalender Agenda', icon: Calendar },
    { key: 'vault', label: 'Vault LPJ & Dokumen', icon: FolderArchive },
    { key: 'hub-inter', label: 'Hub Inter-UKM', icon: Users }
  ];

  return (
    <div className="portal-container">
      {/* Sidebar Navigation */}
      <aside className="portal-sidebar">
        <div>
          <a 
            href="#/dashboard" 
            className="portal-sidebar-brand"
            onClick={(e) => { e.preventDefault(); onNavigate('dashboard'); }}
          >
            <div className="portal-brand-logo">S</div>
            <div className="portal-brand-text">
              <h2>SIOMAS</h2>
              <p>Sistem Organisasi Mahasiswa</p>
            </div>
          </a>

          <div className="portal-sidebar-section-title">Menu Utama</div>
          <ul className="portal-nav-list">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeView === item.key || 
                (item.key === 'hub-inter' && ['detail-kolaborasi', 'form-publikasi'].includes(activeView)) ||
                (item.key === 'dashboard' && activeView === 'detail-pengumuman');

              return (
                <li key={item.key}>
                  <button
                    type="button"
                    className={`portal-nav-item ${isActive ? 'active' : ''}`}
                    onClick={() => onNavigate(item.key)}
                  >
                    <Icon size={18} />
                    <span>{item.label}</span>
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
        {/* Top Navbar */}
        <header className="portal-topbar">
          <div className="portal-breadcrumb">
            <span className="root">SIOMAS</span>
            <span className="divider">/</span>
            <span className="current">{currentLabel}</span>
          </div>

          <div className="portal-topbar-actions">
            <div className="portal-status-badge">
              <span className="label">Status</span>
              <span className="value">{currentUser?.role || 'Anggota'}</span>
            </div>

            <button 
              type="button" 
              className="portal-notif-btn" 
              title="Notifikasi Pengumuman"
              onClick={() => onNavigate('dashboard')}
            >
              <Bell size={18} />
              {unreadCount > 0 && <span className="portal-notif-dot" />}
            </button>

            <div
              className="portal-user-chip"
              onClick={() => onNavigate('profile')}
              title="Klik untuk membuka Profil & Jobdesk"
            >
              <div className="portal-avatar-init">
                {getInitials(currentUser?.nama)}
              </div>
              <div className="portal-user-info">
                <span className="portal-user-name">{currentUser?.nama || 'Ardi Pratama'}</span>
                <span className="portal-user-role">{currentUser?.role || 'Anggota'}</span>
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
