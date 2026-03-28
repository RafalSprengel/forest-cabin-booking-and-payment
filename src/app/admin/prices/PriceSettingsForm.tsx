// src/app/admin/prices/PriceSettingsForm.tsx
'use client'
import { useState, useEffect, useCallback, useMemo } from 'react'
import { useActionState } from 'react'
import { updateBasicPrices, updateSeasonPricesForProperty } from '@/actions/seasonActions'
import { updateCustompriceForDate, getCustomPrices, deleteCustomPricesForDate } from '@/actions/priceConfigActions'
import CalendarPicker, { DatesData } from '@/app/_components/CalendarPicker/CalendarPicker'
import dayjs from 'dayjs'
import QuantityPicker from '@/app/_components/QuantityPicker/QuantityPicker'
import Modal from '@/app/_components/Modal/Modal'
import { toast, Toaster } from 'react-hot-toast'
import '../settings/settings.css'
import styles from './page.module.css'

interface PropertyOption {
  _id: string
  name: string
  baseCapacity: number
  maxExtraBeds: number
  basicPrices?: {
    weekdayPrices: PriceTier[]
    weekendPrices: PriceTier[]
    weekdayExtraBedPrice: number
    weekendExtraBedPrice: number
  }
  seasonPrices?: SeasonPriceEntry[]
}

interface PriceTier {
  minGuests: number
  maxGuests: number
  price: number
}

interface SeasonPriceEntry {
  seasonId: string
  weekdayPrices: PriceTier[]
  weekendPrices: PriceTier[]
  weekdayExtraBedPrice: number
  weekendExtraBedPrice: number
}

interface BookingDates {
  start: string | null
  end: string | null
  count: number
}

interface CustomPriceEntry {
  date: string
  price: number
  propertyId: string
  weekdayExtraBedPrice?: number
  weekendExtraBedPrice?: number
}

interface Season {
  _id: string
  name: string
  description?: string
  startDate: Date
  endDate: Date
  isActive: boolean
  order: number
}

interface Props {
  properties: PropertyOption[]
  childrenFreeAgeLimit: number
  seasons: Season[]
}

const OFF_SEASON_ID = 'off-season'

export default function PriceSettingsForm({ properties, childrenFreeAgeLimit, seasons }: Props) {
  // 1. Wybór domku (wymagany)
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>('')
  
  // 2. Wybór "sezonu" - może być "Poza sezonem" lub konkretny sezon
  const [selectedSeasonId, setSelectedSeasonId] = useState<string>(OFF_SEASON_ID)
  
  // 3. Stany formularza cen
  const [weekdayTiers, setWeekdayTiers] = useState<PriceTier[]>([])
  const [weekendTiers, setWeekendTiers] = useState<PriceTier[]>([])
  const [weekdayExtraBedPrice, setWeekdayExtraBedPrice] = useState<number>(50)
  const [weekendExtraBedPrice, setWeekendExtraBedPrice] = useState<number>(70)
  
  // 4. Stan dla cen indywidualnych (per data)
  const [bookingDates, setBookingDates] = useState<BookingDates>({ start: null, end: null, count: 0 })
  const [customPrice, setCustomPrice] = useState<number>(300)
  const [customPrices, setCustomPrices] = useState<CustomPriceEntry[]>([])
  const [customWeekdayExtraBedPrice, setCustomWeekdayExtraBedPrice] = useState<number>(50)
  const [customWeekendExtraBedPrice, setCustomWeekendExtraBedPrice] = useState<number>(70)
  const [calendarPrices, setCalendarPrices] = useState<Record<string, number>>({})
  const [selectedDateForPrice, setSelectedDateForPrice] = useState<string | null>(null)
  
  // 5. Stany UI
  const [isSaving, setIsSaving] = useState(false)
  const [isDeletingCustom, setIsDeletingCustom] = useState(false)
  const [isCustomPricesExpanded, setIsCustomPricesExpanded] = useState(false)
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; type: 'weekday' | 'weekend' | null; index: number | null }>({ isOpen: false, type: null, index: null })

  // Pobierz dane cenowe gdy zmienią się property + season
  useEffect(() => {
    if (!selectedPropertyId) return
    
    const property = properties.find(p => p._id === selectedPropertyId)
    if (!property) return

    if (selectedSeasonId === OFF_SEASON_ID) {
      // Ładuj basicPrices
      if (property.basicPrices) {
        setWeekdayTiers(property.basicPrices.weekdayPrices || [])
        setWeekendTiers(property.basicPrices.weekendPrices || [])
        setWeekdayExtraBedPrice(property.basicPrices.weekdayExtraBedPrice ?? 50)
        setWeekendExtraBedPrice(property.basicPrices.weekendExtraBedPrice ?? 70)
      } else {
        // Domyślne wartości jeśli brak basicPrices
        setWeekdayTiers([{ minGuests: 1, maxGuests: 3, price: 300 }])
        setWeekendTiers([{ minGuests: 1, maxGuests: 3, price: 400 }])
        setWeekdayExtraBedPrice(50)
        setWeekendExtraBedPrice(70)
      }
    } else {
      // Ładuj seasonPrices dla wybranego sezonu
      const seasonPrice = property.seasonPrices?.find(sp => sp.seasonId === selectedSeasonId)
      if (seasonPrice) {
        setWeekdayTiers(seasonPrice.weekdayPrices || [])
        setWeekendTiers(seasonPrice.weekendPrices || [])
        setWeekdayExtraBedPrice(seasonPrice.weekdayExtraBedPrice ?? 50)
        setWeekendExtraBedPrice(seasonPrice.weekendExtraBedPrice ?? 70)
      } else {
        // Domyślne jeśli brak cen dla tego sezonu
        setWeekdayTiers([{ minGuests: 1, maxGuests: 3, price: 300 }])
        setWeekendTiers([{ minGuests: 1, maxGuests: 3, price: 400 }])
        setWeekdayExtraBedPrice(50)
        setWeekendExtraBedPrice(70)
      }
    }
  }, [selectedPropertyId, selectedSeasonId, properties])

  // Ładuj custom prices gdy zmienią się property
  useEffect(() => {
    if (!selectedPropertyId) return
    
    const loadCustomPrices = async () => {
      const prices = await getCustomPrices(selectedPropertyId)
      setCustomPrices(prices)
      const priceMap: Record<string, number> = {}
      prices.forEach(p => { priceMap[p.date] = p.price })
      setCalendarPrices(priceMap)
    }
    loadCustomPrices()
  }, [selectedPropertyId])

  const calendarDates = useMemo(() => {
    const dates: DatesData = {}
    Object.entries(calendarPrices).forEach(([date, price]) => {
      dates[date] = { price, available: true }
    })
    return dates
  }, [calendarPrices])

  // ─────────────────────────────────────────────────────────────
  // Handler: zmiana przedziału cenowego
  // ─────────────────────────────────────────────────────────────
  const handleBaseRateChange = (
    type: 'weekday' | 'weekend',
    index: number,
    field: keyof PriceTier,
    value: number
  ) => {
    let setter = setWeekdayTiers
    if (type === 'weekend') setter = setWeekendTiers
    
    setter(prev => {
      const updated = [...prev]
      updated[index] = { ...updated[index], [field]: value }
      return updated
    })
  }

  // ─────────────────────────────────────────────────────────────
  // Handler: dodaj nowy przedział
  // ─────────────────────────────────────────────────────────────
  const addTier = (type: 'weekday' | 'weekend') => {
    let tiers = weekdayTiers
    let setter = setWeekdayTiers
    if (type === 'weekend') {
      tiers = weekendTiers
      setter = setWeekendTiers
    }
    
    if (tiers.length === 0) {
      setter([{ minGuests: 1, maxGuests: 3, price: type === 'weekend' ? 400 : 300 }])
      return
    }
    
    const lastTier = tiers[tiers.length - 1]
    setter(prev => [
      ...prev,
      { 
        minGuests: lastTier.maxGuests + 1, 
        maxGuests: lastTier.maxGuests + 2, 
        price: lastTier.price + 100 
      }
    ])
  }

  // ─────────────────────────────────────────────────────────────
  // Handler: usuń przedział (z potwierdzeniem)
  // ─────────────────────────────────────────────────────────────
  const requestRemoveTier = (type: 'weekday' | 'weekend', index: number) => {
    setDeleteModal({ isOpen: true, type, index })
  }

  const confirmRemoveTier = () => {
    if (deleteModal.type && deleteModal.index !== null) {
      let setter = setWeekdayTiers
      if (deleteModal.type === 'weekend') setter = setWeekendTiers
      setter(prev => prev.filter((_, i) => i !== deleteModal.index))
      setDeleteModal({ isOpen: false, type: null, index: null })
    }
  }

  // ─────────────────────────────────────────────────────────────
  // Handler: zapisz ceny sezonowe/basic
  // ─────────────────────────────────────────────────────────────
  const handleSavePrices = async () => {
    if (!selectedPropertyId) {
      toast.error('Wybierz domek')
      return
    }
    
    setIsSaving(true)
    try {
      const formData = new FormData()
      formData.append('propertyId', selectedPropertyId)
      formData.append('weekdayTiers', JSON.stringify(weekdayTiers))
      formData.append('weekendTiers', JSON.stringify(weekendTiers))
      formData.append('weekdayExtraBedPrice', weekdayExtraBedPrice.toString())
      formData.append('weekendExtraBedPrice', weekendExtraBedPrice.toString())
      
      if (selectedSeasonId === OFF_SEASON_ID) {
        formData.append('mode', 'basic')
        const result = await updateBasicPrices(null, formData)
        if (result.success) {
          toast.success('Zapisano ceny podstawowe')
        } else {
          toast.error(result.message)
        }
      } else {
        formData.append('mode', 'season')
        formData.append('seasonId', selectedSeasonId)
        const result = await updateSeasonPricesForProperty(null, formData)
        if (result.success) {
          const season = seasons.find(s => s._id === selectedSeasonId)
          toast.success(`Zapisano ceny dla: ${season?.name || 'sezonu'}`)
        } else {
          toast.error(result.message)
        }
      }
    } catch (error) {
      console.error(error)
      toast.error('Wystąpił błąd podczas zapisu')
    } finally {
      setIsSaving(false)
    }
  }

  // ─────────────────────────────────────────────────────────────
  // Handler: ceny indywidualne (per data)
  // ─────────────────────────────────────────────────────────────
  const handleDateSelect = useCallback((dates: BookingDates) => {
    setBookingDates(prev => {
      if (prev.start === dates.start && prev.end === dates.end) return prev
      return dates
    })
    
    if (dates.start && !dates.end) {
      setSelectedDateForPrice(dates.start)
      const priceEntry = customPrices.find(p => p.date === dates.start)
      if (priceEntry) {
        setCustomPrice(priceEntry.price)
        setCustomWeekdayExtraBedPrice(priceEntry.weekdayExtraBedPrice ?? 50)
        setCustomWeekendExtraBedPrice(priceEntry.weekendExtraBedPrice ?? 70)
      }
    }
  }, [customPrices])

  const handleSaveCustomPrice = async () => {
    if (!selectedPropertyId || !bookingDates.start) return
    
    setIsSaving(true)
    try {
      const dates: string[] = []
      const start = dayjs(bookingDates.start)
      
      if (bookingDates.end) {
        const end = dayjs(bookingDates.end)
        let current = start
        while (current.isBefore(end) || current.isSame(end, 'day')) {
          dates.push(current.format('YYYY-MM-DD'))
          current = current.add(1, 'day')
        }
      } else {
        dates.push(start.format('YYYY-MM-DD'))
      }
      
      const result = await updateCustompriceForDate({
        propertyId: selectedPropertyId,
        dates,
        price: customPrice,
        weekdayExtraBedPrice: customWeekdayExtraBedPrice,
        weekendExtraBedPrice: customWeekendExtraBedPrice
      })
      
      if (result?.success) {
        toast.success(result.message)
        const prices = await getCustomPrices(selectedPropertyId)
        setCustomPrices(prices)
        const priceMap: Record<string, number> = {}
        prices.forEach(p => { priceMap[p.date] = p.price })
        setCalendarPrices(priceMap)
        setBookingDates({ start: null, end: null, count: 0 })
        setSelectedDateForPrice(null)
      } else {
        toast.error(result?.message || 'Błąd zapisu')
      }
    } catch (error) {
      console.error(error)
      toast.error('Wystąpił błąd')
    } finally {
      setIsSaving(false)
    }
  }

  const handleRemoveCustomPrice = async () => {
    if (!selectedPropertyId || !bookingDates.start) return
    
    setIsDeletingCustom(true)
    try {
      const dates: string[] = []
      const start = dayjs(bookingDates.start)
      
      if (bookingDates.end) {
        const end = dayjs(bookingDates.end)
        let current = start
        while (current.isBefore(end) || current.isSame(end, 'day')) {
          dates.push(current.format('YYYY-MM-DD'))
          current = current.add(1, 'day')
        }
      } else {
        dates.push(start.format('YYYY-MM-DD'))
      }
      
      const result = await deleteCustomPricesForDate({
        propertyId: selectedPropertyId,
        dates
      })
      
      if (result?.success) {
        toast.success(result.message)
        const prices = await getCustomPrices(selectedPropertyId)
        setCustomPrices(prices)
        const priceMap: Record<string, number> = {}
        prices.forEach(p => { priceMap[p.date] = p.price })
        setCalendarPrices(priceMap)
        setBookingDates({ start: null, end: null, count: 0 })
        setSelectedDateForPrice(null)
      } else {
        toast.error(result?.message || 'Błąd usuwania')
      }
    } catch (error) {
      console.error(error)
      toast.error('Wystąpił błąd')
    } finally {
      setIsDeletingCustom(false)
    }
  }

  const getDayType = (dateStr: string) => {
    const day = dayjs(dateStr).day()
    return day === 0 || day === 6 ? 'weekend' : 'weekday'
  }

  const selectedProperty = properties.find(p => p._id === selectedPropertyId)
  const selectedSeason = seasons.find(s => s._id === selectedSeasonId)

  return (
    <>
      <Toaster position="bottom-right" />
      
      {/* ─────────────────────────────────────────────────────
          SEKCJA 1: Wybór domku (wymagany)
          ───────────────────────────────────────────────────── */}
      <form className="settings-card" onSubmit={(e) => e.preventDefault()}>
        <div className="card-header">
          <h2 className="card-title">Wybierz domek</h2>
        </div>
        <div className="setting-row">
          <div className="setting-content">
            <label className="setting-label">Obiekt</label>
            <p className="setting-description">
              Wybierz domek, dla którego chcesz skonfigurować ceny.
            </p>
          </div>
          <div className="setting-control">
            <select
              value={selectedPropertyId}
              onChange={(e) => {
                setSelectedPropertyId(e.target.value)
                setSelectedSeasonId(OFF_SEASON_ID) // Reset do "poza sezonem"
              }}
              className="date-input"
              style={{ padding: '8px', fontSize: '1rem', minWidth: '200px' }}
            >
              <option value="">-- Wybierz domek --</option>
              {properties.map(prop => (
                <option key={prop._id} value={prop._id}>{prop.name}</option>
              ))}
            </select>
          </div>
        </div>
      </form>

      {/* ─────────────────────────────────────────────────────
          SEKCJA 2: Konfiguracja cen (tylko jeśli wybrany domek)
          ───────────────────────────────────────────────────── */}
      {selectedPropertyId && (
        <form className="settings-card" onSubmit={(e) => e.preventDefault()}>
          <div className="card-header">
            <h2 className="card-title">Konfiguracja cen</h2>
            <div className="setting-control" style={{ marginLeft: 'auto' }}>
              <select
                value={selectedSeasonId}
                onChange={(e) => setSelectedSeasonId(e.target.value)}
                className="date-input"
                style={{ padding: '8px', fontSize: '1rem' }}
              >
                <option value={OFF_SEASON_ID}>🍂 Poza sezonem (ceny bazowe)</option>
                {seasons.map(season => (
                  <option key={season._id} value={season._id}>
                    {season.name} {!season.isActive && '(nieaktywny)'}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Nagłówek sekcji z nazwą */}
          <div className="setting-row" style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
            <div className="setting-content">
              <strong>
                {selectedSeasonId === OFF_SEASON_ID 
                  ? `Ceny podstawowe dla: ${selectedProperty?.name}`
                  : `Ceny w sezonie "${selectedSeason?.name}" dla: ${selectedProperty?.name}`
                }
              </strong>
            </div>
          </div>

          {/* ── Cena weekday ── */}
          <div className="setting-row">
            <div className="setting-content">
              <label className="setting-label">Cena za dobę - Dzień powszedni (nd–czw)</label>
              <p className="setting-description">
                Standardowa stawka obowiązująca od niedzieli do czwartku.
                Ceny są ustalane w przedziałach liczby gości.
              </p>
            </div>
            <div className="setting-control">
              <div className={styles.tiersContainer}>
                {weekdayTiers.map((tier, index) => (
                  <div key={index} className={styles.tierRow}>
                    <span className={styles.tierRange}>{tier.minGuests}–{tier.maxGuests} os.</span>
                    <input
                      type="number"
                      min="0"
                      step="10"
                      value={tier.price}
                      onChange={(e) => handleBaseRateChange('weekday', index, 'price', parseInt(e.target.value) || 0)}
                      className={styles.priceInput}
                    />
                    <span className={styles.currency}>zł</span>
                    {weekdayTiers.length > 1 && (
                      <button
                        type="button"
                        onClick={() => requestRemoveTier('weekday', index)}
                        className={styles.removeTierBtn}
                        aria-label={`Usuń przedział ${tier.minGuests}-${tier.maxGuests} osób`}
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => addTier('weekday')}
                  className={styles.addTierBtn}
                >
                  + Dodaj przedział
                </button>
              </div>
            </div>
          </div>

          {/* ── Cena weekend ── */}
          <div className="setting-row">
            <div className="setting-content">
              <label className="setting-label">Cena za dobę - Weekend (pt–sob)</label>
              <p className="setting-description">
                Podwyższona stawka obowiązująca w piątki i soboty.
              </p>
            </div>
            <div className="setting-control">
              <div className={styles.tiersContainer}>
                {weekendTiers.map((tier, index) => (
                  <div key={index} className={styles.tierRow}>
                    <span className={styles.tierRange}>{tier.minGuests}–{tier.maxGuests} os.</span>
                    <input
                      type="number"
                      min="0"
                      step="10"
                      value={tier.price}
                      onChange={(e) => handleBaseRateChange('weekend', index, 'price', parseInt(e.target.value) || 0)}
                      className={styles.priceInput}
                    />
                    <span className={styles.currency}>zł</span>
                    {weekendTiers.length > 1 && (
                      <button
                        type="button"
                        onClick={() => requestRemoveTier('weekend', index)}
                        className={styles.removeTierBtn}
                        aria-label={`Usuń przedział ${tier.minGuests}-${tier.maxGuests} osób`}
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => addTier('weekend')}
                  className={styles.addTierBtn}
                >
                  + Dodaj przedział
                </button>
              </div>
            </div>
          </div>

          {/* ── Dostawki weekday/weekend ── */}
          <div className="setting-row">
            <div className="setting-content">
              <label className="setting-label">Cena za dostawkę (dzień powszedni)</label>
              <p className="setting-description">Dodatkowa opłata za dostawkę od niedzieli do czwartku.</p>
            </div>
            <div className="setting-control">
              <div className={styles.priceControl}>
                <input
                  type="number"
                  min="0"
                  step="10"
                  value={weekdayExtraBedPrice}
                  onChange={(e) => setWeekdayExtraBedPrice(parseInt(e.target.value) || 0)}
                  className={styles.priceInputLarge}
                />
                <span className={styles.currency}>zł / noc</span>
              </div>
            </div>
          </div>

          <div className="setting-row">
            <div className="setting-content">
              <label className="setting-label">Cena za dostawkę (weekend)</label>
              <p className="setting-description">Dodatkowa opłata za dostawkę w piątki i soboty.</p>
            </div>
            <div className="setting-control">
              <div className={styles.priceControl}>
                <input
                  type="number"
                  min="0"
                  step="10"
                  value={weekendExtraBedPrice}
                  onChange={(e) => setWeekendExtraBedPrice(parseInt(e.target.value) || 0)}
                  className={styles.priceInputLarge}
                />
                <span className={styles.currency}>zł / noc</span>
              </div>
            </div>
          </div>

          {/* ── Przycisk zapisu ── */}
          <div className="form-actions">
            <button 
              type="button" 
              className="btn-primary" 
              onClick={handleSavePrices}
              disabled={isSaving}
            >
              {isSaving ? 'Zapisywanie...' : `💾 Zapisz ceny dla ${selectedProperty?.name}`}
            </button>
          </div>
        </form>
      )}

      {/* ─────────────────────────────────────────────────────
          SEKCJA 3: Ceny indywidualne (per data)
          ───────────────────────────────────────────────────── */}
      {selectedPropertyId && (
        <form className="settings-card" onSubmit={(e) => e.preventDefault()}>
          <div className="card-header">
            <h2 className="card-title">Ceny indywidualne</h2>
            <span className="card-badge">Per domek / data</span>
          </div>
          
          <div className="setting-row">
            <div className="setting-content">
              <label className="setting-label">Wybierz datę lub zakres dat</label>
              <p className="setting-description">
                Kliknij na dzień w kalendarzu, aby ustawić cenę.
                Możesz wybrać pojedynczy dzień lub zakres.
              </p>
            </div>
            <div className="setting-control">
              <div className={styles.calendarWrapper}>
                <CalendarPicker
                  dates={calendarDates}
                  onDateChange={handleDateSelect}
                  minBookingDays={0}
                  maxBookingDays={365}
                />
              </div>
              {bookingDates.start && (
                <div className={styles.selectedDateInfo}>
                  <span>
                    Wybrano: {bookingDates.start}
                    {bookingDates.end && ` — ${bookingDates.end}`}
                  </span>
                  {!bookingDates.end && (
                    <span className={styles.dayType}>
                      ({getDayType(bookingDates.start) === 'weekend' ? 'Weekend' : 'Dzień powszedni'})
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {bookingDates.start && (
            <>
              <div className="setting-row">
                <div className="setting-content">
                  <label className="setting-label" htmlFor="customPrice">Cena za dobę</label>
                  <p className="setting-description">
                    Wpisz cenę, która ma obowiązywać w wybranych datach dla tego domku.
                  </p>
                </div>
                <div className="setting-control">
                  <div className={styles.priceControl}>
                    <input
                      id="customPrice"
                      type="number"
                      min="0"
                      step="10"
                      value={customPrice}
                      onChange={(e) => setCustomPrice(parseInt(e.target.value) || 0)}
                      className={styles.priceInputLarge}
                    />
                    <span className={styles.currency}>zł / noc</span>
                  </div>
                </div>
              </div>

              <div className="setting-row">
                <div className="setting-content">
                  <label className="setting-label" htmlFor="customWeekdayExtraBedPrice">Cena za dostawkę (dzień powszedni)</label>
                </div>
                <div className="setting-control">
                  <div className={styles.priceControl}>
                    <input
                      id="customWeekdayExtraBedPrice"
                      type="number"
                      min="0"
                      step="10"
                      value={customWeekdayExtraBedPrice}
                      onChange={(e) => setCustomWeekdayExtraBedPrice(parseInt(e.target.value) || 0)}
                      className={styles.priceInputLarge}
                    />
                    <span className={styles.currency}>zł / noc</span>
                  </div>
                </div>
              </div>

              <div className="setting-row">
                <div className="setting-content">
                  <label className="setting-label" htmlFor="customWeekendExtraBedPrice">Cena za dostawkę (weekend)</label>
                </div>
                <div className="setting-control">
                  <div className={styles.priceControl}>
                    <input
                      id="customWeekendExtraBedPrice"
                      type="number"
                      min="0"
                      step="10"
                      value={customWeekendExtraBedPrice}
                      onChange={(e) => setCustomWeekendExtraBedPrice(parseInt(e.target.value) || 0)}
                      className={styles.priceInputLarge}
                    />
                    <span className={styles.currency}>zł / noc</span>
                  </div>
                </div>
              </div>

              <div className="form-actions" style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={handleSaveCustomPrice}
                  disabled={isSaving || isDeletingCustom}
                >
                  {isSaving ? 'Zapisywanie...' : '💾 Zapisz cenę dla wybranych dat'}
                </button>
                <button
                  type="button"
                  className="btn-primary"
                  style={{ backgroundColor: '#ef4444', borderColor: '#ef4444' }}
                  onClick={handleRemoveCustomPrice}
                  disabled={isSaving || isDeletingCustom}
                >
                  {isDeletingCustom ? 'Przywracanie...' : '🗑️ Przywróć cenę sezonową'}
                </button>
              </div>
            </>
          )}

          {/* Lista ustawionych cen indywidualnych */}
          {customPrices.length > 0 && (
            <div className="setting-row">
              <div className="setting-content" style={{ width: '100%' }}>
                <label className="setting-label">Ustawione ceny indywidualne dla: {selectedProperty?.name}</label>
                <div className={styles.customPricesList}>
                  {(isCustomPricesExpanded ? customPrices : customPrices.slice(0, 10)).map((entry, idx) => (
                    <div key={idx} className={styles.customPriceItem}>
                      <span className={styles.customPriceDate}>{entry.date}</span>
                      <span className={styles.customPriceValue}>{entry.price} zł</span>
                    </div>
                  ))}
                  {customPrices.length > 10 && (
                    <button
                      type="button"
                      className={styles.moreItems}
                      onClick={() => setIsCustomPricesExpanded(!isCustomPricesExpanded)}
                      style={{ border: 'none', background: 'transparent', cursor: 'pointer', textDecoration: 'underline' }}
                    >
                      {isCustomPricesExpanded ? 'Zwiń' : `+ ${customPrices.length - 10} więcej...`}
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </form>
      )}

      {/* Modal potwierdzenia usunięcia */}
      <Modal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, type: null, index: null })}
        onConfirm={confirmRemoveTier}
        title="Usuń przedział cenowy"
        confirmText="Usuń"
        cancelText="Anuluj"
        confirmVariant="danger"
      >
        <p>
          Czy na pewno chcesz usunąć ten przedział cenowy?
          Ta operacja nie może zostać cofnięta.
        </p>
      </Modal>
    </>
  )
}