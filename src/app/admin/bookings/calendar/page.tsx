'use client'
import { useEffect, useState, useMemo, useRef } from 'react'
import dayjs from 'dayjs'
import 'dayjs/locale/pl'
import isBetween from 'dayjs/plugin/isBetween'
import customParseFormat from 'dayjs/plugin/customParseFormat'
import { getCalendarData, CalendarDay, BookingDetails } from '@/actions/getCalendarData'
import { getAllProperties } from '@/actions/adminPropertyActions'
import styles from './page.module.css'
import AdminShell from '../../_components/AdminShell/AdminShell'

dayjs.extend(isBetween)
dayjs.extend(customParseFormat)
dayjs.locale('pl')

const MONTH_NAMES = [
  'Styczeń', 'Luty', 'Marzec', 'Kwiecień', 'Maj', 'Czerwiec',
  'Lipiec', 'Sierpień', 'Wrzesień', 'Październik', 'Listopad', 'Grudzień'
]

const TooltipWrapper = ({ children }: { children: React.ReactNode }) => {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const parent = el.parentElement
    if (!parent) return

    const reposition = () => {
      el.style.position = 'fixed'
      el.style.left = '50%'
      el.style.right = ''
      el.style.top = '0'
      el.style.bottom = ''
      el.style.transform = 'translateX(-50%)'
      el.style.marginTop = ''
      el.classList.remove(styles.tooltipFlipped)
      el.style.removeProperty('--arrow-left')

      const parentRect = parent.getBoundingClientRect()
      const pad = 8
      const tooltipRect = el.getBoundingClientRect()
      const tooltipWidth = tooltipRect.width
      const baseLeft = parentRect.left + parentRect.width / 2

      if (baseLeft - tooltipWidth / 2 < pad) {
        el.style.left = `${pad}px`
        el.style.transform = 'translateX(0)'
      } else if (baseLeft + tooltipWidth / 2 > window.innerWidth - pad) {
        el.style.left = 'auto'
        el.style.right = `${pad}px`
        el.style.transform = 'translateX(0)'
      } else {
        el.style.left = `${baseLeft}px`
        el.style.transform = 'translateX(-50%)'
      }

      const aboveTop = parentRect.top - tooltipRect.height - 8
      if (aboveTop < pad) {
        el.style.top = `${parentRect.bottom + 8}px`
        el.classList.add(styles.tooltipFlipped)
      } else {
        el.style.top = `${aboveTop}px`
      }

      const finalTooltipRect = el.getBoundingClientRect()
      const parentCenterX = parentRect.left + parentRect.width / 2
      const arrowLeft = Math.max(16, Math.min(parentCenterX - finalTooltipRect.left, finalTooltipRect.width - 16))
      el.style.setProperty('--arrow-left', `${arrowLeft}px`)
    }

    parent.addEventListener('mouseenter', reposition)
    parent.addEventListener('touchstart', reposition, { passive: true })
    window.addEventListener('scroll', reposition, true)
    window.addEventListener('resize', reposition)

    return () => {
      parent.removeEventListener('mouseenter', reposition)
      parent.removeEventListener('touchstart', reposition)
      window.removeEventListener('scroll', reposition, true)
      window.removeEventListener('resize', reposition)
    }
  }, [])

  return (
    <div ref={containerRef} className={styles.tooltipContainer}>
      {children}
    </div>
  )
}

const BookingTooltip = ({ details }: { details: BookingDetails }) => {
  if (!details) return null
  const isAdminBlocked = details.status === 'blocked' && details.source === 'admin'

  if (isAdminBlocked) {
    return (
      <div className={styles.tooltip}>
        <div className={styles.tooltipHeader}>
          <h4 className={styles.guestNameText}>Zabl. przez admina</h4>
          <span className={`${styles.badge} ${styles.badgeBlocked}`}>ZABLOKOWANA</span>
        </div>
        <div className={styles.tooltipRow}>
          <span className={styles.label}>🗓️ Termin:</span>
          <span className={styles.valueText}>{(() => {
            const s = dayjs(details.startDate, 'DD.MM.YYYY')
            const e = dayjs(details.endDate, 'DD.MM.YYYY')
            if (!s.isValid()) return details.startDate
            if (details.durationDays === 1) return s.format('D MMMM YYYY')
            if (s.isSame(e, 'month') && s.isSame(e, 'year')) return `${s.format('D')}-${e.format('D')} ${e.format('MMMM YYYY')}`
            return `${s.format('D MMMM YYYY')} - ${e.format('D MMMM YYYY')}`
          })()}</span>
        </div>
        <div className={styles.tooltipRow}>
          <span className={styles.label}>📝 Notatka:</span>
          <span className={styles.valueText}>{details.adminNotes?.trim() || '-'}</span>
        </div>
      </div>
    )
  }

  const isPaid = details.paymentStatus === 'paid'
  const isDeposit = details.paidAmount > 0 && !isPaid
  const paymentClass = isPaid ? styles.paymentPaid : isDeposit ? styles.paymentDeposit : styles.paymentUnpaid
  const paymentLabel = isPaid
    ? 'Opłacone'
    : isDeposit
      ? `Zaliczka (${details.paidAmount.toFixed(2)} PLN)`
      : 'Nieopłacone'
  const statusBadgeText = details.status === 'confirmed' ? 'POTWIERDZONA' : details.status === 'pending' ? 'Klient jest w trakcie rezerwacji...' : 'ZABLOKOWANA'
  const extraBedsText = details.extraBeds && details.extraBeds > 0 ? `${details.extraBeds} dostawka` : '0'

  return (
    <div className={styles.tooltip}>
      <div className={styles.tooltipHeader}>
        <h4 className={styles.guestNameText}>{`${details.firstName || ''} ${details.lastName || ''}`.trim()}</h4>
        <span className={`${styles.badge} ${details.status === 'pending' ? styles.badgePending : ''}`}>{statusBadgeText}</span>
      </div>
      <div className={styles.tooltipRow}>
        <span className={styles.label}>🧾 Zamówienie nr:</span>
        <span className={styles.valueText}>{details.orderId ? details.orderId : '-'}</span>
      </div>
      <div className={styles.tooltipRow}>
        <span className={styles.label}>🗓️ Termin:</span>
        <span className={styles.valueText}>{(() => {
          const s = dayjs(details.startDate, 'DD.MM.YYYY')
          const e = dayjs(details.endDate, 'DD.MM.YYYY')
          if (!s.isValid() || !e.isValid()) return `${details.startDate} - ${details.endDate}`
          if (s.isSame(e, 'month') && s.isSame(e, 'year')) return `${s.format('D')}-${e.format('D')} ${e.format('MMMM YYYY')}`
          return `${s.format('D MMMM YYYY')} - ${e.format('D MMMM YYYY')}`
        })()}</span>
      </div>
      <div className={styles.tooltipRow}>
        <span className={styles.label}>🌙 Ilość nocy:</span>
        <span className={styles.valueText}>{details.durationDays}</span>
      </div>
      <div className={styles.tooltipRow}>
        <span className={styles.label}>👨‍👩‍👧 Dorośli:</span>
        <span className={styles.valueText}>{details.adults}</span>
      </div>
      <div className={styles.tooltipRow}>
        <span className={styles.label}>🧒 Dzieci (bezpłatnie):</span>
        <span className={styles.valueText}>{details.children}</span>
      </div>
      <div className={styles.tooltipRow}>
        <span className={styles.label}>🛏️ Dostawki:</span>
        <span className={styles.valueText}>{extraBedsText}</span>
      </div>
      <div className={styles.tooltipRow}>
        <span className={styles.label}>💳 Płatność:</span>
        <span className={`${styles.valueText} ${paymentClass}`}>{paymentLabel}</span>
      </div>
      <div className={styles.tooltipRow}>
        <span className={styles.label}>💰 Cena:</span>
        <span className={`${styles.valueText} ${styles.priceValue}`}>{details.totalPrice.toFixed(2)} PLN</span>
      </div>
      <div className={styles.tooltipSection}>
        <div className={styles.tooltipRow}>
          <span className={styles.label}>📧 E-mail:</span>
          <span className={styles.valueText}>{details.guestEmail}</span>
        </div>
        <div className={styles.tooltipRow}>
          <span className={styles.label}>📞 Telefon:</span>
          <span className={styles.valueText}>{details.guestPhone}</span>
        </div>
      </div>
    </div>
  )
}

export default function Calendar() {
  const [data, setData] = useState<CalendarDay[]>([])
  const [cabinNames, setCabinNames] = useState<{ id: string; name: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [currentView, setCurrentView] = useState(dayjs().startOf('month'))

  const years = useMemo(() => Array.from({ length: 5 }, (_, i) => dayjs().year() - 1 + i), [])

  useEffect(() => {
    const loadProperties = async () => {
      const props = await getAllProperties()
      setCabinNames(props.map(p => ({ id: p._id, name: p.name })))
    }
    loadProperties()
  }, [])

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      const calendarData = await getCalendarData(currentView.daysInMonth(), currentView.format('YYYY-MM-DD'))
      setData(calendarData)
      setLoading(false)
    }
    loadData()
  }, [currentView])

  return (
    <AdminShell title="Kalendarz">

      <div className={styles.headerControls}>
        <button onClick={() => setCurrentView(prev => prev.subtract(1, 'month'))} className={styles.navButton}>&#8249;</button>
        <select value={currentView.month()} onChange={e => setCurrentView(currentView.month(Number(e.target.value)))} className={styles.selectInput}>
          {MONTH_NAMES.map((name, i) => <option key={name} value={i}>{name}</option>)}
        </select>
        <select value={currentView.year()} onChange={e => setCurrentView(currentView.year(Number(e.target.value)))} className={styles.selectInput}>
          {years.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
        <button onClick={() => setCurrentView(prev => prev.add(1, 'month'))} className={styles.navButton}>&#8250;</button>
      </div>

      <div className={styles.tableWrapper}>
        <table className={styles.calendarTable}>
          <thead>
            <tr>
              <th className={styles.stickyCol}>Data</th>
              {cabinNames.map(c => <th key={c.id}>{c.name}</th>)}
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={Math.max(2, cabinNames.length + 1)} className={styles.loadingStateCell}>
                  <div className={styles.loadingState}>
                    <span className={styles.loadingSpinner} aria-hidden="true"></span>
                    <span>Wczytywanie...</span>
                  </div>
                </td>
              </tr>
            )}
            {!loading && data.map((row) => {
              const date = dayjs(row.date)
              const isPast = date.isBefore(dayjs(), 'day')
              return (
                <tr key={row.date} className={isPast ? styles.pastRow : ''}>
                  <td className={`${styles.stickyCol} ${styles.dateCell} ${[0, 6].includes(date.day()) ? styles.weekendCell : ''}`}>
                    <div className={styles.dateContent}>
                      <span className={styles.dateDay}>{row.datePL}</span>
                      <span className={styles.dateWeekday}>({date.format('ddd')})</span>
                    </div>
                  </td>
                  {cabinNames.map(cabin => {
                    const cell = row.cabins[cabin.id]
                    if (!cell || cell.status === 'free') {
                      return <td key={cabin.id} className={styles.free}><span className={styles.statusText}>Wolny</span></td>
                    }

                    if (cell.status === 'booked' || cell.status === 'blocked_sys') {
                      return (
                        <td key={cabin.id} className={styles.cell} style={{ backgroundColor: isPast ? '#f5f5f5' : cell.details?.color }}>
                          <span className={styles.statusText}>{cell.status === 'booked' ? 'Zajęty' : 'Zablokowany'}</span>
                          <TooltipWrapper><BookingTooltip details={cell.details!} /></TooltipWrapper>
                        </td>
                      )
                    }

                    return (
                      <td key={cabin.id} className={styles.splitCellContainer}>
                        <div className={styles.splitWrapper}>
                          <div
                            className={`${styles.half} ${cell.checkoutDetails ? styles.bookedHalf : styles.freeHalf}`}
                            style={{ backgroundColor: (!isPast && cell.checkoutDetails) ? cell.checkoutDetails.color : '' }}
                          >
                            <span className={styles.halfText}>{cell.checkoutDetails ? 'OUT' : 'Wolny'}</span>
                            {cell.checkoutDetails && <TooltipWrapper><BookingTooltip details={cell.checkoutDetails} /></TooltipWrapper>}
                          </div>
                          <div
                            className={`${styles.half} ${cell.checkinDetails ? styles.bookedHalf : styles.freeHalf}`}
                            style={{ backgroundColor: (!isPast && cell.checkinDetails) ? cell.checkinDetails.color : '' }}
                          >
                            <span className={styles.halfText}>{cell.checkinDetails ? 'IN' : 'Wolny'}</span>
                            {cell.checkinDetails && <TooltipWrapper><BookingTooltip details={cell.checkinDetails} /></TooltipWrapper>}
                          </div>
                        </div>
                      </td>
                    )
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </AdminShell>
  )
}