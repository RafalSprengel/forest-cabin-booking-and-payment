'use client';

import { useActionState, useEffect, useState } from 'react';
import { updateBookingConfig } from '@/actions/bookingConfigActions';
import '../settings.css';

interface BookingConfig {
  minBookingDays: number;
  maxBookingDays: number;
  highSeasonStart: string | null;
  highSeasonEnd: string | null;
  childrenFreeAgeLimit: number;
}

interface Props {
  initialConfig: BookingConfig;
}

export default function BookingSettingsForm({ initialConfig }: Props) {
  const [state, formAction, isPending] = useActionState(updateBookingConfig, {
    message: '',
    success: false,
  });

  const [showMessage, setShowMessage] = useState(false);
  const [message, setMessage] = useState({ text: '', success: false });

  useEffect(() => {
    if (state.message) {
      setMessage({ text: state.message, success: state.success });
      setShowMessage(true);
      const timer = setTimeout(() => {
        setShowMessage(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [state]);

  return (
    <form action={formAction} className="settings-card">
      <div className="card-header">
        <h2 className="card-title">Długość pobytu</h2>
      </div>
      <div className="setting-row">
        <div className="setting-content">
          <label htmlFor="minBookingDays" className="setting-label">Minimalna liczba nocy</label>
          <p className="setting-description">Klient nie może wybrać okresu krótszego.</p>
        </div>
        <div className="setting-control">
          <input
            type="number"
            id="minBookingDays"
            name="minBookingDays"
            min="1"
            max="30"
            defaultValue={initialConfig.minBookingDays}
            className="number-input"
          />
        </div>
      </div>

      <div className="setting-row">
        <div className="setting-content">
          <label htmlFor="maxBookingDays" className="setting-label">Maksymalna liczba nocy</label>
          <p className="setting-description">Klient nie może wybrać okresu dłuższego.</p>
        </div>
        <div className="setting-control">
          <input
            type="number"
            id="maxBookingDays"
            name="maxBookingDays"
            min="1"
            max="90"
            defaultValue={initialConfig.maxBookingDays}
            className="number-input"
          />
        </div>
      </div>

      <div className="card-header card-header-spaced">
        <h2 className="card-title">Sezon wysoki</h2>
      </div>
      <div className="setting-row">
        <div className="setting-content">
          <label htmlFor="highSeasonStart" className="setting-label">Data rozpoczęcia</label>
        </div>
        <div className="setting-control">
          <input
            type="date"
            id="highSeasonStart"
            name="highSeasonStart"
            defaultValue={initialConfig.highSeasonStart ? new Date(initialConfig.highSeasonStart).toISOString().split('T')[0] : ''}
            className="date-input"
          />
        </div>
      </div>
      <div className="setting-row">
        <div className="setting-content">
          <label htmlFor="highSeasonEnd" className="setting-label">Data zakończenia</label>
        </div>
        <div className="setting-control">
          <input
            type="date"
            id="highSeasonEnd"
            name="highSeasonEnd"
            defaultValue={initialConfig.highSeasonEnd ? new Date(initialConfig.highSeasonEnd).toISOString().split('T')[0] : ''}
            className="date-input"
          />
        </div>
      </div>

      <div className="card-header card-header-spaced">
        <h2 className="card-title">Dzieci</h2>
      </div>
      <div className="setting-row">
        <div className="setting-content">
          <label htmlFor="childrenFreeAgeLimit" className="setting-label">Wiek dzieci bezpłatnych (do lat)</label>
        </div>
        <div className="setting-control">
          <input
            type="number"
            id="childrenFreeAgeLimit"
            name="childrenFreeAgeLimit"
            min="0"
            max="18"
            defaultValue={initialConfig.childrenFreeAgeLimit}
            className="number-input"
          />
        </div>
      </div>

      <div className="form-actions">
        <button type="submit" className="btn-primary" disabled={isPending}>
          {isPending ? 'Zapisywanie...' : 'Zapisz ustawienia'}
        </button>
      </div>

      {showMessage && (
        <div className={`form-message ${message.success ? 'success-message' : 'error-message'}`}>
          {message.text}
        </div>
      )}
    </form>
  );
}