'use client';

import { useState, type ReactNode } from 'react';
import Sidebar from '@/components/Sidebar';
import Logo from '@/components/Logo';

/**
 * Authenticated app frame: collapsible sidebar + main content area, with a
 * mobile top bar that opens the sidebar as a slide-over.
 */
export default function AppShell({ children }: { children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="app-shell">
      <Sidebar mobileOpen={mobileOpen} onCloseMobile={() => setMobileOpen(false)} />

      <div className="app-main">
        <div className="app-topbar">
          <button className="app-menu-btn" onClick={() => setMobileOpen(true)} aria-label="Open menu">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M3 6h18M3 12h18M3 18h18" />
            </svg>
          </button>
          <Logo size={28} />
        </div>

        <div className="app-content">{children}</div>
      </div>
    </div>
  );
}
