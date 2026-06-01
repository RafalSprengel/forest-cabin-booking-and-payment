'use client';
import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createProperty } from '@/actions/adminPropertyActions';
import Button from '@/app/_components/UI/Button/Button';
import FormField from '@/app/admin/_components/FormField/FormField';
import styles from './page.module.css';
// FloatingBackButton provided by admin layout

export default function AddPropertyForm() {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage(null);
    const formData = new FormData(e.currentTarget);
    const result = await createProperty(formData);
    if (result.success) {
      setMessage({ type: 'success', text: result.message });
      formRef.current?.reset();
      setTimeout(() => { router.push('/admin/properties'); router.refresh(); }, 1500);
    } else {
      setMessage({ type: 'error', text: result.message });
    }
    setIsSubmitting(false);
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>Dodaj nowy obiekt</h1>
        <p>Wprowadź dane nowego obiektu w systemie.</p>
      </header>
      {message && (<div className={`${styles.alert} ${message.type === 'success' ? styles.alertSuccess : styles.alertError}`}>{message.text}</div>)}
      <form ref={formRef} onSubmit={handleSubmit} className={styles.formCard}>
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Podstawowe informacje</h2>
          <div className={styles.grid}>
            <FormField id="name" label="Nazwa domku *">
              <input id="name" name="name" type="text" required placeholder="np. Chatka A (Wilcza)" />
            </FormField>
            {/* <div className={styles.inputGroup}> DO NOT REMOVE, IT"S GOING TO BE USE LATER
              <label htmlFor="slug">Slug (URL)</label>
              <input id="slug" name="slug" type="text" placeholder="chatka-a" pattern="[a-z0-9\-]+" title="Tylko małe litery, cyfry i myślniki" />
              <small className={styles.hint}>Opcjonalne, np. chatka-a.</small>
            </div> */}
          </div>
          <FormField id="description" label="Opis">
            <textarea id="description" name="description" rows={4} placeholder="Krótki opis domku dla gości..." />
          </FormField>
        </div>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Pojemność</h2>
          <div className={styles.grid}>
            <FormField id="maxAdults" label="Max. dorosłych *" hint="Maksymalna liczba dorosłych gości.">
              <input
                id="maxAdults"
                name="maxAdults"
                type="number"
                min="1"
                max="20"
                defaultValue={4}
                required
              />
            </FormField>
            <FormField id="maxChildren" label="Max. dzieci (bezpłatnych) *" hint="Maksymalna liczba dzieci.">
              <input
                id="maxChildren"
                name="maxChildren"
                type="number"
                min="0"
                max="30"
                defaultValue={6}
                required
              />
            </FormField>
            <FormField id="maxExtraBeds" label="Maksymalna liczba dostawek *" hint="Liczba dodatkowych łóżek, które można dostawić.">
              <input
                id="maxExtraBeds"
                name="maxExtraBeds"
                type="number"
                min="0"
                max="10"
                defaultValue={2}
                required
              />
            </FormField>
          </div>
        </div>

        {/* <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Zdjęcia</h2>
          <div className={styles.inputGroup}>
            <label htmlFor="images">URL-e zdjęć (oddzielone przecinkiem)</label>
            <textarea id="images" name="images" rows={3} placeholder="/images/chatka-1.jpg, /images/chatka-2.jpg" />
            <small className={styles.hint}>Wklej ścieżki do zdjęć, oddzielając je przecinkami.</small>
          </div>
        </div> */}

        <div className={styles.actions}>
          <Button type="button" variant="secondary" onClick={() => router.back()}>Anuluj</Button>
          <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Zapisuję...' : '💾 Zapisz obiekt'}</Button>
        </div>
      </form>
    </div>
  );
}
