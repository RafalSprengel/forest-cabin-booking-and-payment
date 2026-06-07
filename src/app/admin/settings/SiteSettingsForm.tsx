'use client'

import { useState, useEffect } from 'react'
import { getSiteSettings, updateSiteSettings } from '@/actions/siteSettingsActions'
import { toast } from 'react-hot-toast'
import styles from './SiteSettingsForm.module.css'
import AdminSection from '@/app/_components/UI/AdminSection/AdminSection'

export default function SiteSettingsForm() {
  const [isEditing, setIsEditing] = useState(false)
  const [settings, setSettings] = useState({
    phone: '',
    email: '',
    facebookUrl: '',
    bankAccountNumber: ''
  })
  const [initialSettings, setInitialSettings] = useState({
    phone: '',
    email: '',
    facebookUrl: '',
    bankAccountNumber: ''
  })
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    async function loadSettings() {
      const data = await getSiteSettings()
      const formattedData = {
        phone: data?.phone ?? '',
        email: data?.email ?? '',
        facebookUrl: data?.facebookUrl ?? '',
        bankAccountNumber: data?.bankAccountNumber ?? ''
      }
      setSettings(formattedData)
      setInitialSettings(formattedData)
      setIsLoading(false)
    }
    loadSettings()
  }, [])

  const hasChanges = JSON.stringify(settings) !== JSON.stringify(initialSettings)

  const validate = () => {
    const newErrors: Record<string, string> = {}

    if (settings.phone.trim() && !/^\+\d{7,15}$/.test(settings.phone.trim())) {
      newErrors.phone = 'Numer w formacie +48512345678 (bez spacji).'
    }

    if (settings.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(settings.email.trim())) {
      newErrors.email = 'Podaj prawidłowy adres e-mail.'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSave = async () => {
    if (!hasChanges) return
    if (!validate()) return
    setIsSaving(true)

    try {
      const payload = { ...settings }
      const result = await updateSiteSettings(payload)
      if (result.success) {
        toast.success(result.message)
        // keep state shape (settings uses `phone`)
        setInitialSettings(settings)
        setIsEditing(false)
      } else {
        toast.error(result.message)
      }
    } catch (error) {
      toast.error('Wystąpił nieoczekiwany błąd.')
      console.error(error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleToggleEdit = () => {
    if (isEditing) {
      setSettings(initialSettings)
      setErrors({})
    }
    setIsEditing(!isEditing)
  }



  return (
    <AdminSection
      title="Dane firmy / obiektu"
      badge="Globalne"
      description="Dane te są wyświetlane na stronie jako informacja dla odwiedzających."
    >
      <div className={styles.siteSettings__editHeader}>
        <button
          type="button"
          className={styles.siteSettings__toggleEdit}
          onClick={handleToggleEdit}
        >
          {isEditing ? 'Anuluj' : 'Edytuj'}
        </button>
      </div>

      <div className={styles.siteSettings__form}>
        {isLoading ? (
          <div className={styles.loadingContainer}>
            <div className={styles.spinner}></div>
            <p className={styles.loadingText}>Loading...</p>
          </div>
        ) : (
          <>
            {/* phoneDisplay removed from form - only phone is editable */}

            <div className={styles.siteSettings__inputGroup}>
              <label htmlFor="site-phone-href">Numer telefonu:</label>
              <input
                id="site-phone"
                type="text"
                className={`${styles.siteSettings__input}${errors.phone ? ` ${styles['siteSettings__input--error']}` : ''}`}
                value={settings.phone}
                onChange={(e) => {
                  const v = e.target.value.replace(/\s/g, '')
                  setSettings({ ...settings, phone: v })
                  if (errors.phone) setErrors({ ...errors, phone: '' })
                }}
                disabled={!isEditing}
                placeholder="+48512315515"
              />
              {errors.phone && <span className={styles.siteSettings__fieldError}>{errors.phone}</span>}
            </div>

            <div className={styles.siteSettings__inputGroup}>
              <label htmlFor="site-email">E-mail kontaktowy:</label>
              <input
                id="site-email"
                type="email"
                className={`${styles.siteSettings__input}${errors.email ? ` ${styles['siteSettings__input--error']}` : ''}`}
                value={settings.email}
                onChange={(e) => { setSettings({ ...settings, email: e.target.value }); if (errors.email) setErrors({ ...errors, email: '' }) }}
                disabled={!isEditing}
                placeholder="kontakt@example.com"
              />
              {errors.email && <span className={styles.siteSettings__fieldError}>{errors.email}</span>}
            </div>

            <div className={styles.siteSettings__inputGroup}>
              <label htmlFor="site-facebook">Facebook URL:</label>
              <input
                id="site-facebook"
                type="text"
                className={styles.siteSettings__input}
                value={settings.facebookUrl}
                onChange={(e) => setSettings({ ...settings, facebookUrl: e.target.value })}
                disabled={!isEditing}
                placeholder="https://facebook.com/..."
              />
            </div>

            <div className={styles.siteSettings__inputGroup}>
              <label htmlFor="site-bank-account">Numer konta bankowego:</label>
              <input
                id="site-bank-account"
                type="text"
                className={styles.siteSettings__input}
                value={settings.bankAccountNumber}
                onChange={(e) => setSettings({ ...settings, bankAccountNumber: e.target.value })}
                disabled={!isEditing}
                placeholder="00 0000 0000 0000 0000 0000 0000"
              />
            </div>

            {isEditing && (
              <div className={styles.siteSettings__actions}>
                <button
                  type="button"
                  className={styles.siteSettings__saveBtn}
                  onClick={handleSave}
                  disabled={!hasChanges || isSaving}
                >
                  {isSaving ? 'Zapisywanie...' : 'Zapisz'}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </AdminSection>
  )
}
