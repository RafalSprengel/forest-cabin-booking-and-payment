'use client'

import { useEffect, useState } from 'react';
import { getCalendarData, CalendarDay, BookingDetails } from '@/actions/getCalendarData';
import styles from './page.module.css';

const WEEK_DAY_NAMES = {
  pl: ['Nd', 'Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'So'],
  en: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
};

const CURRENT_LANG = 'pl';

const MONTH_NAMES = [
  'Styczeń', 'Luty', 'Marzec', 'Kwiecień', 'Maj', 'Czerwiec',
  'Lipiec', 'Sierpień', 'Wrzesień', 'Październik', 'Listopad', 'Grudzień'
];

const BookingTooltip = ({ details }: { details: BookingDetails }) => {
  if (!details) return null;

  return (
    <div className={styles.tooltip}>
      <div className={styles.tooltipHeader}>
        <h4 className={styles.guestNameText}>{details.guestName}</h4>
        <span className={styles.badge}>{details.status === 'confirmed' ? 'Potwierdzona' : 'Zablokowana'}</span>
      </div>

      <div className={styles.tooltipRow}>
        <span className={styles.label}>📅 Termin:</span>
        <span className={styles.valueText}>{details.startDate} do {details.endDate} <br /><small>({details.durationDays} dni)</small></span>
      </div>

      <div className={styles.tooltipRow}>
        <span className={styles.label}>👥 Goście:</span>
        <span className={styles.valueText}>{details.numberOfGuests} osób</span>
      </div>

      <div className={styles.tooltipRow}>
        <span className={styles.label}>💰 Cena:</span>
        <span className={`${styles.valueText} ${styles.priceValue}`}>{details.totalPrice.toFixed(2)} PLN</span>
      </div>

      <div className={styles.tooltipSection}>
        <div className={styles.tooltipRow}>
          <span className={styles.label}>📧 Email:</span>
          <a href={`mailto:${details.guestEmail}`} className={`${styles.valueText} ${styles.contactValue} ${styles.clickableLink}`}>
            {details.guestEmail}
          </a>
        </div>
        <div className={styles.tooltipRow}>
          <span className={styles.label}>📞 Telefon:</span>
          <a href={`tel:${details.guestPhone}`} className={`${styles.valueText} ${styles.contactValue} ${styles.clickableLink}`}>
            {details.guestPhone}
          </a>
        </div>
      </div>
    </div>
  );
};

export default function Calendar() {
  const [data, setData] = useState<CalendarDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const currentDate = new Date();
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth());

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
        const startDate = new Date(selectedYear, selectedMonth, 1);
        const startDateStr = startDate.toISOString().split('T')[0];

        const calendarData = await getCalendarData(daysInMonth, startDateStr);
        setData(calendarData);
      } catch (err) {
        console.error(err);
        setError('Nie udało się załadować kalendarza.');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [selectedYear, selectedMonth]);

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 10 }, (_, i) => currentYear - 2 + i);

  const handlePrevMonth = () => {
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear(selectedYear - 1);
    } else {
      setSelectedMonth(selectedMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear(selectedYear + 1);
    } else {
      setSelectedMonth(selectedMonth + 1);
    }
  };

  //if (loading) return <div className={styles.container}>Ładowanie kalendarza...</div>;
  if (error) return <div className={styles.container}>{error}</div>;
  if (data.length === 0) return <div className={styles.container}>Brak danych.</div>;

  const cabinIds = Object.keys(data[0].cabins);

  const getDayInfo = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00');
    const dayIndex = date.getDay();
    const dayName = WEEK_DAY_NAMES[CURRENT_LANG][dayIndex];

    let dayClass = '';
    if (dayIndex === 0 || dayIndex === 6) {
      dayClass = styles.weekendCell;
    }

    return { dayName, dayClass, dayIndex };
  };

  return (
    <div className={styles.container}>
      <div className={styles.headerControls}>
        {/* Przycisk Poprzedni Miesiąc */}
        <button onClick={handlePrevMonth} className={styles.navButton} title="Poprzedni miesiąc">
          &#8249;
        </button>

        <select
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(Number(e.target.value))}
          className={styles.selectInput}
          aria-label="Wybierz miesiąc"
        >
          {MONTH_NAMES.map((name, index) => (
            <option key={name} value={index}>{name}</option>
          ))}
        </select>

        <select
          value={selectedYear}
          onChange={(e) => setSelectedYear(Number(e.target.value))}
          className={styles.selectInput}
          aria-label="Wybierz rok"
        >
          {years.map((year) => (
            <option key={year} value={year}>{year}</option>
          ))}
        </select>

        {/* Przycisk Następny Miesiąc */}
        <button onClick={handleNextMonth} className={styles.navButton} title="Następny miesiąc">
          &#8250;
        </button>
      </div>

      <div className={styles.tableWrapper}>
        <table className={styles.calendarTable}>
          <thead>
            <tr>
              <th className={styles.stickyCol}>Data</th>
              {cabinIds.map((id, idx) => (
                <th key={id}>Domek {idx + 1}</th>
              ))}
            </tr>
          </thead>
          {(loading) ? (
            <tbody>
              <tr>
                <td colSpan={cabinIds.length + 1}>Ładowanie...</td>
              </tr>
            </tbody>
          ) :
            <tbody>
              {data.map((row) => {
                const { dayName, dayClass } = getDayInfo(row.date);

                return (
                  <tr key={row.date}>
                    <td className={`${styles.stickyCol} ${styles.dateCell} ${dayClass}`}>
                      <div className={styles.dateContent}>
                        <span className={styles.dateDay}>{row.datePL}</span>
                        <span className={styles.dateWeekday}>({dayName})</span>
                      </div>
                    </td>
                    {cabinIds.map((id) => {
                      const cellData = row.cabins[id];

                      if (!cellData) {
                        return (
                          <td key={id} className={`${styles.cell} ${styles.free}`}>
                            <span>Wolny</span>
                          </td>
                        );
                      }

                      const hasDetails = cellData.status === 'booked' || cellData.status === 'cleaning';

                      let statusText = '';
                      let cellClass = styles.cell;

                      switch (cellData.status) {
                        case 'booked': statusText = 'Zajęty'; cellClass += ` ${styles.booked}`; break;
                        case 'cleaning': statusText = 'Sprzątanie'; cellClass += ` ${styles.cleaning}`; break;
                        case 'blocked_sys': statusText = 'Zabl.'; cellClass += ` ${styles.blockedSys}`; break;
                        default: statusText = 'Wolny'; cellClass += ` ${styles.free}`;
                      }

                      return (
                        <td
                          key={id}
                          className={cellClass}
                          style={{ position: hasDetails ? 'relative' : 'static' }}
                        >
                          <span className={styles.statusText}>{statusText}</span>

                          {hasDetails && cellData.details && (
                            <div className={styles.tooltipContainer}>
                              <BookingTooltip details={cellData.details} />
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          }

        </table>
      </div>

      <div className={styles.legend}>
        <span><span className={`${styles.dot} ${styles.bookedDot}`}></span> Zajęty</span>
        <span><span className={`${styles.dot} ${styles.cleaningDot}`}></span> Sprzątanie</span>
        <span><span className={`${styles.dot} ${styles.blockedSysDot}`}></span> Zabl. (Auto)</span>
        <span><span className={`${styles.dot} ${styles.freeDot}`}></span> Wolny</span>
      </div>
    </div>
  );
}