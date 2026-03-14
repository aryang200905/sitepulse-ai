'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';

export default function UserMenu() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  if (!user) return null;

  const initial = user.displayName?.charAt(0)?.toUpperCase()
    || user.email?.charAt(0)?.toUpperCase()
    || '?';

  const handleSignOut = async () => {
    await signOut();
    router.push('/signin');
  };

  return (
    <div className="user-menu-container" ref={menuRef}>
      <button
        className="user-avatar-btn"
        onClick={() => setOpen(!open)}
        id="user-menu-btn"
        aria-label="User menu"
      >
        {user.photoURL ? (
          <img src={user.photoURL} alt="" className="user-avatar-img" />
        ) : (
          <span className="user-avatar-initial">{initial}</span>
        )}
      </button>

      {open && (
        <div className="user-dropdown" id="user-dropdown">
          {/* User info section */}
          <div className="user-dropdown-info">
            <div className="user-dropdown-avatar">
              {user.photoURL ? (
                <img src={user.photoURL} alt="" className="user-avatar-img-lg" />
              ) : (
                <span className="user-avatar-initial-lg">{initial}</span>
              )}
            </div>
            <div className="user-dropdown-details">
              <span className="user-dropdown-name">
                {user.displayName || 'User'}
              </span>
              <span className="user-dropdown-email">
                {user.email}
              </span>
            </div>
          </div>

          <div className="user-dropdown-divider" />

          {/* Menu items */}
          <button className="user-dropdown-item" id="menu-profile">
            <span className="dropdown-icon">👤</span>
            Profile
          </button>

          <div className="user-dropdown-divider" />

          <button
            className="user-dropdown-item user-dropdown-item--danger"
            onClick={handleSignOut}
            id="menu-signout"
          >
            <span className="dropdown-icon">🚪</span>
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
}
