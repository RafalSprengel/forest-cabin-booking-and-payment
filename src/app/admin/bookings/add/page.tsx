'use client';
import { useState, useRef, useActionState } from 'react';
import styles from './page.module.css';
import { createManualBooking } from '@/actions/adminBookingActions';
import Link from 'next/link';

const initialState = {
  message: '',
  success: false,
};

export default function AddBookingPage() {
  const [state, formAction, isPending] = useActionState(createManualBooking, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  if (state?.success) {
    return (
      <div className={styles.container}>
        <header className={styles.header}>
          <Link href="/admin/bookings/list" className={styles.backButton}>
            ← Powrót do listy
          </Link>
          <h1>Sukces</h1>
        </header>
        <div className={styles.successBox}>
          <p className={styles.successMessage}>{state.message}</p>
          <Link href="/admin/bookings/list" className={styles.btnSubmit}>
            Wróć do listy
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <Link href="/admin/bookings/list" className={styles.floatingBack}>
        ←
      </Link>
      <header className={styles.header}>
        <h1>Dodaj Nową Rezerwację</h1>
        <p>Ręczne wprowadzenie rezerwacji (np. telefonicznej)</p>
      </header>

      {state?.message && !state.success && (
        <div className={styles.errorBox}>{state.message}</div>
      )}

      <form ref={formRef} action={formAction} className={styles.formCard}>
        <div className={styles.sectionTitle}>Termin i Obiekt</div>
        <div className={styles.grid}>
          <div className={styles.inputGroup}>
            <label htmlFor="startDate">Data przyjazdu</label>
            <input id="startDate" type="date" required name="startDate" />
          </div>
          <div className={styles.inputGroup}>
            <label htmlFor="endDate">Data wyjazdu</label>
            <input id="endDate" type="date" required name="endDate" />
          </div>
          <div className={styles.inputGroup}>
            <label htmlFor="propertyId">Obiekt</label>
            <select id="propertyId" name="propertyId" required>
              <option value="">Wybierz domek</option>
              <option value="cabin1">Chatka A (Wilcza)</option>
              <option value="cabin2">Chatka B (Leśna)</option>
              <option value="both">Cała posesja</option>
            </select>
          </div>
          <div className={styles.inputGroup}>
            <label htmlFor="numGuests">Liczba gości</label>
            <input id="numGuests" name="numGuests" type="number" min="1" max="12" defaultValue="2" />
          </div>
        </div>

        <div className={styles.sectionTitle}>Dane Gościa</div>
        <div className={styles.grid}>
          <div className={styles.inputGroup}>
            <label htmlFor="guestName">Imię i Nazwisko</label>
            <input id="guestName" name="guestName" type="text" required placeholder="np. Jan Kowalski" />
          </div>
          <div className={styles.inputGroup}>
            <label htmlFor="guestEmail">Email</label>
            <input id="guestEmail" name="guestEmail" type="email" required placeholder="jan@example.com" />
          </div>
          <div className={styles.inputGroup}>
            <label htmlFor="guestPhone">Telefon</label>
            <input id="guestPhone" name="guestPhone" type="tel" required placeholder="+48 123 456 789" />
          </div>
          <div className={styles.inputGroup}>
            <label htmlFor="totalPrice">Cena całkowita (PLN)</label>
            <input id="totalPrice" name="totalPrice" type="number" required placeholder="0.00" step="0.01" />
          </div>
        </div>

        <div className={styles.inputGroup}>
          <label htmlFor="internalNotes">Uwagi wewnętrzne</label>
          <textarea id="internalNotes" name="internalNotes" rows={3} placeholder="Np. Gość prosi o łóżeczko dla dziecka"></textarea>
        </div>

        <div className={styles.actions}>
          <button type="button" className={styles.btnCancel} onClick={() => formRef.current?.reset()}>Anuluj</button>
          <button type="submit" className={styles.btnSubmit} disabled={isPending}>
            {isPending ? 'Zapisuję...' : 'Zapisz Rezerwację'}
          </button>
        </div>
      </form>
    </div>
  );
}