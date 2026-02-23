import { getAdminBookingsList } from '@/actions/adminBookingActions';
import Link from 'next/link';
import styles from './page.module.css';

export default async function BookingsListPage() {
  const bookings = await getAdminBookingsList();

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerTop}>
          <Link href="/admin" className={styles.backButton}>
            ← Powrót do Dashboardu
          </Link>
          <h1>Lista Rezerwacji</h1>
        </div>
        <p>Przeglądaj, edytuj lub usuwaj istniejące rezerwacje.</p>
      </header>

      {bookings.length === 0 ? (
        <div className={styles.emptyState}>
          <p>Brak rezerwacji w systemie.</p>
        </div>
      ) : (
        <div className={styles.tableWrapper}>
          <table className={styles.bookingsTable}>
            <thead>
              <tr>
                <th>Data dodania</th>
                <th>Gość</th>
                <th>Obiekt</th>
                <th>Termin</th>
                <th>Nocy</th>
                <th>Cena</th>
                <th>Status</th>
                <th>Akcje</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((booking) => {
                const start = new Date(booking.startDate);
                const end = new Date(booking.endDate);
                const nights = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
                
              
                const statusKey = booking.status.charAt(0).toUpperCase() + booking.status.slice(1);
                const statusLabel = 
                  booking.status === 'confirmed' ? 'Potwierdzona' : 
                  booking.status === 'blocked' ? 'Zablokowana' : 
                  booking.status === 'cancelled' ? 'Anulowana' : 'Oczekująca';

                return (
                  <tr key={booking._id} className={styles.rowLink}>
                    <td>{new Date(booking.createdAt).toLocaleDateString('pl-PL')}</td>
                    
                    <td className={styles.guestCell}>
                      <div className={styles.guestName}>{booking.guestName || 'Gość'}</div>
                      <div className={styles.guestContact}>{booking.guestEmail || '-'}</div>
                    </td>
                    
                    <td>{booking.propertyName || 'Domek'}</td>
                    
                    <td>
                      {start.toLocaleDateString('pl-PL')} - {end.toLocaleDateString('pl-PL')}
                    </td>
                    
                    <td className={styles.centerCell}>{nights}</td>
                    
                    <td className={styles.priceCell}>{booking.totalPrice.toFixed(2)} zł</td>
                    
                    <td>
                      <span className={`${styles.badge} ${styles[`badge${statusKey}`]}`}>
                        {statusLabel}
                      </span>
                    </td>
                    
                    <td>
                      <Link 
                        href={`/admin/bookings/list/${booking._id}`} 
                        className={styles.editBtn}
                      >
                        Edytuj
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}