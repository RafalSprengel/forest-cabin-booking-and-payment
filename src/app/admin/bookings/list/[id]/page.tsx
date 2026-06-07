import { getBookingById } from '@/actions/adminBookingActions';
import { notFound } from 'next/navigation';
import EditBookingForm from './EditBookingForm';
import styles from './page.module.css';
import AdminShell from '../../../_components/AdminShell/AdminShell';
import DeleteConfirmButton from './DeleteConfirmButton';

export default async function BookingDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const booking = await getBookingById(id);
  if (!booking) { notFound(); }

  const bookingTypeLabel = booking.source === 'online'
    ? 'Klient (online)'
    : booking.source === 'admin'
      ? 'Admin (ręcznie)'
      : '-';

  const propertyName = booking.propertyName || '-';
  return (
    <AdminShell title="Szczegóły rezerwacji">
      <div className={styles.grid}>
        <div className={styles.mainCard}>
          <EditBookingForm initialData={booking} />
        </div>

        <div className={styles.sideCard}>
          <h3 className={styles.cardTitle}>Faktura VAT</h3>
          {booking.invoice ? (
            <div className={styles.invoiceData}>
              <div className={styles.infoRow}><span className={styles.label}>Nazwa firmy:</span><span>{booking.invoiceData?.companyName || '-'}</span></div>
              <div className={styles.infoRow}><span className={styles.label}>NIP:</span><span>{booking.invoiceData?.nip || '-'}</span></div>
              <div className={styles.infoRow}><span className={styles.label}>Ulica:</span><span>{booking.invoiceData?.street || '-'}</span></div>
              <div className={styles.infoRow}><span className={styles.label}>Miasto:</span><span>{booking.invoiceData?.city || '-'}</span></div>
              <div className={styles.infoRow}><span className={styles.label}>Kod pocztowy:</span><span>{booking.invoiceData?.postalCode || '-'}</span></div>
            </div>
          ) : (
            <div className={styles.invoiceData}>
              <div className={styles.infoRow}><span className={styles.label}>Brak danych faktury</span></div>
            </div>
          )}
        </div>
        <div className={styles.sideCard}>
          <div className={styles.infoBlock}>
            <h3 className={styles.cardTitle}>Podsumowanie</h3>
            <div className={styles.infoRow}><span className={styles.label}>ID:</span><code className={styles.code}>{booking._id}</code></div>
            <div className={styles.infoRow}><span className={styles.label}>Utworzono:</span><span>{new Date(booking.createdAt).toLocaleString('pl-PL')}</span></div>
            <div className={styles.infoRow}><span className={styles.label}>Domek:</span><span className={styles.value}>{propertyName}</span></div>
            <div className={styles.infoRow}><span className={styles.label}>Typ:</span><span className={styles.value}>{bookingTypeLabel}</span></div>
            <div className={styles.infoRow}><span className={styles.label}>Rodzaj płatności:</span><span className={styles.value}>{booking.paymentMethod === 'online' ? 'Online' : booking.paymentMethod === 'cash' ? 'Gotówka' : booking.paymentMethod === 'transfer' ? 'Przelew' : booking.paymentMethod}</span></div>
            {booking.source === 'admin' && (
              <div className={styles.adminBubble} style={{ marginTop: 12, fontSize: '0.92em', background: '#f1f5f9', color: '#334155', borderRadius: 8, padding: '6px 12px', display: 'inline-block' }}>
                Rezerwacja dokonana przez panel admina
              </div>
            )}
          </div>
          <div className={styles.actionsBlock}>
            <h3 className={styles.cardTitle}>Strefa niebezpieczna</h3>
            <div className={styles.deleteConfirmButtonWrap}>
              <DeleteConfirmButton bookingId={booking._id} />
            </div>
            <p className={styles.deleteHint}>Usunięcie rezerwacji zwolni termin w kalendarzu.</p>
          </div>
        </div>
      </div>
    </AdminShell>
  );
}