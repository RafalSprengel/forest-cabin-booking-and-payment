'use client'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { updateProperty, deleteProperty } from '@/actions/adminPropertyActions'
import styles from './page.module.css'

export default function EditPropertyForm({ property, propertyId }: { property: any; propertyId: string }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [isDeleting, setIsDeleting] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const handleUpdate = async (formData: FormData) => {
    startTransition(async () => {
      const result = await updateProperty(propertyId, formData)
      if (result.success) {
        setMessage({ type: 'success', text: 'Zapisano zmiany!' })
        router.refresh()
      } else {
        setMessage({ type: 'error', text: result.message })
      }
    })
  }

  const handleDelete = async () => {
    if (!confirm('Czy na pewno usunąć ten domek? Ta operacja jest nieodwracalna.')) return
    setIsDeleting(true)
    const result = await deleteProperty(propertyId)
    if (result.success) {
      router.push('/admin/properties')
      router.refresh()
    } else {
      setMessage({ type: 'error', text: result.message })
      setIsDeleting(false)
    }
  }

  return (
    <>
      {message && (
        <div className={`${styles.alert} ${message.type === 'success' ? styles.alertSuccess : styles.alertError}`}>
          {message.text}
        </div>
      )}

      <form action={handleUpdate} className={styles.formCard}>
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
                defaultValue={property.name}
                placeholder="np. Chatka A (Wilcza)"
              />
            </div>
            <div className={styles.inputGroup}>
              <label htmlFor="slug">Slug (URL)</label>
              <input
                id="slug"
                name="slug"
                type="text"
                defaultValue={property.slug || ''}
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
              defaultValue={property.description || ''}
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
                required
                defaultValue={property.baseCapacity}
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
                required
                defaultValue={property.maxCapacityWithExtra}
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
              defaultValue={property.images?.join(', ') || ''}
              placeholder="/images/chatka-1.jpg, /images/chatka-2.jpg"
            />
            <small className={styles.hint}>Wklej ścieżki do zdjęć, oddzielając je przecinkami</small>
          </div>
        </div>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Status</h2>
          <div className={styles.toggleGroup}>
            <label className={styles.toggleLabel}>
              <input
                type="checkbox"
                name="isActive"
                value="true"
                defaultChecked={property.isActive}
              />
              <span className={styles.toggleText}>
                {property.isActive ? '✅ Aktywny – widoczny w wyszukiwarce' : '⏸️ Nieaktywny – ukryty przed gośćmi'}
              </span>
            </label>
          </div>
        </div>

        <div className={styles.actions}>
          <Link href="/admin/properties" className={styles.btnCancel}>
            Anuluj
          </Link>
          <button type="submit" className={styles.btnSubmit} disabled={isPending}>
            {isPending ? '⏳ Zapisywanie...' : '💾 Zapisz zmiany'}
          </button>
        </div>
      </form>

      <div className={styles.dangerZone}>
        <h3 className={styles.dangerTitle}>Strefa niebezpieczna</h3>
        <p className={styles.dangerDesc}>
          Usunięcie domku jest nieodwracalne. Można usunąć tylko obiekty bez rezerwacji.
        </p>
        <button
          type="button"
          onClick={handleDelete}
          className={styles.btnDelete}
          disabled={isDeleting}
        >
          {isDeleting ? '⏳ Usuwanie...' : '🗑️ Usuń domek'}
        </button>
      </div>
    </>
  )
}