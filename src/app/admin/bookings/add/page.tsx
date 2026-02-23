'use client';

import { useState } from 'react';
import styles from './page.module.css';

export default function AddBookingPage() {
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Tu wywoać akcję serwera np. createManualBooking(formData)
    setTimeout(() => {
      alert('Rezerwacja dodana! (Symulacja)');
      setLoading(false);
    }, 1000);
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>Dodaj Nową Rezerwację</h1>
        <p>Ręczne wprowadzenie rezerwacji (np. telefonicznej)</p>
      </header>

      <form onSubmit={handleSubmit} className={styles.formCard}>
        <div className={styles.sectionTitle}>Termin i Obiekt</div>
        
        <div className={styles.grid}>
          <div className={styles.inputGroup}>
            <label>Data przyjazdu</label>
            <input type="date" required name="startDate" />
          </div>
          <div className={styles.inputGroup}>
            <label>Data wyjazdu</label>
            <input type="date" required name="endDate" />
          </div>
          <div className={styles.inputGroup}>
            <label>Obiekt</label>
            <select name="propertyId">
              <option value="cabin1">Domek 1 (Sosnowy)</option>
              <option value="cabin2">Domek 2 (Brzozowy)</option>
              <option value="both">Cała posesja</option>
            </select>
          </div>
          <div className={styles.inputGroup}>
            <label>Liczba gości</label>
            <input type="number" min="1" max="12" defaultValue="2" />
          </div>
        </div>

        <div className={styles.sectionTitle}>Dane Gościa</div>
        
        <div className={styles.grid}>
          <div className={styles.inputGroup}>
            <label>Imię i Nazwisko</label>
            <input type="text" required placeholder="np. Jan Kowalski" />
          </div>
          <div className={styles.inputGroup}>
            <label>Email</label>
            <input type="email" required placeholder="jan@example.com" />
          </div>
          <div className={styles.inputGroup}>
            <label>Telefon</label>
            <input type="tel" required placeholder="+48 123 456 789" />
          </div>
          <div className={styles.inputGroup}>
            <label>Cena całkowita (PLN)</label>
            <input type="number" required placeholder="0.00" step="0.01" />
          </div>
        </div>

        <div className={styles.inputGroup}>
          <label>Uwagi wewnętrzne</label>
          <textarea rows={3} placeholder="Np. Gość prosi o łóżeczko dla dziecka"></textarea>
        </div>

        <div className={styles.actions}>
          <button type="button" className={styles.btnCancel}>Anuluj</button>
          <button type="submit" className={styles.btnSubmit} disabled={loading}>
            {loading ? 'Zapisywanie...' : 'Zapisz Rezerwację'}
          </button>
        </div>
      </form>
    </div>
  );
}