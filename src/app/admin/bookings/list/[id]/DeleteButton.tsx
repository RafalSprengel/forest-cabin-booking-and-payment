'use client';
import { deleteBooking } from '@/actions/adminBookingActions';
import { useRouter } from 'next/navigation';

function DeleteButton({ bookingId }: { bookingId: string }) {
  const router = useRouter();
  return (
    <button 
      className={styles.deleteBtn} 
      onClick={async () => {
        if (confirm('Czy na pewno chcesz usunąć tę rezerwację? Ta operacja jest nieodwracalna.')) {
          await deleteBooking(bookingId);
          router.push('/admin/bookings/list');
          router.refresh();
        }
      }}
    >
      🗑️ Usuń Rezerwację
    </button>
  );
}