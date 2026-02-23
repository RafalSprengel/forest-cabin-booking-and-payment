'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import './admin.css';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [isBookingsOpen, setIsBookingsOpen] = useState(false); 

  const isBookingsActive = pathname?.startsWith('/admin/bookings');
  const isSettingsActive = pathname === '/admin/settings';
  const isDevActive = pathname === '/admin/dev';

  const toggleBookings = () => setIsBookingsOpen(!isBookingsOpen);

  return (
    <div className="admin-layout">
      <button 
        className="mobile-toggle" 
        onClick={() => document.querySelector('.admin-sidebar')?.classList.toggle('mobile-open')}
      >
        ☰ Menu
      </button>

      <aside className="admin-sidebar">
        <div className="sidebar-header">
          <h2>Panel Administratora</h2>
        </div>
        
        <nav className="sidebar-nav">
          <div>
            <div className="nav-group-title">Rezerwacje</div>
            
            <div 
              className={`nav-link ${isBookingsActive ? 'active' : ''}`} 
              onClick={toggleBookings}
              style={{ cursor: 'pointer', justifyContent: 'space-between' }}
            >
              <div style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
                <span className="nav-icon">📅</span>
                <span>Obsługa Rezerwacji</span>
              </div>
              <span>{isBookingsOpen ? '▲' : '▼'}</span>
            </div>

            <div className={`submenu ${isBookingsOpen ? 'open' : ''}`}>
              <Link 
                href="/admin/bookings/add" 
                className={`nav-link sub-link ${pathname === '/admin/bookings/add' ? 'active' : ''}`}
              >
                ➕ Dodaj Nową
              </Link>
              <Link 
                href="/admin/bookings/calendar" 
                className={`nav-link sub-link ${pathname === '/admin/bookings/calendar' ? 'active' : ''}`}
              >
                🗓️ Kalendarz
              </Link>
              <Link 
                href="/admin/bookings/list" 
                className={`nav-link sub-link ${pathname === '/admin/bookings/list' ? 'active' : ''}`}
              >
                📋 Lista Rezerwacji
              </Link>
            </div>
          </div>

          <div>
            <div className="nav-group-title">Konfiguracja</div>
            <Link 
              href="/admin/settings" 
              className={`nav-link ${isSettingsActive ? 'active' : ''}`}
            >
              <span className="nav-icon">⚙️</span>
              Ustawienia Systemu
            </Link>
          </div>

          <div>
            <div className="nav-group-title">Narzędzia</div>
            <Link 
              href="/admin/dev" 
              className={`nav-link ${isDevActive ? 'active' : ''}`}
            >
              <span className="nav-icon">💻</span>
              Dev / Debug
            </Link>
          </div>
        </nav>

        <div className="sidebar-footer">
          <Link href="/" className="nav-link" style={{marginBottom: '10px'}}>
            <span className="nav-icon">🏠</span>
            Wróć na stronę
          </Link>
          <button className="btn-logout" onClick={() => alert('Wylogowanie (do implementacji)')}>
            Wyloguj się
          </button>
        </div>
      </aside>

      <main className="admin-content">
        {children}
      </main>
    </div>
  );
}