'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import './Sidebar.css';

const navItems = [
  { href: '/', icon: '📊', label: 'Dashboard' },
  { href: '/conversations', icon: '💬', label: 'Mesajlar', badge: true },
  { href: '/orders', icon: '📦', label: 'Siparişler' },
  { href: '/products', icon: '🏷️', label: 'Ürünler' },
  { href: '/customers', icon: '👥', label: 'Müşteriler' },
];

const secondaryItems = [
  { href: '/campaigns', icon: '📢', label: 'Kampanyalar' },
  { href: '/templates', icon: '📝', label: 'Şablonlar' },
  { href: '/analytics', icon: '📈', label: 'Analitik' },
];

const settingsItems = [
  { href: '/settings', icon: '⚙️', label: 'Ayarlar' },
];

export default function Sidebar({ user }) {
  const pathname = usePathname();
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    const fetchUnread = () => {
      fetch('/api/conversations/unread')
        .then(r => r.json())
        .then(d => { if (d.success) setUnread(d.count || 0); })
        .catch(() => {});
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">⚡</div>
          <span className="sidebar-logo-text">MYBHEG</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        <div className="sidebar-section-label">Ana Menü</div>
        {navItems.map(item => (
          <Link
            key={item.href}
            href={item.href}
            className={`nav-item ${pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href)) ? 'active' : ''}`}
          >
            <span className="nav-item-icon">{item.icon}</span>
            <span>{item.label}</span>
            {item.badge && unread > 0 && <span className="nav-item-badge">{unread > 99 ? '99+' : unread}</span>}
          </Link>
        ))}

        <div className="sidebar-section-label">Pazarlama</div>
        {secondaryItems.map(item => (
          <Link
            key={item.href}
            href={item.href}
            className={`nav-item ${pathname.startsWith(item.href) ? 'active' : ''}`}
          >
            <span className="nav-item-icon">{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        ))}

        <div className="sidebar-section-label">Sistem</div>
        {settingsItems.map(item => (
          <Link
            key={item.href}
            href={item.href}
            className={`nav-item ${pathname.startsWith(item.href) ? 'active' : ''}`}
          >
            <span className="nav-item-icon">{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="avatar avatar-sm">{(user?.display_name || 'A')[0].toUpperCase()}</div>
          <div className="sidebar-user-info">
            <div className="sidebar-user-name truncate">{user?.display_name || 'Admin'}</div>
            <div className="sidebar-user-role">{user?.role || 'admin'}</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
