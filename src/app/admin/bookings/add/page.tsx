'use client'
import React, { useEffect, useRef, useState, useTransition } from 'react'
import { useActionState } from 'react'
import styles from './page.module.css'
import { createManualBooking, calculatePriceAction, getUnavailableDatesForProperty } from '@/actions/adminBookingActions'
import { getAllProperties } from '@/actions/adminPropertyActions'
import FloatingBackButton from '@/app/_components/FloatingBackButton/FloatingBackButton'
import CalendarPicker from '@/app/_components/CalendarPicker/CalendarPicker'
import QuantityPicker from '@/app/_components/QuantityPicker/QuantityPicker'
import { useClickOutside } from '@/hooks/useClickOutside'

const initialState = {
  message: '',
  success: false,
}

interface BookingDates {
  start: string | null
  end: string | null
  count: number
}

interface PropertyOption {
  _id: string
  name: string
  baseCapacity: number
  maxExtraBeds: number
  isComposite?: boolean
}

interface UnavailableDate {
  date: string | null
}

interface InvoiceData {
  companyName: string
  nip: string
  street: string
  postalCode: string
  city: string
}

export default function AddBookingPage() {
  const [state, formAction, isPending] = useActionState(createManualBooking, initialState)
  const formRef = useRef<HTMLFormElement>(null)
  const [properties, setProperties] = useState<PropertyOption[]>([])
  const [propertySelection, setPropertySelection] = useState('')
  const [selectedProperty, setSelectedProperty] = useState<PropertyOption | null>(null)
  const [numGuests, setNumGuests] = useState(2)
  const [extraBeds, setExtraBeds] = useState(0)
  const [paidAmount, setPaidAmount] = useState(0)
  const [totalPrice, setTotalPrice] = useState(0)
  const [bookingDates, setBookingDates] = useState<BookingDates>({ start: null, end: null, count: 0 })
  const [isCalendarOpen, setCalendarOpen] = useState(false)
  const [unavailableDates, setUnavailableDates] = useState<UnavailableDate[]>([])
  const calendarRef = useRef<HTMLDivElement>(null)
  const [isCalculating, startPriceCalculation] = useTransition()
  const [wantsInvoice, setWantsInvoice] = useState(false)
  const [invoiceData, setInvoiceData] = useState<InvoiceData>({
    companyName: '',
    nip: '',
    street: '',
    postalCode: '',
    city: '',
  })
  const [invoiceErrors, setInvoiceErrors] = useState<Record<string, string>>({})

  const isDateRangeSelected = !!(bookingDates.start && bookingDates.end)

  useEffect(() => {
    const loadProperties = async () => {
      try {
        const data = await getAllProperties()
        setProperties(data)
      } catch (error) {
        console.error('Failed to load properties:', error)
      }
    }
    loadProperties()
  }, [])

  useEffect(() => {
    if (propertySelection) {
      const prop = properties.find(p => p._id === propertySelection)
      setSelectedProperty(prop || null)
    } else {
      setSelectedProperty(null)
    }
    setBookingDates({ start: null, end: null, count: 0 })
    setTotalPrice(0)
  }, [propertySelection, properties])

  useEffect(() => {
    if (selectedProperty) {
      const maxGuests = selectedProperty.baseCapacity
      const maxExtraBedsValue = selectedProperty.maxExtraBeds
      if (numGuests > maxGuests) {
        setNumGuests(Math.min(2, maxGuests))
      }
      if (extraBeds > maxExtraBedsValue) {
        setExtraBeds(0)
      }
    }
  }, [selectedProperty])

  useEffect(() => {
    const fetchUnavailableDates = async () => {
      if (propertySelection) {
        try {
          const dates = await getUnavailableDatesForProperty(propertySelection)
          setUnavailableDates(dates)
        } catch (error) {
          console.error('Failed to fetch unavailable dates:', error)
        }
      } else {
        setUnavailableDates([])
      }
    }
    fetchUnavailableDates()
  }, [propertySelection])

  useClickOutside(calendarRef, () => {
    if (isCalendarOpen) setCalendarOpen(false)
  })

  useEffect(() => {
    if (state.success) {
      alert(state.message)
      formRef.current?.reset()
      setExtraBeds(0)
      setPaidAmount(0)
      setTotalPrice(0)
      setBookingDates({ start: null, end: null, count: 0 })
      setNumGuests(2)
      setPropertySelection('')
      setSelectedProperty(null)
      setWantsInvoice(false)
      setInvoiceData({
        companyName: '',
        nip: '',
        street: '',
        postalCode: '',
        city: '',
      })
      setInvoiceErrors({})
    }
  }, [state])

  useEffect(() => {
    const { start, end } = bookingDates
    if (start && end && numGuests > 0 && propertySelection) {
      startPriceCalculation(async () => {
        const { price } = await calculatePriceAction({
          startDate: start,
          endDate: end,
          guests: numGuests,
          extraBeds,
          propertySelection
        })
        setTotalPrice(price)
      })
    }
  }, [bookingDates, numGuests, extraBeds, propertySelection])

  const handleExtraBedsChange = (value: number) => {
    setExtraBeds(value)
  }

  const handlePaidAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value) || 0
    setPaidAmount(Math.max(0, value))
  }

  const handleInvoiceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setInvoiceData(prev => ({
      ...prev,
      [name]: value
    }))
    if (invoiceErrors[name]) {
      setInvoiceErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }

  const validateInvoiceData = (): boolean => {
    const errors: Record<string, string> = {}
    if (!invoiceData.companyName.trim()) {
      errors.companyName = 'Nazwa firmy jest wymagana'
    }
    if (!invoiceData.nip.trim()) {
      errors.nip = 'NIP jest wymagany'
    } else if (!/^[\d-]{10,13}$/.test(invoiceData.nip.replace(/-/g, ''))) {
      errors.nip = 'Nieprawidłowy format NIP'
    }
    if (!invoiceData.street.trim()) {
      errors.street = 'Ulica jest wymagana'
    }
    if (!invoiceData.postalCode.trim()) {
      errors.postalCode = 'Kod pocztowy jest wymagany'
    } else if (!/^\d{2}-\d{3}$/.test(invoiceData.postalCode)) {
      errors.postalCode = 'Nieprawidłowy format (XX-XXX)'
    }
    if (!invoiceData.city.trim()) {
      errors.city = 'Miejscowość jest wymagana'
    }
    setInvoiceErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    if (wantsInvoice && !validateInvoiceData()) {
      e.preventDefault()
      alert('Proszę wypełnić wszystkie wymagane pola faktury')
      return
    }
  }

  const remainingAmount = Math.max(0, totalPrice - paidAmount)
  const getPaymentBadge = () => {
    if (paidAmount >= totalPrice && totalPrice > 0) return { text: 'Opłacone', class: styles.paymentPaid }
    if (paidAmount > 0) return { text: 'Zaliczka', class: styles.paymentDeposit }
    return { text: 'Nieopłacone', class: styles.paymentUnpaid }
  }
  const paymentBadge = getPaymentBadge()
  const maxGuests = selectedProperty ? selectedProperty.baseCapacity : 12
  const maxExtraBedsValue = selectedProperty ? selectedProperty.maxExtraBeds : 4

  return (
    <div className={styles.container}>
      <FloatingBackButton />
      <header className={styles.header}>
        <h1>Dodaj Nową Rezerwację</h1>
        <p>Ręczne wprowadzenie rezerwacji (np. telefonicznej)</p>
      </header>
      <form ref={formRef} action={formAction} onSubmit={handleSubmit} className={styles.formCard}>
        <div className={styles.sectionTitle}>Termin i Obiekt</div>
        <div className={styles.grid}>
          <input type="hidden" name="startDate" value={bookingDates.start || ''} />
          <input type="hidden" name="endDate" value={bookingDates.end || ''} />
          <input type="hidden" name="numGuests" value={numGuests} />
          <input type="hidden" name="extraBeds" value={extraBeds} />
          <input type="hidden" name="invoice" value={wantsInvoice ? 'true' : 'false'} />
          <input type="hidden" name="invoiceCompany" value={invoiceData.companyName} />
          <input type="hidden" name="invoiceNip" value={invoiceData.nip} />
          <input type="hidden" name="invoiceStreet" value={invoiceData.street} />
          <input type="hidden" name="invoicePostalCode" value={invoiceData.postalCode} />
          <input type="hidden" name="invoiceCity" value={invoiceData.city} />
          <div className={styles.inputGroup}>
            <label htmlFor="propertyId">Obiekt</label>
            <select
              id="propertyId"
              name="propertyId"
              required
              onChange={(e) => setPropertySelection(e.target.value)}
              value={propertySelection}
            >
              <option value="">Wybierz domek</option>
              {properties
                .filter(p => !p.isComposite)
                .map(prop => (
                  <option key={prop._id} value={prop._id}>{prop.name}</option>
                ))}
              {properties.some(p => p.isComposite) && (
                <option value={properties.find(p => p.isComposite)?._id}>
                  Cała posesja
                </option>
              )}
            </select>
          </div>
          <div className={styles.dateBox}>
            <label className={styles.label}>Wybierz termin</label>
            <div
              className={`${styles.date} ${!propertySelection ? styles.dateDisabled : ''}`}
              onClick={() => propertySelection && setCalendarOpen(!isCalendarOpen)}
            >
              <span>
                {bookingDates.start && bookingDates.end
                  ? `${bookingDates.start} — ${bookingDates.end}`
                  : propertySelection ? 'Wybierz daty' : 'Najpierw wybierz obiekt'}
              </span>
              <span className={styles.dateArrow}>&#9662;</span>
            </div>
            {isCalendarOpen && (
              <div
                ref={calendarRef}
                className={`${styles.setDate} ${isCalendarOpen ? styles.expandedDate : ''}`}
              >
                <CalendarPicker
                  unavailableDates={unavailableDates}
                  onDateChange={setBookingDates}
                />
                <button type="button" className={styles.buttOk} onClick={() => setCalendarOpen(false)}>Gotowe</button>
              </div>
            )}
          </div>
          <div className={`${styles.inputGroup} ${!propertySelection ? styles.disabledGroup : ''}`}>
            <label htmlFor="numGuests">Liczba gości</label>
            <QuantityPicker
              value={numGuests}
              onIncrement={() => setNumGuests(prev => Math.min(maxGuests, prev + 1))}
              onDecrement={() => setNumGuests(prev => Math.max(1, prev - 1))}
              min={1}
              max={maxGuests}
            />
            {propertySelection && (
              <small className={styles.hint}>Maksymalnie {maxGuests} osób</small>
            )}
          </div>
          <div className={`${styles.inputGroup} ${!propertySelection ? styles.disabledGroup : ''}`}>
            <label htmlFor="extraBeds">Liczba dostawek</label>
            <QuantityPicker
              value={extraBeds}
              onIncrement={() => handleExtraBedsChange(Math.min(maxExtraBedsValue, extraBeds + 1))}
              onDecrement={() => handleExtraBedsChange(Math.max(0, extraBeds - 1))}
              min={0}
              max={maxExtraBedsValue}
            />
            {propertySelection && (
              <small className={styles.hint}>Maksymalnie {maxExtraBedsValue} dostawek</small>
            )}
          </div>
        </div>

        <div className={styles.sectionTitle}>Płatność</div>
        <div className={styles.grid}>
          <div className={styles.inputGroup}>
            <label htmlFor="totalPrice">Cena całkowita (PLN) *</label>
            <div className={styles.priceInputWrapper}>
              <input
                id="totalPrice"
                name="totalPrice"
                type="number"
                required
                placeholder="0.00"
                step="0.01"
                min="0"
                value={totalPrice || ''}
                disabled={isCalculating || !propertySelection || !isDateRangeSelected}
                onChange={(e) => setTotalPrice(parseFloat(e.target.value) || 0)}
              />
              {isCalculating && <div className={styles.spinner}></div>}
            </div>
          </div>
          <div className={styles.inputGroup}>
            <label htmlFor="paidAmount">Wpłacono (PLN)</label>
            <input
              id="paidAmount"
              name="paidAmount"
              type="number"
              placeholder="0.00"
              step="0.01"
              min="0"
              max={totalPrice}
              value={paidAmount || ''}
              onChange={handlePaidAmountChange}
            />
          </div>
          <div className={styles.inputGroup}>
            <label>Do zapłaty</label>
            <div className={styles.remainingAmount}>
              <span className={styles.remainingValue}>{remainingAmount.toFixed(2)} zł</span>
            </div>
          </div>
          <div className={styles.inputGroup}>
            <label>Status płatności</label>
            <span className={`${styles.badge} ${paymentBadge.class}`}>{paymentBadge.text}</span>
          </div>
        </div>

        <div className={styles.sectionTitle}>Dodatkowe opcje</div>
        <div className={styles.invoiceOptionGroup}>
          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={wantsInvoice}
              onChange={(e) => setWantsInvoice(e.target.checked)}
            />
            <span>Chcę otrzymać fakturę VAT</span>
          </label>
        </div>

        <div className={`${styles.invoiceWrapper} ${wantsInvoice ? styles.expanded : ''}`}>
          <div className={styles.invoiceContent}>
            <h3 className={styles.invoiceTitle}>Dane do faktury VAT</h3>
            <div className={`${styles.inputGroup} ${styles.fadeIn}`} style={{ animationDelay: '0.05s' }}>
              <label htmlFor="invoiceCompanyName">Nazwa firmy *</label>
              <input
                id="invoiceCompanyName"
                name="companyName"
                type="text"
                value={invoiceData.companyName}
                onChange={handleInvoiceChange}
                className={invoiceErrors.companyName ? styles.inputError : ''}
                placeholder="Pełna nazwa firmy"
                disabled={!wantsInvoice}
              />
              {invoiceErrors.companyName && <span className={styles.errorText}>{invoiceErrors.companyName}</span>}
            </div>
            <div className={`${styles.inputGroup} ${styles.fadeIn}`} style={{ animationDelay: '0.1s' }}>
              <label htmlFor="invoiceNip">NIP *</label>
              <input
                id="invoiceNip"
                name="nip"
                type="text"
                value={invoiceData.nip}
                onChange={handleInvoiceChange}
                className={invoiceErrors.nip ? styles.inputError : ''}
                placeholder="123-456-78-90"
                disabled={!wantsInvoice}
              />
              {invoiceErrors.nip && <span className={styles.errorText}>{invoiceErrors.nip}</span>}
            </div>
            <div className={`${styles.inputGroup} ${styles.fadeIn}`} style={{ animationDelay: '0.15s' }}>
              <label htmlFor="invoiceStreet">Ulica i numer *</label>
              <input
                id="invoiceStreet"
                name="street"
                type="text"
                value={invoiceData.street}
                onChange={handleInvoiceChange}
                className={invoiceErrors.street ? styles.inputError : ''}
                placeholder="ul. Przykładowa 123"
                disabled={!wantsInvoice}
              />
              {invoiceErrors.street && <span className={styles.errorText}>{invoiceErrors.street}</span>}
            </div>
            <div className={`${styles.grid} ${styles.fadeIn}`} style={{ animationDelay: '0.2s' }}>
              <div className={styles.inputGroup}>
                <label htmlFor="invoicePostalCode">Kod pocztowy *</label>
                <input
                  id="invoicePostalCode"
                  name="postalCode"
                  type="text"
                  value={invoiceData.postalCode}
                  onChange={handleInvoiceChange}
                  className={invoiceErrors.postalCode ? styles.inputError : ''}
                  placeholder="00-000"
                  maxLength={6}
                  disabled={!wantsInvoice}
                />
                {invoiceErrors.postalCode && <span className={styles.errorText}>{invoiceErrors.postalCode}</span>}
              </div>
              <div className={styles.inputGroup}>
                <label htmlFor="invoiceCity">Miejscowość *</label>
                <input
                  id="invoiceCity"
                  name="city"
                  type="text"
                  value={invoiceData.city}
                  onChange={handleInvoiceChange}
                  className={invoiceErrors.city ? styles.inputError : ''}
                  placeholder="Miejscowość"
                  disabled={!wantsInvoice}
                />
                {invoiceErrors.city && <span className={styles.errorText}>{invoiceErrors.city}</span>}
              </div>
            </div>
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
  )
}