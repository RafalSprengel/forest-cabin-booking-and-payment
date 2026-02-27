import Link from 'next/link';
import styles from './page.module.css';
import { getAdminBookingsList } from '@/actions/adminBookingActions';

export default async function AdminDashboard() {
  const allBookings = await getAdminBookingsList();
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const upcomingBookings = allBookings
    .filter((b: any) => new Date(b.endDate) >= today && b.status !== 'cancelled' && b.bookingType !== 'shadow')
    .sort((a: any, b: any) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
    .slice(0, 5);

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>Panel Administratora</h1>
        <p>Witaj w panelu zarządzania Wilcze Chatki.</p>
      </header>

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2>Nadchodzące rezerwacje</h2>
          <Link href="/admin/bookings/list" className={styles.viewAll}>
            Zobacz wszystkie →
          </Link>
        </div>

        {upcomingBookings.length === 0 ? (
          <div className={styles.emptyState}>
            <p>Brak nadchodzących rezerwacji.</p>
          </div>
        ) : (
          <div className={styles.upcomingList}>
            {upcomingBookings.map((booking: any) => {
              const start = new Date(booking.startDate);
              const end = new Date(booking.endDate);
              const nights = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
              const dateRange = `${start.toLocaleDateString('pl-PL', { day: '2-digit', month: '2-digit', year: 'numeric' })} – ${end.toLocaleDateString('pl-PL', { day: '2-digit', month: '2-digit', year: 'numeric' })}`;
              
              return (
                <Link
                  key={booking._id}
                  href={`/admin/bookings/list/${booking._id}`}
                  className={styles.upcomingItem}
                >
                  <span className={styles.dateBadge}>{dateRange}</span>
                  <span className={styles.guestInfo}>
                    <strong className={styles.guestName}>{booking.guestName}</strong>
                    <span className={styles.detailSep}>•</span>
                    <span className={styles.cabinName}>{booking.propertyName}</span>
                  </span>
                  <span className={styles.nightsBadge}>{nights} nocy</span>
                  <span className={styles.statusBadge}>
                    {booking.status === 'confirmed' ? '✓' : booking.status === 'pending' ? '⏳' : '•'}
                  </span>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      <section className={styles.section}>
        <h2>Szybki dostęp</h2>
        <div className={styles.quickActions}>
          <Link href="/admin/bookings/add" className={styles.actionCard}>
            <span className={styles.actionIcon}>➕</span>
            <span>Dodaj rezerwację</span>
          </Link>
          <Link href="/admin/bookings/calendar" className={styles.actionCard}>
            <span className={styles.actionIcon}>📅</span>
            <span>Kalendarz</span>
          </Link>
          <Link href="/admin/properties" className={styles.actionCard}>
            <span className={styles.actionIcon}>🏠</span>
            <span>Zarządzaj domkami</span>
          </Link>
          <Link href="/admin/settings" className={styles.actionCard}>
            <span className={styles.actionIcon}>⚙️</span>
            <span>Ustawienia</span>
          </Link>
        </div>
      </section>
    </div>
  );
}