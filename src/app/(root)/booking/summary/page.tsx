'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from './page.module.css';
import FloatingBackButton from '@/app/_components/FloatingBackButton/FloatingBackButton';
import { createCheckoutSession } from '@/actions/stripe';
import { BookingData } from '@/types/booking';

const STORAGE_KEY = 'wilczechatki_booking_draft';

export default function BookingSummaryPage() {
  const router = useRouter();
  const [bookingData, setBookingData] = useState<BookingData | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) {
      router.push('/booking');
      return;
    }

    try {
      const parsed: BookingData = JSON.parse(saved);
      if (!parsed.guestData?.firstName) {
        router.push('/booking/details');
        return;
      }
      setBookingData(parsed);
    } catch {
      router.push('/booking');
    }
  }, [router]);

  const handleStripePayment = async () => {
    console.log('Dane rezerwacji przed inicjowaniem płatności Stripe:');
    console.log(bookingData);
   
    return;
    if (!bookingData) return;

    setIsProcessing(true);
    try {
      const isMultiBooking = bookingData.selectedOption.propertyId === 'ALL_PROPERTIES';

      const formattedData = {
        startDate: bookingData.startDate,
        endDate: bookingData.endDate,
        clientData: {
          firstName: bookingData.guestData.firstName,
          lastName: bookingData.guestData.lastName,
          address: bookingData.guestData.address,
          email: bookingData.guestData.email,
          phone: bookingData.guestData.phone,
        },
        invoiceData: bookingData.guestData.invoice ? {
          companyName: bookingData.guestData.invoiceData?.companyName,
          nip: bookingData.guestData.invoiceData?.nip,
          street: bookingData.guestData.invoiceData?.street,
          city: bookingData.guestData.invoiceData?.city,
          postalCode: bookingData.guestData.invoiceData?.postalCode,
        } : null,
        orders: isMultiBooking
          ? bookingData.selectedOption.propertyAllocations
          : [{
            propertyId: bookingData.selectedOption.propertyId,
            displayName: bookingData.selectedOption.displayName,
            guests: bookingData.adults + bookingData.children,
            extraBeds: bookingData.extraBeds,
            totalPrice: bookingData.selectedOption.totalPrice
          }]
      };

      //console.log('Inicjowanie płatności Stripe z sformatowanymi danymi:', formattedData);

      const result = await createCheckoutSession(formattedData as any);
      if (result?.url) {
        window.location.href = result.url;
      } else {
        throw new Error("Nie można uzyskać URL sesji płatności");
      }

    } catch (error) {
      console.error('Błąd podczas inicjowania płatności:', error);
      setIsProcessing(false);
      alert('Wystąpił błąd podczas inicjowania płatności. Spróbuj ponownie: ' + error);
    }
  };

  if (!bookingData) {
    return (
      <div className={styles.container}>
        <FloatingBackButton />
        <div className={styles.loadingState}>
          <div className={styles.spinner} />
          <p>Ładowanie podsumowania...</p>
        </div>
      </div>
    );
  }

  const { startDate, endDate, adults, children, extraBeds, selectedOption, guestData } = bookingData;
  const nights = Math.ceil(
    (new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)
  );

  return (
    <div className={styles.container}>
      <FloatingBackButton />

      <header className={styles.header}>
        <h1>Podsumowanie rezerwacji</h1>
        <p>Sprawdź dane przed potwierdzeniem</p>
      </header>

      <div className={styles.summaryCard}>
        <h2 className={styles.summaryTitle}>Dane pobytu</h2>
        <div className={styles.summaryGrid}>
          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>Termin:</span>
            <span className={styles.summaryValue}>
              {startDate} — {endDate} ({nights} nocy)
            </span>
          </div>
          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>Obiekt:</span>
            <span className={styles.summaryValue}>{selectedOption?.displayName}</span>
          </div>
          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>Goście:</span>
            <span className={styles.summaryValue}>
              {adults} dorosłych, {children} dzieci
              {extraBeds > 0 && ` + ${extraBeds} dostawki`}
            </span>
          </div>
        </div>
      </div>

      <div className={styles.summaryCard}>
        <h2 className={styles.summaryTitle}>Dane kontaktowe</h2>
        <div className={styles.summaryGrid}>
          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>Imię i nazwisko:</span>
            <span className={styles.summaryValue}>{guestData.firstName} {guestData.lastName}</span>
          </div>
          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>Adres:</span>
            <span className={styles.summaryValue}>{guestData.address}</span>
          </div>
          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>Email:</span>
            <span className={styles.summaryValue}>{guestData.email}</span>
          </div>
          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>Telefon:</span>
            <span className={styles.summaryValue}>{guestData.phone}</span>
          </div>
        </div>
      </div>

      {guestData.invoice && guestData.invoiceData && (
        <div className={styles.summaryCard}>
          <h2 className={styles.summaryTitle}>Dane faktury VAT</h2>
          <div className={styles.summaryGrid}>
            <div className={styles.summaryItem}>
              <span className={styles.summaryLabel}>Nazwa firmy:</span>
              <span className={styles.summaryValue}>{guestData.invoiceData.companyName}</span>
            </div>
            <div className={styles.summaryItem}>
              <span className={styles.summaryLabel}>NIP:</span>
              <span className={styles.summaryValue}>{guestData.invoiceData.nip}</span>
            </div>
            <div className={styles.summaryItem}>
              <span className={styles.summaryLabel}>Adres:</span>
              <span className={styles.summaryValue}>
                {guestData.invoiceData.street}, {guestData.invoiceData.postalCode} {guestData.invoiceData.city}
              </span>
            </div>
          </div>
        </div>
      )}

      <div className={styles.priceCard}>
        <div className={styles.priceRow}>
          <span className={styles.priceLabel}>Cena całkowita:</span>
          <span className={styles.priceValue}>{selectedOption?.totalPrice} zł</span>
        </div>
      </div>

      <div className={styles.actions}>
        <Link href="/booking/details" className={styles.btnBack}>
          ← Edytuj dane
        </Link>
        <button
          onClick={handleStripePayment}
          className={styles.btnConfirm}
          disabled={isProcessing}
        >
          {isProcessing ? 'Przekierowywanie do płatności...' : 'Przejdź do płatności →'}
        </button>
      </div>
    </div>
  );
}