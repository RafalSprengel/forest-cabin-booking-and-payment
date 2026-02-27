'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import styles from './page.module.css'

export default function BookingDetailsContent({ booking, onDelete }: { booking: any; onDelete: () => Promise<void> }) {
  const router = useRouter()
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const handleDelete = async () => {
    if (!confirm('Czy na pewno usunąć tę rezerwację?')) return
    setIsDeleting(true)
    try {
      await onDelete()
      router.push('/admin/bookings/list')
      router.refresh()
    } catch {
      setDeleteError('Wystąpił błąd podczas usuwania.')
      setIsDeleting(false)
    }
  }

  return (
    <>
      {deleteError && (
        <div className={`${styles.alert} ${styles.alertError}`}>
          {deleteError}
        </div>
      )}

      <div className={styles.infoBlock}>
        <h3 className={styles.cardTitle}>Podsumowanie</h3>
        <div className={styles.infoRow}>
          <span className={styles.label}>ID:</span>
          <code className={styles.code}>{booking._id}</code>
        </div>
        <div className={styles.infoRow}>
          <span className={styles.label}>Utworzono:</span>
          <span>{new Date(booking.createdAt).toLocaleString('pl-PL')}</span>
        </div>
        <div className={styles.infoRow}>
          <span className={styles.label}>Typ:</span>
          <span className={styles.value}>
            {booking.bookingType === 'shadow' ? 'Blokada systemowa' : 'Rezerwacja gościa'}
          </span>
        </div>
      </div>

      {booking.bookingType === 'real' && (
        <div className={styles.actionsBlock}>
          <h3 className={styles.cardTitle}>Strefa niebezpieczna</h3>
          <button
            type="button"
            onClick={handleDelete}
            className={styles.deleteBtn}
            disabled={isDeleting}
          >
            {isDeleting ? '⏳ Usuwanie...' : '🗑️ Usuń Rezerwację'}
          </button>
          <p className={styles.deleteHint}>
            Usunięcie rezerwacji zwolni termin w kalendarzu.
          </p>
        </div>
      )}

      {booking.bookingType === 'shadow' && (
        <div className={styles.warningBox}>
          ⚠️ Jest to blokada systemowa (Shadow Booking).
          <br />
          Aby zwolnić ten termin, usuń powiązaną rezerwację główną.
        </div>
      )}
    </>
  )
}