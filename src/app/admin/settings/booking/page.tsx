import { getBookingConfig, updateBookingConfig } from '@/actions/bookingConfigActions';
import FloatingBackButton from '@/app/_components/FloatingBackButton/FloatingBackButton';
import '../settings.css';

export default async function BookingSettingsPage() {
  const config = await getBookingConfig();

  return (
    <div className="admin-settings-container">
      <FloatingBackButton />
      <header className="admin-header">
        <h1 className="admin-title">Ustawienia rezerwacji</h1>
        <p className="admin-subtitle">Zarządzaj globalnymi zasadami rezerwacji</p>
      </header>

      <form action={updateBookingConfig} className="settings-card">
        {/* Sekcja: Długość pobytu */}
        <div className="card-header">
          <h2 className="card-title">Długość pobytu</h2>
        </div>
        <div className="setting-row">
          <div className="setting-content">
            <label htmlFor="minBookingDays" className="setting-label">Minimalna liczba rezerwowanych nocy</label>
            <p className="setting-description">Klient nie może wybrać okresu krótszego.</p>
          </div>
          <div className="setting-control">
            <input
              type="number"
              id="minBookingDays"
              name="minBookingDays"
              min="1"
              max="30"
              defaultValue={config.minBookingDays}
              className="number-input"
            />
          </div>
        </div>

        <div className="setting-row">
          <div className="setting-content">
            <label htmlFor="maxBookingDays" className="setting-label">Maksymalna liczba rezerwowanych nocy</label>
            <p className="setting-description">Klient nie może wybrać okresu dłuższego.</p>
          </div>
          <div className="setting-control">
            <input
              type="number"
              id="maxBookingDays"
              name="maxBookingDays"
              min="1"
              max="90"
              defaultValue={config.maxBookingDays}
              className="number-input"
            />
          </div>
        </div>

        {/* Sekcja: Sezon wysoki */}
        <div className="card-header" style={{ marginTop: '20px' }}>
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
              defaultValue={config.highSeasonStart ? new Date(config.highSeasonStart).toISOString().split('T')[0] : ''}
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
              defaultValue={config.highSeasonEnd ? new Date(config.highSeasonEnd).toISOString().split('T')[0] : ''}
              className="date-input"
            />
          </div>
        </div>

        {/* Sekcja: Pojemność i dzieci */}
        <div className="card-header" style={{ marginTop: '20px' }}>
          <h2 className="card-title">Pojemność i dzieci</h2>
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
              defaultValue={config.childrenFreeAgeLimit}
              className="number-input"
            />
          </div>
        </div>

        <div className="form-actions" style={{ padding: '20px', borderTop: '1px solid #eee' }}>
          <button type="submit" className="btn-primary">
            Zapisz ustawienia
          </button>
        </div>
      </form>
    </div>
  );
}