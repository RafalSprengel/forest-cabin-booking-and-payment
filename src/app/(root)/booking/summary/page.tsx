"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createCheckoutSession } from "@/actions/stripe";
import { isRangeAvailable } from '@/actions/availabilityActions'
import { toast } from 'react-hot-toast'
import Modal from '@/app/_components/Modal/Modal'
import Button from "@/app/_components/UI/Button/Button";
import FloatingBackButton from "@/app/_components/FloatingBackButton/FloatingBackButton";
import type { BookingData } from "@/types/booking";
import { formatDisplayDate } from "@/utils/formatDate";
import styles from "./page.module.css";

const STORAGE_KEY = "wilczechatki_booking_draft";

export default function BookingSummaryPage() {
  const router = useRouter();
  const [bookingData, setBookingData] = useState<BookingData | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isValidating, setIsValidating] = useState(true);
  
  const [unavailableModal, setUnavailableModal] = useState<{
    isOpen: boolean
    title: string
    occupiedNames: string[]
  }>({ isOpen: false, title: '', occupiedNames: [] });

  const verifyAvailability = async (data: BookingData): Promise<boolean> => {
    const ids = data.orders.map(o => o.propertyId);
    const result = await isRangeAvailable(data.startDate, data.endDate, ids);
    
    if (!result.available) {
      const occupied = result.occupiedPropertyIds || [];
      const occupiedNames = data.orders
        .filter((o) => occupied.includes(o.propertyId))
        .map((o) => o.displayName);
      
      setUnavailableModal({ 
        isOpen: true, 
        title: 'Termin w procesie rezerwacji, prosimy sprawdzic za 15 minut.', 
        occupiedNames 
      });
      
      return false;
    }
    
    return true;
  };

  const handleInitValidation = async (parsedData: BookingData, isMounted: boolean) => {
    try {
      const isAvailable = await verifyAvailability(parsedData);
      if (!isMounted) return;
      
      if (isAvailable) {
        setBookingData(parsedData);
      }
      setIsValidating(false);
    } catch (err) {
      console.error('Błąd sprawdzania dostępności przy wejściu:', err);
      if (!isMounted) return;

      toast.error('Wystąpił problem z połączeniem sieciowym. Nie udało się zweryfikować dostępności terminu.');
    }
  };

  useEffect(() => {
    let isMounted = true;
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) {
      router.push("/booking");
      return;
    }

    try {
      const parsed: BookingData = JSON.parse(saved);
      const hasOrders = Array.isArray(parsed.orders) && parsed.orders.length > 0;
      
      if (
        !parsed.clientData?.firstName ||
        !hasOrders ||
        !Number.isInteger(parsed.adults) ||
        parsed.adults < 1 ||
        !Number.isInteger(parsed.children) ||
        parsed.children < 0
      ) {
        router.push("/booking/details");
        return;
      }

      handleInitValidation(parsed, isMounted);

    } catch {
      router.push("/booking");
    }

    return () => {
      isMounted = false;
    };
  }, [router]);

  const handleStripePayment = async () => {
    if (!bookingData) return;

    setIsProcessing(true);

    try {
      const isAvailable = await verifyAvailability(bookingData);
      if (!isAvailable) {
        setIsProcessing(false);
        return;
      }

      localStorage.removeItem(STORAGE_KEY);
      const result = await createCheckoutSession(bookingData);
      if (result?.url) {
        window.location.href = result.url;
      } else {
        throw new Error("Nie można uzyskać URL sesji płatności");
      }
    } catch (error) {
      console.error("Błąd podczas weryfikacji lub płatności:", error);
      setIsProcessing(false);
      
      toast.error("Problem z połączeniem internetowym. Nie udało się przetworzyć płatności. Spróbuj ponownie.");
    }
  };

  if (!bookingData || isValidating) {
    return (
      <div className={styles.container}>
        <FloatingBackButton />
        <div className={styles.loadingState}>
          <div className={styles.spinner} />
          <p>{isValidating ? 'Weryfikacja dostępności...' : 'Ładowanie podsumowania...'}</p>
        </div>
      </div>
    );
  }

  const { startDate, endDate, clientData, invoiceData, orders } = bookingData;
  const totalGuests = orders.reduce((sum, item) => sum + item.guests, 0);
  const totalExtraBeds = orders.reduce((sum, item) => sum + item.extraBeds, 0);
  const totalPrice = orders.reduce((sum, item) => sum + item.price, 0);
  const orderDisplayName =
    orders.length === 1
      ? orders[0].displayName
      : `${orders.length} obiekty: ${orders.map((item) => item.displayName).join(", ")}`;
  
  const hasInvoiceData = Boolean(
    invoiceData.companyName ||
    invoiceData.nip ||
    invoiceData.street ||
    invoiceData.city ||
    invoiceData.postalCode,
  );

  const nights = Math.ceil(
    (new Date(endDate).getTime() - new Date(startDate).getTime()) /
    (1000 * 60 * 60 * 24),
  );

  return (
    <div className={styles.container}>
      <FloatingBackButton />
      <Modal
        isOpen={unavailableModal.isOpen}
        onClose={() => { 
          setUnavailableModal({ ...unavailableModal, isOpen: false }); 
        }}
        title={unavailableModal.title}
        confirmText="Wróć wyszukiwarki rezerwacji"
        cancelText="Odśwież wyniki"
        confirmVariant="warning"
        onConfirm={() => {
          localStorage.removeItem(STORAGE_KEY);
          setUnavailableModal({ ...unavailableModal, isOpen: false });
          router.push('/booking');
        }}
      >
        <p>
          {unavailableModal.occupiedNames.length > 0
            ? `Niedostępne obiekty: ${unavailableModal.occupiedNames.join(', ')}`
            : 'Wybrany termin jest już niedostępny.'}
        </p>
      </Modal>

      <header className={styles.header}>
        <h1>Podsumowanie rezerwacji</h1>
        <p>Sprawdź dane przed potwierdzeniem.</p>
      </header>

      <div className={styles.summaryCard}>
        <h2 className={styles.summaryTitle}>Dane pobytu</h2>
        <div className={styles.summaryGrid}>
          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>Termin:</span>
            <span className={styles.summaryValue}>
              {formatDisplayDate(startDate)} — {formatDisplayDate(endDate)} (
              {nights} nocy)
            </span>
          </div>
          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>Obiekt:</span>
            <span className={styles.summaryValue}>{orderDisplayName}</span>
          </div>
          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>Goście:</span>
            <span className={styles.summaryValue}>
              {totalGuests} osób
              {totalExtraBeds > 0 && ` + ${totalExtraBeds} dostawki`}
            </span>
          </div>
        </div>
      </div>

      <div className={styles.summaryCard}>
        <h2 className={styles.summaryTitle}>Dane kontaktowe</h2>
        <div className={styles.summaryGrid}>
          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>Imię i nazwisko:</span>
            <span className={styles.summaryValue}>
              {clientData.firstName} {clientData.lastName}
            </span>
          </div>
          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>Adres:</span>
            <span className={styles.summaryValue}>{clientData.address}</span>
          </div>
          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>E-mail:</span>
            <span className={styles.summaryValue}>{clientData.email}</span>
          </div>
          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>Telefon:</span>
            <span className={styles.summaryValue}>{clientData.phone}</span>
          </div>
        </div>
      </div>

      {hasInvoiceData && (
        <div className={styles.summaryCard}>
          <h2 className={styles.summaryTitle}>Dane faktury VAT</h2>
          <div className={styles.summaryGrid}>
            <div className={styles.summaryItem}>
              <span className={styles.summaryLabel}>Nazwa firmy:</span>
              <span className={styles.summaryValue}>
                {invoiceData.companyName}
              </span>
            </div>
            <div className={styles.summaryItem}>
              <span className={styles.summaryLabel}>NIP:</span>
              <span className={styles.summaryValue}>{invoiceData.nip}</span>
            </div>
            <div className={styles.summaryItem}>
              <span className={styles.summaryLabel}>Adres:</span>
              <span className={styles.summaryValue}>
                {invoiceData.street}, {invoiceData.postalCode}{" "}
                {invoiceData.city}
              </span>
            </div>
          </div>
        </div>
      )}

      <div className={styles.priceCard}>
        <div className={styles.priceRow}>
          <span className={styles.priceLabel}>Cena całkowita:</span>
          <span className={styles.priceValue}>{totalPrice} zł</span>
        </div>
      </div>

      <div className={styles.actions}>
        <Button href="/booking/details" variant="secondary">
          ← Edytuj dane
        </Button>
        <Button onClick={handleStripePayment} disabled={isProcessing}>
          {isProcessing
            ? "Przekierowywanie do płatności..."
            : "Przejdź do płatności →"}
        </Button>
      </div>
    </div>
  );
}