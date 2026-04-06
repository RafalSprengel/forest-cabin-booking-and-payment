'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  updateBasicPrices,
  updateSeasonPricesForProperty,
  getPricesForProperty,
} from '@/actions/seasonActions'
import {
  updateCustompriceForDate,
  getCustomPrices,
  deleteCustomPricesForDate,
} from '@/actions/priceConfigActions'
import CalendarPicker, { DatesData } from '@/app/_components/CalendarPicker/CalendarPicker'
import dayjs from 'dayjs'
import Modal from '@/app/_components/Modal/Modal'
import { toast, Toaster } from 'react-hot-toast'
import '../settings/settings.css'
import styles from './page.module.css'

interface PropertyOption {
  _id: string
  name: string
  baseCapacity: number
  maxExtraBeds: number
}

interface PriceTier {
  minGuests: number
  maxGuests: number
  price: number
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

type TierField = keyof PriceTier

interface TierValidationError {
  index: number
  fields: TierField[]
  message: string
}

function normalizeAndValidateTiers(
  tiers: PriceTier[],
  label: 'weekday' | 'weekend'
): {
  isValid: boolean
  sorted: PriceTier[]
  message?: string
  errors?: TierValidationError[]
} {
  if (tiers.length === 0) {
    return {
      isValid: false,
      sorted: [],
      message:
        label === 'weekday'
          ? 'Dodaj przynajmniej jeden przedzial dla dni powszednich.'
          : 'Dodaj przynajmniej jeden przedzial dla weekendu.',
    }
  }

  const sorted = [...tiers].sort((a, b) => a.minGuests - b.minGuests)

  for (let i = 0; i < sorted.length; i += 1) {
    const tier = sorted[i]

    if (
      !Number.isInteger(tier.minGuests) ||
      !Number.isInteger(tier.maxGuests) ||
      !Number.isInteger(tier.price)
    ) {
      return {
        isValid: false,
        sorted,
        message: 'Wszystkie pola przedzialow musza byc liczbami calkowitymi.',
        errors: [
          {
            index: i,
            fields: ['minGuests', 'maxGuests', 'price'],
            message: 'Wszystkie pola musza byc liczbami calkowitymi.',
          },
        ],
      }
    }

    if (tier.minGuests < 1 || tier.maxGuests < 1) {
      return {
        isValid: false,
        sorted,
        message: 'Zakres gosci musi zaczynac sie od co najmniej 1 osoby.',
        errors: [
          {
            index: i,
            fields: ['minGuests', 'maxGuests'],
            message: 'Pole Od i Do musi miec wartosc co najmniej 1.',
          },
        ],
      }
    }

    if (tier.minGuests > tier.maxGuests) {
      return {
        isValid: false,
        sorted,
        message: `Nieprawidlowy przedzial: od ${tier.minGuests} do ${tier.maxGuests}.`,
        errors: [
          {
            index: i,
            fields: ['minGuests', 'maxGuests'],
            message: 'Wartosc Od nie moze byc wieksza niz Do.',
          },
        ],
      }
    }

    if (tier.price < 0) {
      return {
        isValid: false,
        sorted,
        message: 'Cena nie moze byc ujemna.',
        errors: [
          {
            index: i,
            fields: ['price'],
            message: 'Cena nie moze byc ujemna.',
          },
        ],
      }
    }

    if (i > 0) {
      const prev = sorted[i - 1]
      if (tier.minGuests <= prev.maxGuests) {
        return {
          isValid: false,
          sorted,
          message: `Przedzialy nakladaja sie: ${prev.minGuests}-${prev.maxGuests} i ${tier.minGuests}-${tier.maxGuests}.`,
          errors: [
            {
              index: i - 1,
              fields: ['maxGuests'],
              message: 'Ten zakres nachodzi na kolejny przedzial.',
            },
            {
              index: i,
              fields: ['minGuests'],
              message: 'Ten zakres nachodzi na poprzedni przedzial.',
            },
          ],
        }
      }
    }
  }

  return { isValid: true, sorted }
}

export default function PriceSettingsForm({
  properties,
  childrenFreeAgeLimit,
  seasons,
}: Props) {
  // ── Selekcja ────────────────────────────────────────────────────────────────
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>('')
  const [selectedSeasonId, setSelectedSeasonId] = useState<string>(OFF_SEASON_ID)

  // ── Formularz cen ───────────────────────────────────────────────────────────
  const [weekdayTiers, setWeekdayTiers] = useState<PriceTier[]>([])
  const [weekendTiers, setWeekendTiers] = useState<PriceTier[]>([])
  const [weekdayExtraBedPrice, setWeekdayExtraBedPrice] = useState<number>(50)
  const [weekendExtraBedPrice, setWeekendExtraBedPrice] = useState<number>(70)

  // ── Ceny indywidualne (per data) ────────────────────────────────────────────
  const [bookingDates, setBookingDates] = useState<BookingDates>({
    start: null,
    end: null,
    count: 0,
  })
  const [customPrice, setCustomPrice] = useState<number>(300)
  const [customPrices, setCustomPrices] = useState<CustomPriceEntry[]>([])
  const [customWeekdayExtraBedPrice, setCustomWeekdayExtraBedPrice] = useState<number>(50)
  const [customWeekendExtraBedPrice, setCustomWeekendExtraBedPrice] = useState<number>(70)
  const [calendarPrices, setCalendarPrices] = useState<Record<string, number>>({})
  const [selectedDateForPrice, setSelectedDateForPrice] = useState<string | null>(null)

  // ── UI state ─────────────────────────────────────────────────────────────────
  const [isSaving, setIsSaving] = useState(false)
  const [isDeletingCustom, setIsDeletingCustom] = useState(false)
  const [isCustomPricesExpanded, setIsCustomPricesExpanded] = useState(false)
  const [isLoadingPrices, setIsLoadingPrices] = useState(false)
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean
    type: 'weekday' | 'weekend' | null
    index: number | null
  }>({ isOpen: false, type: null, index: null })
  const [tierErrors, setTierErrors] = useState<{
    weekday: TierValidationError[]
    weekend: TierValidationError[]
  }>({ weekday: [], weekend: [] })

  // ── Ładuj ceny z PropertyPrices gdy zmieni się domek lub sezon ───────────────
  useEffect(() => {
    if (!selectedPropertyId) return

    const loadPrices = async () => {
      setIsLoadingPrices(true)
      try {
        // Jedno zapytanie – wszystkie rekordy dla domku
        const allPrices = await getPricesForProperty(selectedPropertyId)

        // seasonId === null → basicPrices
        const basicPrices = allPrices.find(
          (p: any) => p.seasonId === null || p.seasonId === undefined
        )

        // Mapa sezonowa
        const seasonMap = new Map<string, any>(
          allPrices
            .filter((p: any) => p.seasonId != null)
            .map((p: any) => [p.seasonId, p])
        )

        if (selectedSeasonId === OFF_SEASON_ID) {
          if (basicPrices) {
            setWeekdayTiers(basicPrices.weekdayPrices ?? [])
            setWeekendTiers(basicPrices.weekendPrices ?? [])
            setWeekdayExtraBedPrice(basicPrices.weekdayExtraBedPrice ?? 50)
            setWeekendExtraBedPrice(basicPrices.weekendExtraBedPrice ?? 70)
          } else {
            setWeekdayTiers([{ minGuests: 1, maxGuests: 3, price: 300 }])
            setWeekendTiers([{ minGuests: 1, maxGuests: 3, price: 400 }])
            setWeekdayExtraBedPrice(50)
            setWeekendExtraBedPrice(70)
          }
        } else {
          const seasonPrices = seasonMap.get(selectedSeasonId)
          if (seasonPrices) {
            setWeekdayTiers(seasonPrices.weekdayPrices ?? [])
            setWeekendTiers(seasonPrices.weekendPrices ?? [])
            setWeekdayExtraBedPrice(seasonPrices.weekdayExtraBedPrice ?? 50)
            setWeekendExtraBedPrice(seasonPrices.weekendExtraBedPrice ?? 70)
          } else {
            setWeekdayTiers([{ minGuests: 1, maxGuests: 3, price: 300 }])
            setWeekendTiers([{ minGuests: 1, maxGuests: 3, price: 400 }])
            setWeekdayExtraBedPrice(50)
            setWeekendExtraBedPrice(70)
          }
        }
        setTierErrors({ weekday: [], weekend: [] })
      } catch (err) {
        console.error('Błąd ładowania cen:', err)
        toast.error('Nie udało się załadować cen')
      } finally {
        setIsLoadingPrices(false)
      }
    }

    loadPrices()
  }, [selectedPropertyId, selectedSeasonId])

  // ── Ładuj custom prices gdy zmieni się domek ─────────────────────────────────
  useEffect(() => {
    if (!selectedPropertyId) return

    const loadCustomPrices = async () => {
      const prices = await getCustomPrices(selectedPropertyId)
      setCustomPrices(prices)
      const priceMap: Record<string, number> = {}
      prices.forEach((p) => {
        priceMap[p.date] = p.price
      })
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

  // ── Handlers przedziałów cenowych ────────────────────────────────────────────

  const handleBaseRateChange = (
    type: 'weekday' | 'weekend',
    index: number,
    field: keyof PriceTier,
    value: number
  ) => {
    const setter = type === 'weekend' ? setWeekendTiers : setWeekdayTiers
    setTierErrors((prev) => ({ ...prev, [type]: [] }))
    setter((prev) => {
      const updated = [...prev]
      updated[index] = { ...updated[index], [field]: value }
      return updated
    })
  }

  const addTier = (type: 'weekday' | 'weekend') => {
    const tiers = type === 'weekend' ? weekendTiers : weekdayTiers
    const setter = type === 'weekend' ? setWeekendTiers : setWeekdayTiers

    if (tiers.length === 0) {
      setTierErrors((prev) => ({ ...prev, [type]: [] }))
      setter([{ minGuests: 1, maxGuests: 3, price: type === 'weekend' ? 400 : 300 }])
      return
    }

    const last = tiers[tiers.length - 1]
    setTierErrors((prev) => ({ ...prev, [type]: [] }))
    setter((prev) => [
      ...prev,
      { minGuests: last.maxGuests + 1, maxGuests: last.maxGuests + 2, price: last.price + 100 },
    ])
  }

  const requestRemoveTier = (type: 'weekday' | 'weekend', index: number) => {
    setDeleteModal({ isOpen: true, type, index })
  }

  const confirmRemoveTier = () => {
    if (deleteModal.type && deleteModal.index !== null) {
      const setter = deleteModal.type === 'weekend' ? setWeekendTiers : setWeekdayTiers
      setTierErrors((prev) => ({ ...prev, [deleteModal.type!]: [] }))
      setter((prev) => prev.filter((_, i) => i !== deleteModal.index))
      setDeleteModal({ isOpen: false, type: null, index: null })
    }
  }

  const getTierError = (type: 'weekday' | 'weekend', index: number) =>
    tierErrors[type].find((error) => error.index === index)

  // ── Zapis cen sezonowych/basic ───────────────────────────────────────────────

  const handleSavePrices = async () => {
    if (!selectedPropertyId) {
      toast.error('Wybierz domek')
      return
    }

    const weekdayValidation = normalizeAndValidateTiers(weekdayTiers, 'weekday')
    if (!weekdayValidation.isValid) {
      setWeekdayTiers(weekdayValidation.sorted)
      setTierErrors((prev) => ({
        ...prev,
        weekday: weekdayValidation.errors ?? [],
      }))
      toast.error(weekdayValidation.message ?? 'Nieprawidlowe przedzialy dla dni powszednich.')
      return
    }
    setTierErrors((prev) => ({ ...prev, weekday: [] }))

    const weekendValidation = normalizeAndValidateTiers(weekendTiers, 'weekend')
    if (!weekendValidation.isValid) {
      setWeekendTiers(weekendValidation.sorted)
      setTierErrors((prev) => ({
        ...prev,
        weekend: weekendValidation.errors ?? [],
      }))
      toast.error(weekendValidation.message ?? 'Nieprawidlowe przedzialy dla weekendu.')
      return
    }
    setTierErrors((prev) => ({ ...prev, weekend: [] }))

    // Keep UI consistent with what is persisted.
    setWeekdayTiers(weekdayValidation.sorted)
    setWeekendTiers(weekendValidation.sorted)

    setIsSaving(true)
    try {
      const formData = new FormData()
      formData.append('propertyId', selectedPropertyId)
      formData.append('weekdayTiers', JSON.stringify(weekdayValidation.sorted))
      formData.append('weekendTiers', JSON.stringify(weekendValidation.sorted))
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
          const season = seasons.find((s) => s._id === selectedSeasonId)
          toast.success(`Zapisano ceny dla: ${season?.name ?? 'sezonu'}`)
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

  // ── Ceny indywidualne (per data) ─────────────────────────────────────────────

  const handleDateSelect = useCallback(
    (dates: BookingDates) => {
      setBookingDates((prev) => {
        if (prev.start === dates.start && prev.end === dates.end) return prev
        return dates
      })

      if (dates.start && !dates.end) {
        setSelectedDateForPrice(dates.start)
        const priceEntry = customPrices.find((p) => p.date === dates.start)
        if (priceEntry) {
          setCustomPrice(priceEntry.price)
          setCustomWeekdayExtraBedPrice(priceEntry.weekdayExtraBedPrice ?? 50)
          setCustomWeekendExtraBedPrice(priceEntry.weekendExtraBedPrice ?? 70)
        }
      }
    },
    [customPrices]
  )

  const refreshCustomPrices = async () => {
    const prices = await getCustomPrices(selectedPropertyId)
    setCustomPrices(prices)
    const priceMap: Record<string, number> = {}
    prices.forEach((p) => {
      priceMap[p.date] = p.price
    })
    setCalendarPrices(priceMap)
  }

  const buildDateRange = (): string[] => {
    if (!bookingDates.start) return []
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
    return dates
  }

  const handleSaveCustomPrice = async () => {
    if (!selectedPropertyId || !bookingDates.start) return

    setIsSaving(true)
    try {
      const result = await updateCustompriceForDate({
        propertyId: selectedPropertyId,
        dates: buildDateRange(),
        price: customPrice,
        weekdayExtraBedPrice: customWeekdayExtraBedPrice,
        weekendExtraBedPrice: customWeekendExtraBedPrice,
      })

      if (result?.success) {
        toast.success(result.message)
        await refreshCustomPrices()
        setBookingDates({ start: null, end: null, count: 0 })
        setSelectedDateForPrice(null)
      } else {
        toast.error(result?.message ?? 'Błąd zapisu')
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
      const result = await deleteCustomPricesForDate({
        propertyId: selectedPropertyId,
        dates: buildDateRange(),
      })

      if (result?.success) {
        toast.success(result.message)
        await refreshCustomPrices()
        setBookingDates({ start: null, end: null, count: 0 })
        setSelectedDateForPrice(null)
      } else {
        toast.error(result?.message ?? 'Błąd usuwania')
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

  const selectedProperty = properties.find((p) => p._id === selectedPropertyId)
  const selectedSeason = seasons.find((s) => s._id === selectedSeasonId)

  return (
    <>
      <Toaster position="bottom-right" />

      {/* ── Wybór domku ──────────────────────────────────────────────────────── */}
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
                setSelectedSeasonId(OFF_SEASON_ID)
              }}
              className="date-input"
              style={{ padding: '8px', fontSize: '1rem', minWidth: '200px' }}
            >
              <option value="">-- Wybierz domek --</option>
              {properties.map((prop) => (
                <option key={prop._id} value={prop._id}>
                  {prop.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </form>

      {/* ── Konfiguracja cen (tylko gdy wybrany domek) ───────────────────────── */}
      {selectedPropertyId && (
        <form className="settings-card" onSubmit={(e) => e.preventDefault()}>
          <div className="card-header">
            <h2 className="card-title">Konfiguracja cen sezonów</h2>
            <div className="setting-control" style={{ marginLeft: 'auto' }}>
              <select
                value={selectedSeasonId}
                onChange={(e) => setSelectedSeasonId(e.target.value)}
                className="date-input"
                style={{ padding: '8px', fontSize: '1rem' }}
                disabled={isLoadingPrices}
              >
                <option value={OFF_SEASON_ID}>🌿 Poza sezonem (ceny bazowe)</option>
                {seasons.map((season) => (
                  <option key={season._id} value={season._id}>
                    {season.name} {!season.isActive && '(nieaktywny)'}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Nagłówek kontekstu */}
          <div
            className="setting-row"
            style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}
          >
            <div className="setting-content">
              <strong>
                {isLoadingPrices
                  ? 'Ładowanie cen...'
                  : selectedSeasonId === OFF_SEASON_ID
                  ? `Ceny podstawowe dla: ${selectedProperty?.name}`
                  : `Ceny w sezonie "${selectedSeason?.name}" dla: ${selectedProperty?.name}`}
              </strong>
            </div>
          </div>

          {/* Cena weekday */}
          <div className="setting-row">
            <div className="setting-content">
              <label className="setting-label">
                Cena za dobę – Dzień powszedni (nd–czw)
              </label>
              <p className="setting-description">
                Ustaw przedziały: od ilu osób do ilu osób i za jaką cenę.
              </p>
            </div>
            <div className="setting-control">
              <div className={styles.tiersContainer}>
                {weekdayTiers.map((tier, index) => {
                  const tierError = getTierError('weekday', index)
                  return (
                  <div key={index} className={styles.tierRowWrapper}>
                  <div className={`${styles.tierRow} ${tierError ? styles.tierRowError : ''}`}>
                    <label className={styles.tierField}>
                      <span className={styles.tierFieldLabel}>Od</span>
                      <input
                        type="number"
                        min="1"
                        step="1"
                        value={tier.minGuests}
                        onChange={(e) =>
                          handleBaseRateChange(
                            'weekday',
                            index,
                            'minGuests',
                            parseInt(e.target.value, 10) || 1
                          )
                        }
                        className={`${styles.tierInput} ${tierError?.fields.includes('minGuests') ? styles.tierInputError : ''}`}
                        disabled={isLoadingPrices}
                      />
                    </label>
                    <label className={styles.tierField}>
                      <span className={styles.tierFieldLabel}>Do</span>
                      <input
                        type="number"
                        min="1"
                        step="1"
                        value={tier.maxGuests}
                        onChange={(e) =>
                          handleBaseRateChange(
                            'weekday',
                            index,
                            'maxGuests',
                            parseInt(e.target.value, 10) || 1
                          )
                        }
                        className={`${styles.tierInput} ${tierError?.fields.includes('maxGuests') ? styles.tierInputError : ''}`}
                        disabled={isLoadingPrices}
                      />
                    </label>
                    <label className={styles.tierField}>
                      <span className={styles.tierFieldLabel}>Cena</span>
                    <input
                      type="number"
                      min="0"
                      step="10"
                      value={tier.price}
                      onChange={(e) =>
                        handleBaseRateChange(
                          'weekday',
                          index,
                          'price',
                          parseInt(e.target.value) || 0
                        )
                      }
                      className={`${styles.priceInput} ${tierError?.fields.includes('price') ? styles.tierInputError : ''}`}
                      disabled={isLoadingPrices}
                    />
                    </label>
                    <span className={styles.currency}>zł</span>
                    {weekdayTiers.length > 1 && (
                      <button
                        type="button"
                        onClick={() => requestRemoveTier('weekday', index)}
                        className={styles.removeTierBtn}
                        disabled={isLoadingPrices}
                      >
                        ✕
                      </button>
                    )}
                  </div>
                  {tierError && <p className={styles.tierErrorText}>{tierError.message}</p>}
                  </div>
                )})}
                <button
                  type="button"
                  onClick={() => addTier('weekday')}
                  className={styles.addTierBtn}
                  disabled={isLoadingPrices}
                >
                  + Dodaj przedział
                </button>
              </div>
            </div>
          </div>

          {/* Cena weekend */}
          <div className="setting-row">
            <div className="setting-content">
              <label className="setting-label">
                Cena za dobę – Weekend (pt–sob)
              </label>
              <p className="setting-description">
                Ustaw przedziały: od ilu osób do ilu osób i za jaką cenę.
              </p>
            </div>
            <div className="setting-control">
              <div className={styles.tiersContainer}>
                {weekendTiers.map((tier, index) => {
                  const tierError = getTierError('weekend', index)
                  return (
                  <div key={index} className={styles.tierRowWrapper}>
                  <div className={`${styles.tierRow} ${tierError ? styles.tierRowError : ''}`}>
                    <label className={styles.tierField}>
                      <span className={styles.tierFieldLabel}>Od</span>
                      <input
                        type="number"
                        min="1"
                        step="1"
                        value={tier.minGuests}
                        onChange={(e) =>
                          handleBaseRateChange(
                            'weekend',
                            index,
                            'minGuests',
                            parseInt(e.target.value, 10) || 1
                          )
                        }
                        className={`${styles.tierInput} ${tierError?.fields.includes('minGuests') ? styles.tierInputError : ''}`}
                        disabled={isLoadingPrices}
                      />
                    </label>
                    <label className={styles.tierField}>
                      <span className={styles.tierFieldLabel}>Do</span>
                      <input
                        type="number"
                        min="1"
                        step="1"
                        value={tier.maxGuests}
                        onChange={(e) =>
                          handleBaseRateChange(
                            'weekend',
                            index,
                            'maxGuests',
                            parseInt(e.target.value, 10) || 1
                          )
                        }
                        className={`${styles.tierInput} ${tierError?.fields.includes('maxGuests') ? styles.tierInputError : ''}`}
                        disabled={isLoadingPrices}
                      />
                    </label>
                    <label className={styles.tierField}>
                      <span className={styles.tierFieldLabel}>Cena</span>
                    <input
                      type="number"
                      min="0"
                      step="10"
                      value={tier.price}
                      onChange={(e) =>
                        handleBaseRateChange(
                          'weekend',
                          index,
                          'price',
                          parseInt(e.target.value) || 0
                        )
                      }
                      className={`${styles.priceInput} ${tierError?.fields.includes('price') ? styles.tierInputError : ''}`}
                      disabled={isLoadingPrices}
                    />
                    </label>
                    <span className={styles.currency}>zł</span>
                    {weekendTiers.length > 1 && (
                      <button
                        type="button"
                        onClick={() => requestRemoveTier('weekend', index)}
                        className={styles.removeTierBtn}
                        disabled={isLoadingPrices}
                      >
                        ✕
                      </button>
                    )}
                  </div>
                  {tierError && <p className={styles.tierErrorText}>{tierError.message}</p>}
                  </div>
                )})}
                <button
                  type="button"
                  onClick={() => addTier('weekend')}
                  className={styles.addTierBtn}
                  disabled={isLoadingPrices}
                >
                  + Dodaj przedział
                </button>
              </div>
            </div>
          </div>

          {/* Dostawka weekday */}
          <div className="setting-row">
            <div className="setting-content">
              <label className="setting-label">Cena za dostawkę (dzień powszedni)</label>
            </div>
            <div className="setting-control">
              <div className={styles.priceControl}>
                <input
                  type="number"
                  min="0"
                  step="10"
                  value={weekdayExtraBedPrice}
                  onChange={(e) =>
                    setWeekdayExtraBedPrice(parseInt(e.target.value) || 0)
                  }
                  className={styles.priceInputLarge}
                  disabled={isLoadingPrices}
                />
                <span className={styles.currency}>zł / noc</span>
              </div>
            </div>
          </div>

          {/* Dostawka weekend */}
          <div className="setting-row">
            <div className="setting-content">
              <label className="setting-label">Cena za dostawkę (weekend)</label>
            </div>
            <div className="setting-control">
              <div className={styles.priceControl}>
                <input
                  type="number"
                  min="0"
                  step="10"
                  value={weekendExtraBedPrice}
                  onChange={(e) =>
                    setWeekendExtraBedPrice(parseInt(e.target.value) || 0)
                  }
                  className={styles.priceInputLarge}
                  disabled={isLoadingPrices}
                />
                <span className={styles.currency}>zł / noc</span>
              </div>
            </div>
          </div>

          {/* Przycisk zapisu */}
          <div className="form-actions">
            <button
              type="button"
              className="btn-primary"
              onClick={handleSavePrices}
              disabled={isSaving || isLoadingPrices}
            >
              {isSaving
                ? 'Zapisywanie...'
                : `💾 Zapisz ceny dla ${selectedProperty?.name}`}
            </button>
          </div>
        </form>
      )}

      {/* ── Ceny indywidualne (per data) ─────────────────────────────────────── */}
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
                Kliknij na dzień w kalendarzu, aby ustawić cenę. Możesz wybrać
                pojedynczy dzień lub zakres.
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
                      (
                      {getDayType(bookingDates.start) === 'weekend'
                        ? 'Weekend'
                        : 'Dzień powszedni'}
                      )
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
                  <label className="setting-label" htmlFor="customPrice">
                    Cena za dobę
                  </label>
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
                  <label className="setting-label">
                    Cena za dostawkę (dzień powszedni)
                  </label>
                </div>
                <div className="setting-control">
                  <div className={styles.priceControl}>
                    <input
                      type="number"
                      min="0"
                      step="10"
                      value={customWeekdayExtraBedPrice}
                      onChange={(e) =>
                        setCustomWeekdayExtraBedPrice(parseInt(e.target.value) || 0)
                      }
                      className={styles.priceInputLarge}
                    />
                    <span className={styles.currency}>zł / noc</span>
                  </div>
                </div>
              </div>

              <div className="setting-row">
                <div className="setting-content">
                  <label className="setting-label">Cena za dostawkę (weekend)</label>
                </div>
                <div className="setting-control">
                  <div className={styles.priceControl}>
                    <input
                      type="number"
                      min="0"
                      step="10"
                      value={customWeekendExtraBedPrice}
                      onChange={(e) =>
                        setCustomWeekendExtraBedPrice(parseInt(e.target.value) || 0)
                      }
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
                <label className="setting-label">
                  Ustawione ceny indywidualne dla: {selectedProperty?.name}
                </label>
                <div className={styles.customPricesList}>
                  {(isCustomPricesExpanded
                    ? customPrices
                    : customPrices.slice(0, 10)
                  ).map((entry, idx) => (
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
                      style={{
                        border: 'none',
                        background: 'transparent',
                        cursor: 'pointer',
                        textDecoration: 'underline',
                      }}
                    >
                      {isCustomPricesExpanded
                        ? 'Zwiń'
                        : `+ ${customPrices.length - 10} więcej...`}
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </form>
      )}

      {/* Modal potwierdzenia usunięcia przedziału */}
      <Modal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, type: null, index: null })}
        onConfirm={confirmRemoveTier}
        title="Usuń przedział cenowy"
        confirmText="Usuń"
        cancelText="Anuluj"
        confirmVariant="danger"
      >
        <p>Czy na pewno chcesz usunąć ten przedział cenowy?</p>
      </Modal>
    </>
  )
}
