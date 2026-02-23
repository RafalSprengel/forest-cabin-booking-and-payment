'use client';

import { useState } from 'react';
import { updateBooking } from '@/actions/adminBookingActions';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';
import { IBooking } from '@/db/models/Booking';

interface FormData {
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  numberOfGuests: number;
  totalPrice: number;
  status: string;
  startDate: string;
  endDate: string;
}

export default function EditBookingForm({ initialData }: { initialData: any }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{type: 'success'|'error', text: string} | null>(null);

  // Formatowanie dat do input type="date" (YYYY-MM-DD)
  const formatDate = (date: Date) => new Date(date).toISOString().split('T')[0];

  const [form, setForm] = useState<FormData>({
    guestName: initialData.guestName || '',
    guestEmail: initialData.guestEmail || '',
    guestPhone: initialData.guestPhone || '',
    numberOfGuests: initialData.numberOfGuests || 0,
    totalPrice: initialData.totalPrice || 0,
    status: initialData.status,
    startDate: formatDate(initialData.startDate),
    endDate: formatDate(initialData.endDate),
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: name === 'numberOfGuests' || name === 'totalPrice' ? Number(value) : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const result = await updateBooking(initialData._id, form);

    if (result.success) {
      setMessage({ type: 'success', text: 'Zapisano zmiany pomyślnie!' });
      router.refresh();
    } else {
      setMessage({ type: 'error', text: result.message || 'Wystąpił błąd.' });
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      {message && (
        <div className={`${styles.alert} ${message.type === 'success' ? styles.alertSuccess : styles.alertError}`}>
          {message.text}
        </div>
      )}

      <div className={styles.formGrid}>
        <div className={styles.inputGroup}>
          <label>Imię i Nazwisko</label>
          <input name="guestName" value={form.guestName} onChange={handleChange} required />
        </div>
        <div className={styles.inputGroup}>
          <label>Email</label>
          <input name="guestEmail" type="email" value={form.guestEmail} onChange={handleChange} required />
        </div>
        <div className={styles.inputGroup}>
          <label>Telefon</label>
          <input name="guestPhone" type="tel" value={form.guestPhone} onChange={handleChange} required />
        </div>
        <div className={styles.inputGroup}>
          <label>Liczba Gości</label>
          <input name="numberOfGuests" type="number" min="1" value={form.numberOfGuests} onChange={handleChange} />
        </div>
        <div className={styles.inputGroup}>
          <label>Data Przyjazdu</label>
          <input name="startDate" type="date" value={form.startDate} onChange={handleChange} required />
        </div>
        <div className={styles.inputGroup}>
          <label>Data Wyjazdu</label>
          <input name="endDate" type="date" value={form.endDate} onChange={handleChange} required />
        </div>
        <div className={styles.inputGroup}>
          <label>Cena Całkowita (PLN)</label>
          <input name="totalPrice" type="number" step="0.01" value={form.totalPrice} onChange={handleChange} required />
        </div>
        <div className={styles.inputGroup}>
          <label>Status</label>
          <select name="status" value={form.status} onChange={handleChange}>
            <option value="pending">Oczekująca</option>
            <option value="confirmed">Potwierdzona</option>
            <option value="blocked">Zablokowana</option>
            <option value="cancelled">Anulowana</option>
          </select>
        </div>
      </div>

      <div className={styles.formActions}>
        <button type="submit" className={styles.saveBtn} disabled={loading}>
          {loading ? 'Zapisywanie...' : '💾 Zapisz Zmiany'}
        </button>
      </div>
    </form>
  );
}