import Link from 'next/link';

export default function AdminDashboard() {
  return (
    <div style={{ padding: '20px' }}>
      <header style={{ marginBottom: '30px' }}>
        <h1 style={{ fontSize: '2rem', color: '#1e293b', marginBottom: '10px' }}>
          Panel Administratora
        </h1>
        <p style={{ color: '#64748b' }}>
          Witaj w panelu zarządzania Wilcze Chatki. Wybierz opcję z menu po lewej stronie.
        </p>
      </header>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
        gap: '20px' 
      }}>
        <Link href="/admin/bookings/calendar" style={{ textDecoration: 'none' }}>
          <div style={{
            background: 'white',
            padding: '24px',
            borderRadius: '12px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            border: '1px solid #e2e8f0',
            transition: 'transform 0.2s',
            height: '100%'
          }}>
            <div style={{ fontSize: '2rem', marginBottom: '10px' }}>📅</div>
            <h3 style={{ margin: '0 0 8px 0', color: '#1e293b' }}>Kalendarz Rezerwacji</h3>
            <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem' }}>
              Zobacz occupancy i nadchodzące terminy.
            </p>
          </div>
        </Link>
        <Link href="/admin/bookings/add" style={{ textDecoration: 'none' }}>
          <div style={{
            background: 'white',
            padding: '24px',
            borderRadius: '12px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            border: '1px solid #e2e8f0',
            transition: 'transform 0.2s',
            height: '100%'
          }}>
            <div style={{ fontSize: '2rem', marginBottom: '10px' }}>➕</div>
            <h3 style={{ margin: '0 0 8px 0', color: '#1e293b' }}>Dodaj Rezerwację</h3>
            <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem' }}>
              Ręczne dodawanie rezerwacji telefonicznych.
            </p>
          </div>
        </Link>

        <Link href="/admin/settings" style={{ textDecoration: 'none' }}>
          <div style={{
            background: 'white',
            padding: '24px',
            borderRadius: '12px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            border: '1px solid #e2e8f0',
            transition: 'transform 0.2s',
            height: '100%'
          }}>
            <div style={{ fontSize: '2rem', marginBottom: '10px' }}>⚙️</div>
            <h3 style={{ margin: '0 0 8px 0', color: '#1e293b' }}>Ustawienia</h3>
            <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem' }}>
              Zarządzaj konfiguracją systemu i cenami.
            </p>
          </div>
        </Link>
      </div>
    </div>
  );
}