'use client';

import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronDown } from '@fortawesome/free-solid-svg-icons';
import Button from '@/app/_components/UI/Button/Button';
import DeletePastBookingButton from './DeletePastBookingButton';
import styles from './page.module.css';
import { formatGuestName, getPaymentBadge, getStatusLabel } from './utils';

interface Booking {
  _id: string;
  startDate: string;
  endDate: string;
  firstName?: string;
  lastName?: string;
  guestEmail?: string;
  propertyName?: string;
  orderId?: string;
  adults?: number;
  children?: number;
  extraBedsCount?: number;
  totalPrice?: number;
  invoice?: boolean;
  paymentMethod?: string;
  paymentStatus?: string;
  paidAmount?: number;
  status?: string;
  createdAt?: string;
  source?: string;
}

interface BookingAccordionListProps {
  bookings: Booking[];
  isPast?: boolean;
}

function toNumber(value: number | string | undefined) {
  return typeof value === 'number' ? value : Number(value || 0);
}

export default function BookingAccordionList({ bookings, isPast }: BookingAccordionListProps) {
  const [activeBookingId, setActiveBookingId] = useState<string | null>(null);

  return (
    <div className={styles.cardsList}>
      {bookings.map((booking) => {
        const start = new Date(booking.startDate);
        const end = new Date(booking.endDate);
        const nights = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
        const statusKey = booking.status ? booking.status.charAt(0).toUpperCase() + booking.status.slice(1) : 'Pending';
        const statusLabel = getStatusLabel(booking.status);
        const paidAmount = toNumber(booking.paidAmount);
        const totalPrice = toNumber(booking.totalPrice);
        const remainingAmount = totalPrice - paidAmount;
        const paymentBadge = getPaymentBadge(booking.paymentStatus || '', paidAmount, totalPrice);
        const isFullyPaid = booking.paymentStatus === 'paid' || (totalPrice > 0 && paidAmount >= totalPrice);
        const bookingId = booking._id;
        const isExpanded = activeBookingId === bookingId;
        const createdAtDate = booking.createdAt ? new Date(booking.createdAt) : null;

        return (
          <article key={bookingId} className={`${styles.bookingCard} ${isPast ? styles.pastCard : ''}`}>
            <button
              type="button"
              className={styles.bookingHeaderButton}
              onClick={() => setActiveBookingId((current) => (current === bookingId ? null : bookingId))}
              aria-expanded={isExpanded}
              aria-controls={`booking-panel-${bookingId}`}
            >
              <div className={styles.bookingHeader}>
                <span className={styles.dateLabel}>Rezerwacja:&nbsp;</span>
                <span className={styles.dateValue}>
                  {start.toLocaleDateString('pl-PL')} - {end.toLocaleDateString('pl-PL')}
                </span>
              </div>
              <span className={styles.accordionIcon} aria-hidden="true">
                <FontAwesomeIcon icon={faChevronDown} className={`${styles.icon} ${isExpanded ? styles.iconExpanded : ''}`} />
              </span>
            </button>

            <h3 className={styles.guestName}>{formatGuestName(`${booking.firstName || ''} ${booking.lastName || ''}`)}</h3>
            <div className={styles.guestEmail}>{booking.guestEmail || '-'}</div>
            <div className={styles.propertyName}>{booking.propertyName || 'Domek'}</div>

            <div id={`booking-panel-${bookingId}`} className={`${styles.bookingPanel} ${isExpanded ? styles.bookingPanelOpen : styles.bookingPanelClosed}`}>
              <div className={styles.detailRow}>
                <span className={styles.label}>Zamówienie nr:</span>
                <span className={styles.value}>{booking.orderId ? booking.orderId : 'Brak numeru'}</span>
              </div>

              <div className={styles.detailsGrid}>
                <div className={styles.detailRow}>
                  <span className={styles.label}>Ilość nocy:</span>
                  <span className={styles.value}>{nights}</span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.label}>Dorośli:</span>
                  <span className={styles.value}>{booking.adults}</span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.label}>Dzieci (bezpłatnie):</span>
                  <span className={styles.value}>{booking.children}</span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.label}>Dostawki:</span>
                  <span className={styles.value}>{booking.extraBedsCount}</span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.label}>Cena:</span>
                  <span className={styles.value}>{totalPrice.toFixed(2)} zł</span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.label}>Faktura VAT:</span>
                  <span className={styles.value}>{booking.invoice ? 'Tak' : 'Nie'}</span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.label}>Rodzaj płatności:</span>
                  <span className={styles.value}>{booking.paymentMethod === 'online' ? 'Online' : 'Gotówka / Przelew'}</span>
                </div>
                {isFullyPaid ? (
                  <div className={styles.detailRow}>
                    <span className={styles.label}>Status płatności:</span>
                    <span className={`${styles.value} ${styles.paymentPaid}`}>Opłacono</span>
                  </div>
                ) : (
                  <> 
                    <div className={styles.detailRow}>
                      <span className={styles.label}></span>
                      <div className={styles.priceBreakdown}>
                        <span className={styles.pricePaid}>Wpłacono: {paidAmount.toFixed(2)} zł</span>
                        <span className={styles.priceDue}>Do zapłaty: {remainingAmount.toFixed(2)} zł</span>
                      </div>
                    </div>
                    <div className={styles.detailRow}>
                      <span className={styles.label}>Status płatności:</span>
                      <span className={`${styles.value} ${styles[paymentBadge.class]}`}>
                        {paymentBadge.text}
                      </span>
                    </div>
                  </>
                )}
              </div>

              <div className={styles.cardFooter}>
                <span className={`${styles.badge} ${styles[`badge${statusKey}`]}`}>{statusLabel}</span>
                <span className={styles.addedDate}>
                  dodano: {createdAtDate ? `${createdAtDate.toLocaleDateString('pl-PL')} ${createdAtDate.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })}` : '-'}
                </span>
                {isPast ? <DeletePastBookingButton bookingId={bookingId} /> : <Button variant="secondary" href={`/admin/bookings/list/${bookingId}`} className={styles.editBtn}>Szczegóły</Button>}
              </div>
              {booking.source === 'admin' && (
                <div className={styles.adminBubble}>Rezerwacja dokonana przez panel admina.</div>
              )}
            </div>
          </article>
        );
      })}
    </div>
  );
}
