'use client'

import { useCallback, useEffect, useState } from 'react'
import FloatingBackButton from '@/app/_components/FloatingBackButton/FloatingBackButton'
import CalendarPicker, { DatesData } from '@/app/_components/CalendarPicker/CalendarPicker'
import { getAllProperties } from '@/actions/adminPropertyActions'
import {
  createBlockedBookingByAdmin,
  deleteBlockedBookingByAdmin,
  getBlockedBookings,
  getUnavailableDatesForBlocking,
} from '@/actions/adminBookingActions'
import '../../settings/settings.css'
import styles from './page.module.css'

interface PropertyOption {
  _id: string
  name: string
}

interface BookingDates {
  start: string | null
  end: string | null
  count: number
}

interface BlockedItem {
  _id: string
  propertyId: string
  propertyName: string
  startDate: string
  endDate: string
  adminNotes: string
  createdAt: string
}

const ALL_PROPERTIES_ID = 'ALL_PROPERTIES'

export default function BlockBookingsPage() {
  const [properties, setProperties] = useState<PropertyOption[]>([])
  const [selectedPropertyId, setSelectedPropertyId] = useState('')
  const [bookingDates, setBookingDates] = useState<BookingDates>({ start: null, end: null, count: 0 })
  const [calendarDates, setCalendarDates] = useState<DatesData>({})
  const [blockedBookings, setBlockedBookings] = useState<BlockedItem[]>([])
  const [adminNotes, setAdminNotes] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingUnavailable, setIsLoadingUnavailable] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const loadBlockedBookings = useCallback(async (propertyId?: string) => {
    const rows = await getBlockedBookings(propertyId)
    setBlockedBookings(rows)
  }, [])

  const loadUnavailable = useCallback(async (propertyId: string) => {
    setIsLoadingUnavailable(true)
    try {
      const dates = await getUnavailableDatesForBlocking(propertyId)
      const mapped: DatesData = {}
      dates.forEach((entry) => {
        if (entry.date) {
          mapped[entry.date] = { available: false }
        }
      })
      setCalendarDates(mapped)
    } finally {
      setIsLoadingUnavailable(false)
    }
  }, [])

  useEffect(() => {
    const load = async () => {
      setIsLoading(true)
      try {
        const props = await getAllProperties()
        setProperties(props.map((p) => ({ _id: p._id, name: p.name })))
        await loadBlockedBookings()
      } finally {
        setIsLoading(false)
      }
    }

    load()
  }, [loadBlockedBookings])

  useEffect(() => {
    setBookingDates({ start: null, end: null, count: 0 })
    setMessage(null)

    if (!selectedPropertyId) {
      setCalendarDates({})
      loadBlockedBookings()
      return
    }

    loadUnavailable(selectedPropertyId)
    if (selectedPropertyId === ALL_PROPERTIES_ID) {
      loadBlockedBookings()
    } else {
      loadBlockedBookings(selectedPropertyId)
    }
  }, [selectedPropertyId, loadBlockedBookings, loadUnavailable])

  const handleCreateBlock = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedPropertyId || !bookingDates.start || !bookingDates.end) {
      setMessage({ type: 'error', text: 'Wybierz domek i zakres dat blokady.' })
      return
    }

    setIsSubmitting(true)
    setMessage(null)

    try {
      const result = await createBlockedBookingByAdmin({
        propertyId: selectedPropertyId,
        startDate: bookingDates.start,
        endDate: bookingDates.end,
        adminNotes,
      })

      if (result.success) {
        setMessage({ type: 'success', text: result.message })
        setBookingDates({ start: null, end: null, count: 0 })
        setAdminNotes('')
        await loadUnavailable(selectedPropertyId)
        if (selectedPropertyId === ALL_PROPERTIES_ID) {
          await loadBlockedBookings()
        } else {
          await loadBlockedBookings(selectedPropertyId)
        }
      } else {
        setMessage({ type: 'error', text: result.message })
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteBlock = async (id: string) => {
    const accepted = window.confirm('Czy na pewno chcesz usunąć tę blokadę?')
    if (!accepted) return

    setIsDeletingId(id)
    setMessage(null)

    try {
      const result = await deleteBlockedBookingByAdmin(id)
      if (result.success) {
        setMessage({ type: 'success', text: result.message })
        if (selectedPropertyId) {
          await loadUnavailable(selectedPropertyId)
        }
        if (selectedPropertyId && selectedPropertyId !== ALL_PROPERTIES_ID) {
          await loadBlockedBookings(selectedPropertyId)
        } else {
          await loadBlockedBookings()
        }
      } else {
        setMessage({ type: 'error', text: result.message })
      }
    } finally {
      setIsDeletingId(null)
    }
  }

  return (
    <div className="admin-settings-container">
      <FloatingBackButton />
      <header className="admin-header">
        <h1 className="admin-title">Blokuj terminy</h1>
        <p className="admin-subtitle">Twórz blokady administracyjne dla jednego domku lub wszystkich domków.</p>
      </header>

      <form className="settings-card" onSubmit={handleCreateBlock}>
        <div className="card-header">
          <h2 className="card-title">Nowa blokada</h2>
          <span className="card-badge">Admin</span>
        </div>

        <div className="setting-row">
          <div className="setting-content">
            <label className="setting-label" htmlFor="propertySelect">Domek</label>
            <p className="setting-description">Wybierz domek z listy lub opcję Wszystkie.</p>
          </div>
          <div className="setting-control">
            <select
              id="propertySelect"
              value={selectedPropertyId}
              onChange={(e) => setSelectedPropertyId(e.target.value)}
              className={styles.selectInput}
              disabled={isLoading || isSubmitting}
            >
              <option value="">-- Wybierz domek --</option>
              {properties.map((property) => (
                <option key={property._id} value={property._id}>
                  {property.name}
                </option>
              ))}
              <option value={ALL_PROPERTIES_ID}>Wszystkie</option>
            </select>
          </div>
        </div>

        {selectedPropertyId && (
          <div className="setting-row">
            <div className="setting-content">
              <label className="setting-label">Zakres blokady</label>
              <p className="setting-description">Wybierz początek i koniec blokady w kalendarzu.</p>
            </div>
            <div className="setting-control">
              {isLoadingUnavailable ? (
                <div className={styles.loadingHint}>Wczytywanie zajętych terminów...</div>
              ) : (
                <CalendarPicker
                  dates={calendarDates}
                  onDateChange={setBookingDates}
                  minBookingDays={1}
                />
              )}
              <div className={styles.rangePreview}>
                <strong>Wybrany zakres:</strong>{' '}
                {bookingDates.start && bookingDates.end
                  ? `${bookingDates.start} -> ${bookingDates.end}`
                  : 'brak'}
              </div>
            </div>
          </div>
        )}

        {selectedPropertyId && (
          <div className="setting-row">
            <div className="setting-content">
              <label className="setting-label" htmlFor="adminNotes">Notatka (opcjonalnie)</label>
              <p className="setting-description">Ta notatka będzie widoczna przy blokadzie.</p>
            </div>
            <div className="setting-control">
              <textarea
                id="adminNotes"
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                className={styles.notesInput}
                placeholder="np. serwis techniczny"
                disabled={isSubmitting}
              />
            </div>
          </div>
        )}

        <div className={styles.actionsRow}>
          <button type="submit" className="btn-primary" disabled={isSubmitting || !selectedPropertyId || !bookingDates.start || !bookingDates.end}>
            {isSubmitting ? 'Zapisywanie...' : 'Zablokuj termin'}
          </button>
        </div>

        {message && (
          <div className={message.type === 'success' ? styles.successMsg : styles.errorMsg}>
            {message.text}
          </div>
        )}
      </form>

      <section className="settings-card">
        <div className="card-header">
          <h2 className="card-title">Istniejące blokady</h2>
          <span className="card-badge">{blockedBookings.length}</span>
        </div>

        {blockedBookings.length === 0 ? (
          <div className={styles.emptyState}>Brak blokad dla wybranego filtra.</div>
        ) : (
          <div className={styles.blockList}>
            {blockedBookings.map((item) => (
              <article key={item._id} className={styles.blockItem}>
                <div className={styles.blockMeta}>
                  <strong>{item.propertyName}</strong>
                  <span>
                    {new Date(item.startDate).toLocaleDateString('pl-PL')} - {new Date(item.endDate).toLocaleDateString('pl-PL')}
                  </span>
                  {item.adminNotes && <small>{item.adminNotes}</small>}
                </div>
                <button
                  type="button"
                  className={styles.deleteBtn}
                  onClick={() => handleDeleteBlock(item._id)}
                  disabled={isDeletingId === item._id}
                >
                  {isDeletingId === item._id ? 'Usuwanie...' : 'Usuń blokadę'}
                </button>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
