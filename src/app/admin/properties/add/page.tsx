'use client'
import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createProperty } from '@/actions/adminPropertyActions'
import styles from './page.module.css'

export default function AddPropertyPage() {
  const router = useRouter()
  const formRef = useRef<HTMLFormElement>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    setMessage(null)
    
    const formData = new FormData(e.currentTarget)
    const result = await createProperty(formData)
    
    if (result.success) {
      setMessage({ type: 'success', text: result.message })
      formRef.current?.reset()
      setTimeout(() => {
        router.push('/admin/properties')
        router.refresh()
      }, 1500)
    } else {
      setMessage({ type: 'error', text: result.message })
    }
    
    setIsSubmitting(false)
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerTop}>
          <Link href="/admin/properties" className={styles.backButton}>
            ← Powrót do listy
          </Link>
          <h1>Dodaj nowy domek</h1>
        </div>
        <p>Wprowadź dane nowego obiektu w systemie.</p>
      </header>

      {message && (
        <div className={`${styles.alert} ${message.type === 'success' ? styles.alertSuccess : styles.alertError}`}>
          {message.text}
        </div>
      )}

      <form ref={formRef} onSubmit={handleSubmit} className={styles.formCard}>
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Podstawowe informacje</h2>
          <div className={styles.grid}>
            <div className={styles.inputGroup}>
              <label htmlFor="name">Nazwa domku *</label>
              <input
                id="name"
                name="name"
                type="text"
                required
                placeholder="np. Chatka A (Wilcza)"
              />
            </div>
            <div className={styles.inputGroup}>
              <label htmlFor="slug">Slug (URL)</label>
              <input
                id="slug"
                name="slug"
                type="text"
                placeholder="chatka-a"
                pattern="[a-z0-9\-]+"
                title="Tylko małe litery, cyfry i myślniki"
              />
              <small className={styles.hint}>Opcjonalne. Np. chatka-a</small>
            </div>
          </div>
          <div className={styles.inputGroup}>
            <label htmlFor="description">Opis</label>
            <textarea
              id="description"
              name="description"
              rows={4}
              placeholder="Krótki opis domku dla gości..."
            />
          </div>
        </div>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Pojemność</h2>
          <div className={styles.grid}>
            <div className={styles.inputGroup}>
              <label htmlFor="baseCapacity">Bazowa pojemność *</label>
              <input
                id="baseCapacity"
                name="baseCapacity"
                type="number"
                min="1"
                max="20"
                defaultValue={6}
                required
              />
              <small className={styles.hint}>Liczba osób w cenie bazowej</small>
            </div>
            <div className={styles.inputGroup}>
              <label htmlFor="maxCapacityWithExtra">Maks. z dostawkami *</label>
              <input
                id="maxCapacityWithExtra"
                name="maxCapacityWithExtra"
                type="number"
                min="1"
                max="20"
                defaultValue={8}
                required
              />
              <small className={styles.hint}>Maksymalna liczba gości z dostawkami</small>
            </div>
          </div>
        </div>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Zdjęcia</h2>
          <div className={styles.inputGroup}>
            <label htmlFor="images">URL-e zdjęć (oddzielone przecinkiem)</label>
            <textarea
              id="images"
              name="images"
              rows={3}
              placeholder="/images/chatka-1.jpg, /images/chatka-2.jpg"
            />
            <small className={styles.hint}>Wklej ścieżki do zdjęć, oddzielając je przecinkami</small>
          </div>
        </div>

        <div className={styles.actions}>
          <Link href="/admin/properties" className={styles.btnCancel}>
            Anuluj
          </Link>
          <button
            type="submit"
            className={styles.btnSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Zapisywanie...' : '💾 Zapisz domek'}
          </button>
        </div>
      </form>
    </div>
  )
}