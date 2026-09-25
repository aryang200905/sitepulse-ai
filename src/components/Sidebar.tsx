'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/components/AuthProvider';
import { useTheme } from '@/components/ThemeProvider';
import Logo from '@/components/Logo';

const COLLAPSE_KEY = 'sitepulse_sidebar_collapsed';

interface SidebarProps {
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

const NAV = [
  { href: '/', label: 'New Analysis', icon: IconPulse },
  { href: '/results', label: 'Last Search', icon: IconChart },
];

export default function Sidebar({ mobileOpen, onCloseMobile }: SidebarProps) {
  const { user, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    try {
      setCollapsed(localStorage.getItem(COLLAPSE_KEY) === '1');
    } catch {
      /* ignore */
    }
  }, []);

  const toggleCollapsed = () => {
    setCollapsed((c) => {
      const next = !c;
      try {
        localStorage.setItem(COLLAPSE_KEY, next ? '1' : '0');
      } catch {
        /* ignore */
      }
      return next;
    });
  };

  const handleSignOut = async () => {
    await signOut();
    router.push('/signin');
  };

  const initial =
    user?.displayName?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || '?';

  return (
    <>
      {mobileOpen && <div className="sidebar-scrim" onClick={onCloseMobile} />}
      <aside
        className={`sidebar${collapsed ? ' collapsed' : ''}${mobileOpen ? ' mobile-open' : ''}`}
        id="app-sidebar"
      >
        {/* Brand */}
        <div className="sidebar-brand">
          <Link href="/" className="sidebar-brand-link" onClick={onCloseMobile}>
            <Logo size={34} wordmark={!collapsed} />
          </Link>
          <button
            className="sidebar-collapse-btn"
            onClick={toggleCollapsed}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            title={collapsed ? 'Expand' : 'Collapse'}
          >
            <IconChevron dir={collapsed ? 'right' : 'left'} />
          </button>
        </div>

        {/* Nav */}
        <nav className="sidebar-nav">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`sidebar-link${active ? ' active' : ''}`}
                title={collapsed ? label : undefined}
                onClick={onCloseMobile}
              >
                <span className="sidebar-link-icon">
                  <Icon />
                </span>
                <span className="sidebar-link-label">{label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="sidebar-spacer" />

        {/* Theme toggle */}
        <button
          className="sidebar-link sidebar-theme-toggle"
          onClick={toggleTheme}
          title={collapsed ? (theme === 'dark' ? 'Light mode' : 'Dark mode') : undefined}
        >
          <span className="sidebar-link-icon">{theme === 'dark' ? <IconSun /> : <IconMoon />}</span>
          <span className="sidebar-link-label">{theme === 'dark' ? 'Light mode' : 'Dark mode'}</span>
        </button>

        <div className="sidebar-divider" />

        {/* User */}
        {user && (
          <div className="sidebar-user">
            <div className="sidebar-user-info">
              <span className="sidebar-avatar">
                {user.photoURL ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={user.photoURL} alt="" />
                ) : (
                  initial
                )}
              </span>
              <span className="sidebar-user-text">
                <span className="sidebar-user-name">{user.displayName || 'User'}</span>
                <span className="sidebar-user-email">{user.email}</span>
              </span>
            </div>
            <button className="sidebar-link sidebar-signout" onClick={handleSignOut} title={collapsed ? 'Sign out' : undefined}>
              <span className="sidebar-link-icon">
                <IconSignOut />
              </span>
              <span className="sidebar-link-label">Sign Out</span>
            </button>
          </div>
        )}
      </aside>
    </>
  );
}

/* ── Inline icons (currentColor) ── */
function IconPulse() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12h4l3-8 4 16 3-8h4" />
    </svg>
  );
}
function IconChart() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 3v18h18" />
      <rect x="7" y="10" width="3" height="7" rx="1" />
      <rect x="13" y="6" width="3" height="11" rx="1" />
      <rect x="18" y="13" width="2.5" height="4" rx="1" />
    </svg>
  );
}
function IconSun() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </svg>
  );
}
function IconMoon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
    </svg>
  );
}
function IconSignOut() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="M16 17l5-5-5-5M21 12H9" />
    </svg>
  );
}
function IconChevron({ dir }: { dir: 'left' | 'right' }) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: dir === 'right' ? 'rotate(180deg)' : undefined }}>
      <path d="M15 18l-6-6 6-6" />
    </svg>
  );
}
