import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Bell, CheckCheck, ChevronRight, X } from 'lucide-react';
import { notificationsApi } from '../services/api.js';

export default function NotificationBellPopup({ currentUser, activeView, onNavigate }) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [readIds, setReadIds] = useState(() => {
    try {
      const key = `siomas_notif_read_${currentUser?.id || currentUser?.email || 'user'}`;
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : [];
    } catch (_) {
      return [];
    }
  });
  const containerRef = useRef(null);

  const storageKey = `siomas_notif_read_${currentUser?.id || currentUser?.email || 'user'}`;

  const saveReadIds = (nextIds) => {
    setReadIds(nextIds);
    try {
      localStorage.setItem(storageKey, JSON.stringify(nextIds));
    } catch (_) {}
  };

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    const res = await notificationsApi.getInApp();
    setLoading(false);
    if (res.ok && Array.isArray(res.data?.data)) {
      setItems(res.data.data);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications, activeView]);

  useEffect(() => {
    if (open) {
      fetchNotifications();
    }
  }, [open, fetchNotifications]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadItems = items.filter((item) => !readIds.includes(item.id));
  const unreadTotal = unreadItems.length;

  const handleMarkAllRead = () => {
    const allIds = Array.from(new Set([...readIds, ...items.map((i) => i.id)]));
    saveReadIds(allIds);
  };

  const handleItemClick = (item) => {
    if (!readIds.includes(item.id)) {
      saveReadIds([...readIds, item.id]);
    }
    setOpen(false);
    if (item.targetView && onNavigate) {
      onNavigate(item.targetView);
    }
  };

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      <button
        type="button"
        className="portal-notif-btn"
        title="Pusat Notifikasi"
        onClick={() => setOpen((prev) => !prev)}
        style={{ position: 'relative' }}
      >
        <Bell size={18} />
        {unreadTotal > 0 && (
          <span
            style={{
              position: 'absolute',
              top: '-4px',
              right: '-4px',
              background: '#EF4444',
              color: '#FFFFFF',
              fontSize: '10px',
              fontWeight: 800,
              minWidth: '18px',
              height: '18px',
              borderRadius: '999px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0 4px',
              border: '2px solid #FFFFFF'
            }}
          >
            {unreadTotal > 9 ? '9+' : unreadTotal}
          </span>
        )}
      </button>

      {open && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 10px)',
            right: 0,
            width: '380px',
            maxWidth: 'calc(100vw - 24px)',
            background: '#FFFFFF',
            borderRadius: '16px',
            boxShadow: '0 20px 45px -10px rgba(15, 23, 42, 0.22)',
            border: '1px solid #E2E8F0',
            zIndex: 1200,
            overflow: 'hidden'
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '14px 16px',
              borderBottom: '1px solid #F1F5F9',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: '#F8FAFC'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '14px', fontWeight: 800, color: '#0F172A' }}>Notifikasi Sistem</span>
              {unreadTotal > 0 && (
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    background: '#EEF2FF',
                    color: '#4F46E5',
                    padding: '2px 8px',
                    borderRadius: '999px'
                  }}
                >
                  {unreadTotal} baru
                </span>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {unreadTotal > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllRead}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontSize: '11.5px',
                    fontWeight: 700,
                    color: '#4F46E5',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontFamily: 'inherit'
                  }}
                >
                  <CheckCheck size={13} /> Tandai dibaca
                </button>
              )}
              <button
                type="button"
                onClick={() => setOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8', display: 'flex' }}
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Body */}
          <div style={{ maxHeight: '390px', overflowY: 'auto' }}>
            {loading && items.length === 0 ? (
              <div style={{ padding: '28px 16px', textAlign: 'center', fontSize: '13px', color: '#94A3B8' }}>
                Memuat notifikasi...
              </div>
            ) : items.length === 0 ? (
              <div style={{ padding: '32px 16px', textAlign: 'center', fontSize: '13px', color: '#94A3B8' }}>
                Belum ada notifikasi terbaru untuk peran Anda.
              </div>
            ) : (
              items.map((item) => {
                const isUnread = !readIds.includes(item.id);
                return (
                  <div
                    key={item.id}
                    onClick={() => handleItemClick(item)}
                    style={{
                      padding: '12px 16px',
                      borderBottom: '1px solid #F1F5F9',
                      background: isUnread ? '#F8FAFF' : '#FFFFFF',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'flex-start',
                      justifyContent: 'space-between',
                      gap: '10px',
                      transition: 'background 0.15s'
                    }}
                  >
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px', flexWrap: 'wrap' }}>
                        <span
                          style={{
                            fontSize: '10.5px',
                            fontWeight: 700,
                            padding: '2px 8px',
                            borderRadius: '999px',
                            background: item.badgeBg || '#EEF2FF',
                            color: item.badgeColor || '#4F46E5'
                          }}
                        >
                          {item.badge}
                        </span>
                        <span style={{ fontSize: '11px', color: '#94A3B8' }}>• {item.time}</span>
                        {isUnread && (
                          <span
                            style={{
                              width: '7px',
                              height: '7px',
                              borderRadius: '50%',
                              background: '#4F46E5',
                              display: 'inline-block'
                            }}
                          />
                        )}
                      </div>
                      <div style={{ fontSize: '13px', fontWeight: isUnread ? 700 : 600, color: '#0F172A', marginBottom: '2px' }}>
                        {item.title}
                      </div>
                      <div style={{ fontSize: '12px', color: '#64748B', lineHeight: 1.45 }}>
                        {item.message}
                      </div>
                    </div>
                    <ChevronRight size={15} color="#94A3B8" style={{ marginTop: '8px', flexShrink: 0 }} />
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
