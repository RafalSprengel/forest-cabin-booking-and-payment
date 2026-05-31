"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { toast } from "react-hot-toast";
import type {
  AdminPaymentStatus,
  AdminPaymentsData,
  AdminPaymentTab,
} from "@/actions/adminPaymentActions";
import { syncOnlinePaymentAction } from "@/actions/adminPaymentActions";
import Button from "@/app/_components/UI/Button/Button";
import styles from "./page.module.css";

interface PaymentsPanelProps {
  initialData: AdminPaymentsData;
  mode: AdminPaymentTab;
}

function formatStatus(status: string): string {
  if (status === "confirmed") {
    return "Potwierdzone";
  }

  if (status === "failed") {
    return "Odrzucone (failed)";
  }

  return "Oczekujące (pending)";
}

function formatMethod(method: "online" | "cash" | "transfer"): string {
  if (method === "cash" || method === "transfer") {
    return "Gotówka / Przelew";
  }

  return "Online";
}

function getActiveFilterClass(
  status: AdminPaymentStatus,
  styles: Record<string, string>,
): string {
  if (status === "confirmed") {
    return styles.paymentsPanelFilterBtnActiveConfirmed;
  }

  if (status === "failed") {
    return styles.paymentsPanelFilterBtnActiveFailed;
  }

  if (status === "all") {
    return styles.paymentsPanelFilterBtnActiveAll;
  }

  return styles.paymentsPanelFilterBtnActivePending;
}

export default function PaymentsPanel({
  initialData,
  mode,
}: PaymentsPanelProps) {
  const router = useRouter();
  const [statusFilter, setStatusFilter] =
    useState<AdminPaymentStatus>("confirmed");
  const [orderSearch, setOrderSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Drag-to-scroll
  const tableWrapRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartX = useRef(0);
  const scrollStartX = useRef(0);

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (tableWrapRef.current && e.button === 0) {
      setIsDragging(true);
      dragStartX.current = e.pageX;
      scrollStartX.current = tableWrapRef.current.scrollLeft;
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isDragging && tableWrapRef.current) {
      const dx = e.pageX - dragStartX.current;
      tableWrapRef.current.scrollLeft = scrollStartX.current - dx;
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(orderSearch);
    }, 400);
    return () => clearTimeout(timer);
  }, [orderSearch]);

  const rows = mode === "online" ? initialData.online : initialData.offline;

  const filteredRows = useMemo(() => {
    const rowsByMode =
      mode === "online"
        ? rows.filter((row) =>
            statusFilter === "all" ? true : row.status === statusFilter,
          )
        : rows;

    const normalizedQuery = debouncedSearch.trim().toLowerCase();

    if (normalizedQuery.length === 0) {
      return rowsByMode;
    }

    return rowsByMode.filter((row) => {
      const orderIdMatch =
        typeof row.orderId === "string" &&
        row.orderId.toLowerCase().includes(normalizedQuery);
      const fullName = `${(row.firstName || '')} ${(row.lastName || '')}`.trim();
      const guestNameMatch = fullName.length > 0 && fullName.toLowerCase().includes(normalizedQuery);

      return orderIdMatch || guestNameMatch;
    });
  }, [rows, statusFilter, mode, debouncedSearch]);

  const onSync = (bookingId: string) => {
    setSyncingId(bookingId);

    startTransition(async () => {
      const result = await syncOnlinePaymentAction(bookingId);

      if (result.level === "success") {
        toast.success(result.message);
      }

      if (result.level === "info") {
        toast(result.message);
      }

      if (result.level === "error") {
        toast.error(result.message);
      }

      setSyncingId(null);
      router.refresh();
    });
  };

  return (
    <section className={styles.paymentsPanel}>
      <h2>
        {mode === "online" ? "Płatności online" : "Gotówka / Przelew"}
      </h2>

      {mode === "online" ? (
        <div className={styles.paymentsPanelFiltersWrap}>
          <div
            className={styles.paymentsPanelFilters}
            role="radiogroup"
            aria-label="Filtr statusu"
          >
            <button
              type="button"
              role="radio"
              aria-checked={statusFilter === "confirmed"}
              className={`${styles.paymentsPanelFilterBtn} ${statusFilter === "confirmed" ? getActiveFilterClass("confirmed", styles) : ""}`}
              onClick={() => setStatusFilter("confirmed")}
            >
              Potwierdzone
            </button>
            <button
              type="button"
              role="radio"
              aria-checked={statusFilter === "failed"}
              className={`${styles.paymentsPanelFilterBtn} ${statusFilter === "failed" ? getActiveFilterClass("failed", styles) : ""}`}
              onClick={() => setStatusFilter("failed")}
            >
              Odrzucone
            </button>
            <button
              type="button"
              role="radio"
              aria-checked={statusFilter === "pending"}
              className={`${styles.paymentsPanelFilterBtn} ${statusFilter === "pending" ? getActiveFilterClass("pending", styles) : ""}`}
              onClick={() => setStatusFilter("pending")}
            >
              Oczekujące
            </button>
            <button
              type="button"
              role="radio"
              aria-checked={statusFilter === "all"}
              className={`${styles.paymentsPanelFilterBtn} ${statusFilter === "all" ? getActiveFilterClass("all", styles) : ""}`}
              onClick={() => setStatusFilter("all")}
            >
              Wszystkie
            </button>
          </div>
        </div>
      ) : null}

      <div className={styles.paymentsPanelSearchWrap}>
        <label htmlFor="orderSearch" className={styles.paymentsPanelSearchLabel}>
          Szukaj zamówienia
        </label>
        <input
          id="orderSearch"
          type="text"
          value={orderSearch}
          onChange={(event) => setOrderSearch(event.target.value)}
          placeholder="Numer zamówienia lub dane klienta"
          className={styles.paymentsPanelSearchInput}
        />
      </div>

      <div
        className={styles.paymentsPanelTableWrap}
        ref={tableWrapRef}
        onMouseDown={handleMouseDown}
        onMouseLeave={handleMouseLeave}
        onMouseUp={handleMouseUp}
        onMouseMove={handleMouseMove}
        style={{ cursor: isDragging ? "grabbing" : "grab" }}
      >
        <table className={styles.paymentsPanelTable}>
          <thead>
            <tr>
              {mode === "online" ? <th>Zamówienie nr</th> : null}
              <th>Data płatności</th>
              <th>Klient</th>
              <th>Kwota</th>
              {mode === "online" ? <th>Status</th> : <th>Metoda</th>}
              {mode === "online" ? <th>Sesja Stripe</th> : null}
              {mode === "online" ? <th>Akcja</th> : null}
            </tr>
          </thead>
          <tbody>
            {filteredRows.length === 0 ? (
              <tr>
                  <td
                  colSpan={mode === "online" ? 7 : 4}
                  className={styles.paymentsPanelEmptyRow}
                >
                  Brak płatności dla wybranego filtra.
                </td>
              </tr>
            ) : (
              filteredRows.map((row) => {
                const createdAt = new Date(row.createdAt);
                const canSync = mode === "online" && row.status === "pending";

                return (
                  <tr key={row.id}>
                    {mode === "online" ? (
                      <td>{row.orderId ? row.orderId : "Brak numeru"}</td>
                    ) : null}
                    <td>{createdAt.toLocaleString("pl-PL")}</td>
                    <td>{`${row.firstName || ''} ${row.lastName || ''}`.trim()}</td>
                    <td>{row.totalPrice.toFixed(2)} zł</td>
                    {mode === "online" ? (
                      <td>{formatStatus(row.status)}</td>
                    ) : (
                      <td>{formatMethod(row.paymentMethod)}</td>
                    )}
                    {mode === "online" ? (
                      <td>
                        {typeof row.stripeSessionId === "string" &&
                          row.stripeSessionId.trim().length > 0 ? (
                          <a
                            href={`https://dashboard.stripe.com/checkout/sessions/${row.stripeSessionId}`}
                            target="_blank"
                            rel="noreferrer"
                            className={styles.paymentsPanelSessionLink}
                          >
                            {row.stripeSessionId}
                          </a>
                        ) : (
                          <span
                            className={
                              styles.paymentsPanelMissingSession
                            }
                          >
                            Brak ID sesji
                          </span>
                        )}
                      </td>
                    ) : null}
                    {mode === "online" ? (
                      <td>
                        {canSync ? (
                          <Button
                            type="button"
                            variant="secondary"
                            disabled={isPending && syncingId === row.id}
                            onClick={() => onSync(row.id)}
                          >
                            {isPending && syncingId === row.id ? (
                              <span
                                className={
                                  styles.paymentsPanelSyncLoading
                                }
                              >
                                <span
                                  className={styles.paymentsPanelSpinner}
                                  aria-hidden="true"
                                ></span>
                                Loading...
                              </span>
                            ) : (
                              "Synchronizuj"
                            )}
                          </Button>
                        ) : (
                          <span className={styles.paymentsPanelNoAction}>
                            -
                          </span>
                        )}
                      </td>
                    ) : null}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
