'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { deleteBooking } from '@/actions/adminBookingActions'
import styles from './page.module.css'

export default function DeleteConfirmButton({ bookingId }: { bookingId: string }) {
  const router = useRouter()
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    if (!confirm('Czy na pewno usunąć tę rezerwację?')) return
    setIsDeleting(true)
    const result = await deleteBooking(bookingId)
    if (result.success) {
      router.push('/admin/bookings/list')
      router.refresh()
    } else {
      alert('Błąd: ' + (result.message || 'Nie udało się usunąć rezerwacji'))
      setIsDeleting(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      className={styles.deleteBtn}
      disabled={isDeleting}
    >
      {isDeleting ? '⏳ Usuwanie...' : '🗑️ Usuń Rezerwację'}
    </button>
  )
}