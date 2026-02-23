import { getBookingById, deleteBooking } from '@/actions/adminBookingActions';
import { notFound, redirect } from 'next/navigation';
import DeleteButton from './DeleteButton';
import EditBookingForm from './EditBookingForm'; 
import Link from 'next/link';
import styles from './page.module.css';

// To jest Server Component (domyślnie)
export default async function BookingDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const booking = await getBookingById(id);

  if (!booking) {
    notFound();
  }
  const handleDelete = async () => {
    'use server';
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <Link href="/admin/bookings/list" className={styles.backButton}>
          ← Powrót do listy
        </Link>
        <h1>Szczegóły Rezerwacji</h1>
      </header>

      <div className={styles.grid}>
        <div className={styles.mainCard}>
          <h2 className={styles.cardTitle}>Edycja Danych</h2>
          <EditBookingForm initialData={booking} />
        </div>

        <div className={styles.sideCard}>
          <div className={styles.infoBlock}>
            <h3>Podsumowanie</h3>
            <div className={styles.infoRow}>
              <span>ID:</span>
              <code>{booking._id}</code>
            </div>
            <div className={styles.infoRow}>
              <span>Utworzono:</span>
              <span>{new Date(booking.createdAt).toLocaleString('pl-PL')}</span>
            </div>
            {booking.bookingType === 'shadow' && (
              <div className={styles.warningBox}>
                ⚠️ Jest to blokada systemowa (Shadow Booking).
              </div>
            )}
          </div>

          <div className={styles.actionsBlock}>
            <h3>Strefa Niebezpieczna</h3>
            <form action={async () => {
              'use server';
              if (confirm('Czy na pewno chcesz usunąć tę rezerwację?')) {
                await deleteBooking(booking._id);
                redirect('/admin/bookings/list');
              }
            }}>
               <button type="submit" className={styles.deleteBtn} formNoValidate>
                 🗑️ Usuń Rezerwację
               </button>
            </form>
             <DeleteButton bookingId={booking._id} />
            
            <p className={styles.deleteHint}>Usunięcie rezerwacji zwolni termin w kalendarzu.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
