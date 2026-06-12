"use client";

import {
  faArrowRight,
  faExclamationCircle,
  faHome,
  faSpinner,
  faUsers,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import dayjs from "dayjs";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useEffect, useRef, useState } from "react";
import type { SearchOption, SearchResults } from "@/actions/searchActions";
import Button from "@/app/_components/UI/Button/Button";
import FloatingBackButton from "@/app/_components/FloatingBackButton/FloatingBackButton";
import { useClickOutside } from "@/hooks/useClickOutside";
import { formatDisplayDate } from "@/utils/formatDate";
import CalendarPicker, {
  type DatesData,
} from "../../_components/CalendarPicker/CalendarPicker";
import QuantityPicker from "../../_components/QuantityPicker/QuantityPicker";
import AllPropertiesCard from "./AllPropertiesCard";
import styles from "./page.module.css";
import ResultCard from "./ResultCard";
import { isRangeAvailable } from '@/actions/availabilityActions'
import Modal from '@/app/_components/Modal/Modal'
import { toast } from 'react-hot-toast'

interface BookingDates {
  start: string | null;
  end: string | null;
  count: number;
}

interface BookingOrderItem {
  propertyId: string;
  displayName: string;
  guests: number;
  adults: number;
  children: number;
  extraBeds: number;
  price: number;
}

interface CombinedOrderSelection {
  propertyId: string;
  displayName: string;
  guests: number;
  adults: number;
  children: number;
  extraBeds: number;
  price: number;
}

interface ClientData {
  firstName: string;
  lastName: string;
  address: string;
  email: string;
  phone: string;
}

interface InvoiceData {
  companyName: string;
  nip: string;
  street: string;
  city: string;
  postalCode: string;
}

interface BookingDraft {
  startDate: string;
  endDate: string;
  adults: number;
  children: number;
  clientData: ClientData;
  invoiceData: InvoiceData;
  orders: BookingOrderItem[];
}

const STORAGE_KEY = "wilczechatki_booking_draft";

interface BookingClientProps {
  initialStart: string | null;
  initialEnd: string | null;
  initialAdults: number;
  initialChildren: number;
  maxAdults: number;
  maxChildren: number;
  minBookingDays: number;
  maxBookingDays: number;
  childrenFreeAgeLimit: number;
  blockedDates: { date: string }[];
  searchResults: SearchResults | null;
}

export default function BookingClient({
  initialStart,
  initialEnd,
  initialAdults,
  initialChildren,
  maxAdults,
  maxChildren,
  minBookingDays,
  maxBookingDays,
  childrenFreeAgeLimit,
  blockedDates,
  searchResults,
}: BookingClientProps) {
  const router = useRouter();

  const [activeBox, setActiveBox] = useState<string | null>(null);
  const [adults, setAdults] = useState(initialAdults);
  const [children, setChildren] = useState(initialChildren);
  const [bookingDates, setBookingDates] = useState<BookingDates>({
    start: initialStart,
    end: initialEnd,
    count:
      initialStart && initialEnd
        ? dayjs(initialEnd).diff(dayjs(initialStart), "day")
        : 0,
  });

  const [isSearching, setIsSearching] = useState(false);
  const [extraBedsMap, setExtraBedsMap] = useState<Record<string, number>>({});
  const [guestsMap, setGuestsMap] = useState<Record<string, number>>({});
  const [childrenMap, setChildrenMap] = useState<Record<string, number>>({});
  const [hasDraft, setHasDraft] = useState(false);
  const [bookingMode, setBookingMode] = useState<"single" | "double" | null>(
    null,
  );
  const [isSeasonPriceListOpen, setIsSeasonPriceListOpen] = useState(false);
  const [unavailableModal, setUnavailableModal] = useState<{
    isOpen: boolean
    title: string
    occupiedNames: string[]
    context: 'draft' | 'single' | 'multi'
  }>({ isOpen: false, title: '', occupiedNames: [], context: 'draft' });
  const [networkModal, setNetworkModal] = useState<{
    isOpen: boolean
    title: string
    message?: string
    onRetry?: () => Promise<void>
  }>({ isOpen: false, title: '' });

  const guestsRef = useRef<HTMLDivElement>(null);
  const datesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsSearching(false);
  }, [searchResults]);

  useEffect(() => {
    setIsSeasonPriceListOpen(false);
  }, [searchResults]);

  useEffect(() => {
    if (!searchResults) {
      setBookingMode(null);
      return;
    }

    if (!searchResults.areAllAvailable) {
      setBookingMode("single");
      return;
    }

    if (searchResults.forceCombined) {
      setBookingMode("double");
      return;
    }

    setBookingMode(null);
  }, [searchResults, initialStart, initialEnd, initialAdults, initialChildren]);

  useEffect(() => {
    if (initialStart || initialEnd) {
      setBookingDates({
        start: initialStart,
        end: initialEnd,
        count:
          initialStart && initialEnd
            ? dayjs(initialEnd).diff(dayjs(initialStart), "day")
            : 0,
      });
    }
  }, [initialStart, initialEnd]);

  useEffect(() => {
    //needed to show a link with proposal to continue previous reservation
    const draft = localStorage.getItem(STORAGE_KEY);
    if (draft) {
      try {
        const parsed = JSON.parse(draft) as BookingDraft;
        if (Array.isArray(parsed.orders) && parsed.orders.length > 0) {
          setHasDraft(true);
        }
      } catch {
        setHasDraft(false);
      }
    }
  }, []);

  useClickOutside(guestsRef, () => {
    if (activeBox === "guests") setActiveBox(null);
  });

  useClickOutside(datesRef, () => {
    if (activeBox === "dates") setActiveBox(null);
  });

  const totalGuests = adults + children;
  const atMaxGuests = adults >= maxAdults;

  const toggleBox = (boxName: string) => {
    setActiveBox(activeBox === boxName ? null : boxName);
  };

  const closeAllBoxes = () => setActiveBox(null);

  const calendarDates: DatesData = {};
  blockedDates.forEach((bd) => {
    calendarDates[bd.date] = { available: false };
  });

  const handleSearch = () => {
    if (
      !bookingDates.start ||
      !bookingDates.end ||
      totalGuests === 0 ||
      adults < 1
    )
      return;

    setIsSearching(true);
    setExtraBedsMap({});
    setGuestsMap({});
    setChildrenMap({});
    closeAllBoxes();

    const params = new URLSearchParams();
    params.set("start", bookingDates.start);
    params.set("end", bookingDates.end);
    params.set("adults", adults.toString());
    params.set("children", children.toString());

    router.push(`/booking?${params.toString()}`);
  };

  const handleExtraBedsChange = (optionDisplayName: string, value: number) => {
    setExtraBedsMap((prev) => ({
      ...prev,
      [optionDisplayName]: value,
    }));
  };

  const handleGuestsChange = (optionDisplayName: string, value: number) => {
    setGuestsMap((prev) => ({
      ...prev,
      [optionDisplayName]: Math.max(1, value),
    }));
  };

  const handleChildrenChange = (optionDisplayName: string, value: number) => {
    setChildrenMap((prev) => ({
      ...prev,
      [optionDisplayName]: Math.max(0, value),
    }));
  };

  const handleConfirmBooking = (orders: BookingOrderItem[]) => {
    const draft: BookingDraft = {
      startDate: bookingDates.start!,
      endDate: bookingDates.end!,
      adults,
      children,
      clientData: {
        firstName: "",
        lastName: "",
        address: "",
        email: "",
        phone: "",
      },
      invoiceData: {
        companyName: "",
        nip: "",
        street: "",
        city: "",
        postalCode: "",
      },
      orders,
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));

    router.push("/booking/details");
  };

  const handleSingleSelect = async (option: SearchOption) => {
    if (!bookingDates.start || !bookingDates.end) return;
    try {
      const result = await isRangeAvailable(bookingDates.start, bookingDates.end, [option.propertyId]);
      if (!result.available) {
        const occupied = result.occupiedPropertyIds || [];
        const occupiedNames = occupied.includes(option.propertyId) ? [option.displayName] : [];
        console.log('termin niedostępny');
        setUnavailableModal({ isOpen: true, title: 'Termin niedostępny', occupiedNames: [...occupiedNames], context: 'single' });
        return;
      }
    } catch (err) {
      console.error('Błąd sprawdzania dostępności:', err);
      setNetworkModal({
        isOpen: true, title: 'Błąd sieci', message: 'Nie udało się sprawdzić dostępności. Spróbuj ponownie.', onRetry: async () => {
          try {
            const r = await isRangeAvailable(bookingDates.start!, bookingDates.end!, [option.propertyId]);
            if (!r.available) {
              const occupied = r.occupiedPropertyIds || [];
              const occupiedNames = occupied.includes(option.propertyId) ? [option.displayName] : [];
              setUnavailableModal({ isOpen: true, title: 'Termin niedostępny', occupiedNames: [...occupiedNames], context: 'single' });
            } else {
              const extraBeds = extraBedsMap[option.displayName] || 0;
              const totalPrice = option.totalPrice + extraBeds * option.extraBedPrice;
              handleConfirmBooking([
                {
                  propertyId: option.propertyId,
                  displayName: option.displayName,
                  guests: totalGuests,
                  adults,
                  children,
                  extraBeds,
                  price: totalPrice,
                },
              ]);
            }
          } catch (retryErr) {
            console.error('Retry failed:', retryErr);
          } finally {
            setNetworkModal({ isOpen: false, title: '' });
          }
        }
      });
      return;
    }

    const extraBeds = extraBedsMap[option.displayName] || 0;
    const totalPrice = option.totalPrice + extraBeds * option.extraBedPrice;

    handleConfirmBooking([
      {
        propertyId: option.propertyId,
        displayName: option.displayName,
        guests: totalGuests,
        adults,
        children,
        extraBeds,
        price: totalPrice,
      },
    ]);
  };

  const handleAllSelect = async (selectedOrders: CombinedOrderSelection[]) => {
    if (!bookingDates.start || !bookingDates.end) return;
    const propertyIds = selectedOrders.map(o => o.propertyId);
    try {
      const result = await isRangeAvailable(bookingDates.start, bookingDates.end, propertyIds);
      if (!result.available) {
        const occupied = result.occupiedPropertyIds || [];
        const occupiedNames = selectedOrders
          .filter(o => occupied.includes(o.propertyId))
          .map(o => o.displayName);
        setUnavailableModal({ isOpen: true, title: 'Termin niedostępny', occupiedNames: [...occupiedNames], context: 'multi' });
        return;
      }
    } catch (err) {
      console.error('Błąd sprawdzania dostępności:', err);
      setNetworkModal({
        isOpen: true, title: 'Błąd sieci', message: 'Nie udało się sprawdzić dostępności. Spróbuj ponownie.', onRetry: async () => {
          try {
            const r = await isRangeAvailable(bookingDates.start!, bookingDates.end!, propertyIds);
            if (!r.available) {
              const occupied = r.occupiedPropertyIds || [];
              const occupiedNames = selectedOrders
                .filter(o => occupied.includes(o.propertyId))
                .map(o => o.displayName);
              setUnavailableModal({ isOpen: true, title: 'Termin niedostępny', occupiedNames, context: 'multi' });
            } else {
              const orders: BookingOrderItem[] = selectedOrders.map((order) => ({
                propertyId: order.propertyId,
                displayName: order.displayName,
                guests: order.guests,
                adults: order.adults,
                children: order.children,
                extraBeds: order.extraBeds,
                price: order.price,
              }));
              handleConfirmBooking(orders);
            }
          } catch (retryErr) {
            console.error('Retry failed:', retryErr);
          } finally {
            setNetworkModal({ isOpen: false, title: '' });
          }
        }
      });
      return;
    }

    const orders: BookingOrderItem[] = selectedOrders.map((order) => ({
      propertyId: order.propertyId,
      displayName: order.displayName,
      guests: order.guests,
      adults: order.adults,
      children: order.children,
      extraBeds: order.extraBeds,
      price: order.price,
    }));

    handleConfirmBooking(orders);
  };

  const renderGuestsText = () => {
    if (totalGuests === 0) return "Wybierz ilość osób";
    const adultsText = adults === 1 ? "1 dorosły" : `${adults} dorosłych`;
    const childrenText =
      children === 0
        ? ""
        : children === 1
          ? ", 1 dziecko"
          : `, ${children} dzieci`;
    return `${adultsText}${childrenText}`;
  };

  const formatSeasonMonthDay = (dateValue: string) =>
    dayjs.utc(dateValue).format("DD.MM");

  const isSearchDisabled =
    totalGuests === 0 || !bookingDates.start || !bookingDates.end;
  const showModeSelector =
    searchResults !== null && searchResults.propertiesAvailable.length > 0;
  const singleDisabled = searchResults?.forceCombined === true;
  const doubleDisabled = searchResults?.areAllAvailable === false;
  const showSingleResults =
    !singleDisabled && (searchResults?.areAllAvailable === false || bookingMode === "single");
  const overlappingSeasons = searchResults
    ? searchResults.overlappingSeasons
    : [];
  const hasSeasonOverlap = overlappingSeasons.length > 0;
  // debug logs removed: avoid logging potentially large searchResults object
  return (
    <div className={styles.container}>
      {hasDraft && (
        <>
          <div className={styles.draftLinkContainer}>
            <button
              className={styles.draftClearBtn}
              onClick={() => {
                localStorage.removeItem(STORAGE_KEY);
                setHasDraft(false);
              }}
              aria-label="Usuń szkic rezerwacji"
            >
              ✕
            </button>
            <button
              className={styles.draftLink}
              onClick={async () => {
                const draftRaw = localStorage.getItem(STORAGE_KEY);
                if (!draftRaw) {
                  toast.error('Brak szkicu rezerwacji');
                  setHasDraft(false);
                  return;
                }
                try {
                  const draft = JSON.parse(draftRaw) as BookingDraft;
                  if (!draft.startDate || !draft.endDate || !Array.isArray(draft.orders) || draft.orders.length === 0) {
                    localStorage.removeItem(STORAGE_KEY);
                    setHasDraft(false);
                    router.push('/booking');
                    return;
                  }

                  const ids = draft.orders.map(o => o.propertyId);
                  const result = await isRangeAvailable(draft.startDate, draft.endDate, ids);
                  if (!result.available) {
                    const occupied = result.occupiedPropertyIds || [];
                    const occupiedNames = draft.orders
                      .filter(o => occupied.includes(o.propertyId))
                      .map(o => o.displayName);
                    setUnavailableModal({ isOpen: true, title: 'Termin niedostępny', occupiedNames: [...occupiedNames], context: 'draft' });
                    return;
                  }

                  router.push('/booking/details');
                } catch (err) {
                  console.error(err);
                  setNetworkModal({
                    isOpen: true, title: 'Błąd', message: 'Błąd podczas weryfikacji szkicu. Spróbuj ponownie.', onRetry: async () => {
                      try {
                        const draftRaw2 = localStorage.getItem(STORAGE_KEY);
                        if (!draftRaw2) {
                          setHasDraft(false);
                          return;
                        }
                        const draft2 = JSON.parse(draftRaw2) as BookingDraft;
                        if (!draft2.startDate || !draft2.endDate || !Array.isArray(draft2.orders) || draft2.orders.length === 0) {
                          localStorage.removeItem(STORAGE_KEY);
                          setHasDraft(false);
                          router.push('/booking');
                          return;
                        }
                        const ids2 = draft2.orders.map(o => o.propertyId);
                        const res = await isRangeAvailable(draft2.startDate, draft2.endDate, ids2);
                        if (!res.available) {
                          const occupied = res.occupiedPropertyIds || [];
                          const occupiedNames = draft2.orders
                            .filter(o => occupied.includes(o.propertyId))
                            .map(o => o.displayName);
                          setUnavailableModal({ isOpen: true, title: 'Termin niedostępny', occupiedNames, context: 'draft' });
                          return;
                        }
                        router.push('/booking/details');
                      } catch (retryErr) {
                        console.error('Retry draft check failed', retryErr);
                      } finally {
                        setNetworkModal({ isOpen: false, title: '' });
                      }
                    }
                  });
                }
              }}
            >
              <span>Kliknij aby dokończyć poprzednią rezerwację</span>
              <FontAwesomeIcon
                icon={faArrowRight}
                className={styles.draftArrow}
              />
            </button>
          </div>

        </>
      )}

      <div className={styles.head}>
        <h2>Znajdź swój termin</h2>
      </div>

      <div className={styles.searchBox}>
        <div className={styles.gestsBox}>
          <div className={styles.gests} onClick={() => toggleBox("guests")}>
            <div style={{ display: "flex", alignItems: "center" }}>
              <FontAwesomeIcon icon={faUsers} className={styles.iconSmall} />
              <span>{renderGuestsText()}</span>
            </div>
            <span style={{ fontSize: "0.8rem", color: "#aaa" }}>&#9662;</span>
          </div>

          <div
            ref={guestsRef}
            className={`${styles.setGests} ${activeBox === "guests" ? styles.expandedGests : ""}`}
          >
            <div className={styles.pickerWrap}>
              <span className={styles.label}>Dorośli i dzieci od {childrenFreeAgeLimit} lat:</span>
              <QuantityPicker
                onIncrement={() => setAdults(adults + 1)}
                onDecrement={() => setAdults(adults > 1 ? adults - 1 : 1)}
                value={adults}
                min={1}
                max={maxAdults}
                disableIncrement={atMaxGuests}
              />
            </div>
            <div className={styles.pickerWrap}>
              <span className={styles.label}>Dzieci do {childrenFreeAgeLimit} lat:</span>
              <QuantityPicker
                onIncrement={() => setChildren(children + 1)}
                onDecrement={() => setChildren(children > 0 ? children - 1 : 0)}
                value={children}
                min={0}
                max={maxChildren}
              />
            </div>
            <span className={styles.info}>
              * Dzieci do {childrenFreeAgeLimit} roku życia bezpłatnie.
            </span>
            <span className={styles.info}>
              ** Istnieje możliwość zakwaterowania dodatkowych osób na
              dostawkach na dalszym etapie rezerwacji.
            </span>
            <Button variant="secondary" onClick={closeAllBoxes}>
              Gotowe
            </Button>
          </div>
        </div>

        <div className={styles.dateBox}>
          <div className={styles.date} onClick={() => toggleBox("dates")}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                width: "100%",
              }}
            >
              <span>
                {bookingDates.start && bookingDates.end
                  ? `${formatDisplayDate(bookingDates.start)} — ${formatDisplayDate(bookingDates.end)} (nocy: ${bookingDates.count})`
                  : "Wybierz daty"}
              </span>
              <span style={{ fontSize: "0.8rem", color: "#aaa" }}>&#9662;</span>
            </div>
          </div>

          <div
            ref={datesRef}
            className={`${styles.setDate} ${activeBox === "dates" ? styles.expandedDate : ""}`}
          >
            <CalendarPicker
              dates={calendarDates}
              onDateChange={setBookingDates}
              minBookingDays={minBookingDays}
              maxBookingDays={maxBookingDays}
            />
            <Button variant="secondary" onClick={closeAllBoxes}>
              Gotowe
            </Button>
          </div>
        </div>

        <Button
          disabled={isSearchDisabled || isSearching}
          onClick={handleSearch}
        >
          {isSearching ? <FontAwesomeIcon icon={faSpinner} spin /> : "Szukaj"}
        </Button>
      </div>

      <div className={styles.resultsContainer}>
        {isSearching && (
          <div className={styles.loadingState}>
            <FontAwesomeIcon
              icon={faSpinner}
              spin
              className={styles.spinIcon}
            />
            <p>Sprawdzam dostępność domków...</p>
          </div>
        )}

        {(adults !== initialAdults ||
          children !== initialChildren ||
          bookingDates.start !== initialStart ||
          bookingDates.end !== initialEnd) &&
          searchResults &&
          searchResults.propertiesAvailable && (
            <div className={styles.emptyState}>
              {(adults !== initialAdults || children !== initialChildren) && (
                <p>Zmieniłeś liczbę osób.</p>
              )}
              {(bookingDates.start !== initialStart ||
                bookingDates.end !== initialEnd) && (
                  <p>Zmieniłeś wyszukiwane daty.</p>
                )}
              <p>Kliknij "Szukaj" ponownie, aby odświeżyć wyniki.</p>
            </div>
          )}

        {!isSearching &&
          searchResults &&
          searchResults.propertiesAvailable &&
          adults === initialAdults &&
          children === initialChildren &&
          bookingDates.start === initialStart &&
          bookingDates.end === initialEnd && (
            <>
              {hasSeasonOverlap &&
                searchResults.propertiesAvailable.length > 0 && (
                  <>
                    <div
                      className={styles.seasonAlert}
                      role="status"
                      aria-live="polite"
                    >
                      <strong>Uwaga!</strong> Twoja rezerwacja obejmuje dni w
                      sezonie wysokim:
                      <br></br>{" "}
                      {overlappingSeasons.map((season, index) => {
                        const seasonRange = `${formatSeasonMonthDay(season.startDate)} - ${formatSeasonMonthDay(season.endDate)}`;
                        const separator =
                          index < overlappingSeasons.length - 1 ? ", " : "";
                        return (
                          <React.Fragment key={season.seasonId}>
                            <span>
                              "{season.name} ({seasonRange})"{separator}
                            </span>
                            <br></br>
                          </React.Fragment>
                        );
                      })}
                      Ceny w tym okresie mogą być wyższe niż w okresie poza
                      sezonem.
                      <div className={styles.seasonAlertAction}>
                        <button
                          type="button"
                          className={styles.seasonLinkButton}
                          onClick={() =>
                            setIsSeasonPriceListOpen((prev) => !prev)
                          }
                          aria-expanded={isSeasonPriceListOpen}
                        >
                          Kliknij tutaj,
                        </button>
                        <span>aby zobaczyć ceny w sezonie wysokim.</span>
                      </div>
                    </div>

                    {isSeasonPriceListOpen && (
                      <div className={styles.seasonPricePanel}>
                        {overlappingSeasons.map((season) => (
                          <section
                            key={season.seasonId}
                            className={styles.seasonPriceSection}
                          >
                            <h4 className={styles.seasonPriceHeading}>
                              {season.name} (
                              {formatSeasonMonthDay(season.startDate)} -{" "}
                              {formatSeasonMonthDay(season.endDate)})
                            </h4>

                            {season.prices.length === 0 && (
                              <p className={styles.seasonNoPrices}>
                                Brak zdefiniowanego cennika sezonowego dla
                                dostępnych domków.
                              </p>
                            )}

                            {season.prices.map((price) => (
                              <div
                                key={`${season.seasonId}-${price.propertyId}`}
                                className={styles.seasonPriceCard}
                              >
                                <h5 className={styles.seasonPriceProperty}>
                                  {price.displayName}
                                </h5>
                                <div className={styles.seasonTableTitle}>
                                  Cennik za dobę:
                                </div>

                                <div className={styles.seasonTableBlock}>
                                  <div className={styles.seasonTableHeader}>
                                    W tygodniu
                                  </div>
                                  {price.weekdayPrices.map((tier) => (
                                    <div
                                      key={`wd-${price.propertyId}-${tier.minGuests}-${tier.maxGuests}`}
                                      className={styles.seasonRow}
                                    >
                                      <span>
                                        {tier.minGuests}-{tier.maxGuests} osób
                                      </span>
                                      <span>{tier.price} zł</span>
                                    </div>
                                  ))}
                                  <div className={styles.seasonRow}>
                                    <span>Dostawka</span>
                                    <span>
                                      +{price.weekdayExtraBedPrice} zł
                                    </span>
                                  </div>
                                </div>

                                <div className={styles.seasonTableBlock}>
                                  <div className={styles.seasonTableHeader}>
                                    Weekendy
                                  </div>
                                  {price.weekendPrices.map((tier) => (
                                    <div
                                      key={`we-${price.propertyId}-${tier.minGuests}-${tier.maxGuests}`}
                                      className={styles.seasonRow}
                                    >
                                      <span>
                                        {tier.minGuests}-{tier.maxGuests} osób
                                      </span>
                                      <span>{tier.price} zł</span>
                                    </div>
                                  ))}
                                  <div className={styles.seasonRow}>
                                    <span>Dostawka</span>
                                    <span>
                                      +{price.weekendExtraBedPrice} zł
                                    </span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </section>
                        ))}
                      </div>
                    )}
                  </>
                )}
              {(() => {
                if (searchResults?.propertiesAvailable.length === 0) {
                  return (
                    <div className={styles.emptyState}>
                      <FontAwesomeIcon
                        icon={faExclamationCircle}
                        className={styles.emptyIcon}
                      />
                      <h3>Brak wolnych terminów</h3>
                      <p>
                        Niestety dla wybranej liczby gości i dat nie mamy
                        dostępnych domków.
                      </p>
                      <p>Spróbuj zmienić daty lub zmniejszyć liczbę osób.</p>
                    </div>
                  );
                }
                return (
                  <div className={styles.resultsGrid}>
                    <h3 className={styles.resultsTitle}>
                      Dostępne opcje ({searchResults.propertiesAvailable.length}
                      )
                    </h3>
                    {showModeSelector && (
                      <div
                        className={styles.modeSelector}
                        role="radiogroup"
                        aria-label="Tryb rezerwacji"
                      >
                        <label
                          className={`${styles.modeOption} ${bookingMode === "single" ? styles.modeOptionActive : ""} ${singleDisabled ? styles.modeOptionDisabled : ""}`}
                        >
                          <input
                            type="radio"
                            name="bookingMode"
                            checked={bookingMode === "single"}
                            disabled={singleDisabled}
                            onChange={() => setBookingMode("single")}
                          />
                          <span className={styles.modeLabel}>Jeden domek</span>
                          <span
                            className={styles.modeIconSingle}
                            aria-hidden="true"
                          >
                            <FontAwesomeIcon icon={faHome} />
                          </span>
                        </label>

                        <label
                          className={`${styles.modeOption} ${bookingMode === "double" ? styles.modeOptionActive : ""} ${doubleDisabled ? styles.modeOptionDisabled : ""}`}
                        >
                          <input
                            type="radio"
                            name="bookingMode"
                            checked={bookingMode === "double"}
                            disabled={doubleDisabled}
                            onChange={() => {
                              setBookingMode("double");
                              setGuestsMap((prev) => {
                                const next = { ...prev };
                                searchResults.propertiesAvailable.forEach(
                                  (option) => {
                                    const current = next[option.displayName];
                                    next[option.displayName] =
                                      current && current > 0 ? current : 1;
                                  },
                                );
                                return next;
                              });
                            }}
                          />
                          <span className={styles.modeLabel}>Dwa domki</span>
                          <span
                            className={styles.modeIconDouble}
                            aria-hidden="true"
                          >
                            <span className={styles.modeHomeBack}>
                              <FontAwesomeIcon icon={faHome} />
                            </span>
                            <span className={styles.modeHomeFront}>
                              <FontAwesomeIcon icon={faHome} />
                            </span>
                          </span>
                        </label>
                      </div>
                    )}
                    {showSingleResults &&
                      searchResults.propertiesAvailable.map((option) => (
                        <ResultCard
                          key={option.propertyId}
                          option={option}
                          extraBeds={extraBedsMap[option.displayName] || 0}
                          onExtraBedsChange={handleExtraBedsChange}
                          onSelect={handleSingleSelect}
                          childrenFreeAgeLimit={childrenFreeAgeLimit}
                        />
                      ))}

                    {showModeSelector &&
                      bookingMode === "double" &&
                      searchResults.areAllAvailable && (
                        <div className={styles.allAvailableNote}>
                          <AllPropertiesCard
                            searchResults={searchResults}
                            extraBedsMap={extraBedsMap}
                            onExtraBedsChange={handleExtraBedsChange}
                            guestsMap={guestsMap}
                            onGuestsChange={handleGuestsChange}
                            totalGuestsLimit={adults}
                            childrenMap={childrenMap}
                            onChildrenChange={handleChildrenChange}
                            totalChildrenLimit={children}
                            startDate={bookingDates.start}
                            endDate={bookingDates.end}
                            onSelectAll={handleAllSelect}
                            childrenFreeAgeLimit={childrenFreeAgeLimit}
                          />
                        </div>
                      )}
                  </div>
                );
              })()}
            </>
          )}
      </div>
      <Modal
        isOpen={unavailableModal.isOpen}
        onClose={() => {
          setUnavailableModal({ ...unavailableModal, isOpen: false });
          router.refresh();
        }}
        title={unavailableModal.title}
        confirmText="Ok"
        // cancelText="Odśwież wyniki"
        confirmVariant="warning"
        onConfirm={() => {
          if (unavailableModal.context === 'draft') {
            localStorage.removeItem(STORAGE_KEY);
            setHasDraft(false);
          }
          setUnavailableModal({ ...unavailableModal, isOpen: false });
          router.refresh();
        }}
        modalSize="default"
      >
        <p>Proszę wybrać inny termin lub spróbować później.</p>
      </Modal>
      <Modal
        isOpen={networkModal.isOpen}
        onClose={() => setNetworkModal({ ...networkModal, isOpen: false })}
        title={networkModal.title}
        confirmText="Spróbuj ponownie"
        cancelText="Anuluj"
        confirmVariant="warning"
        onConfirm={async () => { if (networkModal.onRetry) await networkModal.onRetry(); setNetworkModal({ ...networkModal, isOpen: false }); }}
      >
        <p>{networkModal.message ?? 'Wystąpił błąd sieciowy.'}</p>
      </Modal>
    </div>
  );
}
