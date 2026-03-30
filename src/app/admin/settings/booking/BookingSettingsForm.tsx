'use client';
import { useActionState, useEffect, useState, useTransition, useMemo } from 'react';
import { updateBookingConfig, updateAllowCheckinOnDepartureDay } from '@/actions/bookingConfigActions';
import { getAllSeasons, updateSeasonDates, updateSeasonOrder, ISeasonData } from '@/actions/seasonActions';
import dayjs from 'dayjs';
import { toast, Toaster } from 'react-hot-toast';
import '../settings.css';

interface BookingConfig {
  minBookingDays: number;
  maxBookingDays: number;
  highSeasonStart: string | null;
  highSeasonEnd: string | null;
  childrenFreeAgeLimit: number;
  allowCheckinOnDepartureDay: boolean;
  checkInHour: number;
  checkOutHour: number;
}

interface Props {
  initialConfig: BookingConfig;
}

export default function BookingSettingsForm({ initialConfig }: Props) {
  const [state, formAction, isPending] = useActionState(updateBookingConfig, {
    message: '',
    success: false,
  });

  const [localMinDays, setLocalMinDays] = useState(initialConfig.minBookingDays);
  const [localMaxDays, setLocalMaxDays] = useState(initialConfig.maxBookingDays);
  const [localChildrenFreeAge, setLocalChildrenFreeAge] = useState(initialConfig.childrenFreeAgeLimit);
  const [localCheckInHour, setLocalCheckInHour] = useState(initialConfig.checkInHour);
  const [localCheckOutHour, setLocalCheckOutHour] = useState(initialConfig.checkOutHour);
  const [allowCheckin, setAllowCheckin] = useState(initialConfig.allowCheckinOnDepartureDay);
  
  const [togglePending, startToggleTransition] = useTransition();
  const [seasons, setSeasons] = useState<ISeasonData[]>([]);
  const [selectedSeasonId, setSelectedSeasonId] = useState<string>('');
  const [selectedSeason, setSelectedSeason] = useState<ISeasonData | null>(null);
  const [isLoadingSeasons, setIsLoadingSeasons] = useState(true);
  const [isUpdatingSeason, setIsUpdatingSeason] = useState(false);
  const [seasonName, setSeasonName] = useState('');
  const [seasonDesc, setSeasonDesc] = useState('');
  const [seasonStartDate, setSeasonStartDate] = useState('');
  const [seasonEndDate, setSeasonEndDate] = useState('');
  const [seasonOrder, setSeasonOrder] = useState<number>(0);
  const [isEditExpanded, setIsEditExpanded] = useState(false);

  const isConfigDirty = useMemo(() => {
    return (
      localMinDays !== initialConfig.minBookingDays ||
      localMaxDays !== initialConfig.maxBookingDays ||
      localChildrenFreeAge !== initialConfig.childrenFreeAgeLimit ||
      localCheckInHour !== initialConfig.checkInHour ||
      localCheckOutHour !== initialConfig.checkOutHour
    );
  }, [localMinDays, localMaxDays, localChildrenFreeAge, localCheckInHour, localCheckOutHour, initialConfig]);

  const isSeasonDirty = useMemo(() => {
    if (!selectedSeason) return false;
    const originalStartDate = dayjs(selectedSeason.startDate).format('YYYY-MM-DD');
    const originalEndDate = dayjs(selectedSeason.endDate).format('YYYY-MM-DD');
    
    return (
      seasonName !== selectedSeason.name ||
      seasonDesc !== (selectedSeason.description || '') ||
      seasonStartDate !== originalStartDate ||
      seasonEndDate !== originalEndDate ||
      seasonOrder !== selectedSeason.order
    );
  }, [selectedSeason, seasonName, seasonDesc, seasonStartDate, seasonEndDate, seasonOrder]);

  const isAnyDirty = isConfigDirty || isSeasonDirty;

  useEffect(() => {
    const loadSeasons = async () => {
      setIsLoadingSeasons(true);
      const seasonsList = await getAllSeasons();
      setSeasons(seasonsList);
      setIsLoadingSeasons(false);
    };
    loadSeasons();
  }, []);
  
  useEffect(() => {
    if (!selectedSeasonId && seasons.length > 0) {
      setSelectedSeasonId(seasons[0]._id);
      return;
    }
    const season = seasons.find(s => s._id === selectedSeasonId);
    setSelectedSeason(season || null);
    if (season) {
      setSeasonName(season.name);
      setSeasonDesc(season.description || '');
      setSeasonStartDate(dayjs(season.startDate).format('YYYY-MM-DD'));
      setSeasonEndDate(dayjs(season.endDate).format('YYYY-MM-DD'));
      setSeasonOrder(season.order);
    }
  }, [selectedSeasonId, seasons]);

  useEffect(() => {
    setAllowCheckin(initialConfig.allowCheckinOnDepartureDay);
  }, [initialConfig.allowCheckinOnDepartureDay]);

  useEffect(() => {
    if (state.message) {
      if (state.success) {
        toast.success(state.message);
      } else {
        toast.error(state.message);
      }
    }
  }, [state]);

  const handleUpdateSeasonSilent = async () => {
    if (!seasonName || !selectedSeasonId || !seasonStartDate || !seasonEndDate) return false;
    if (!isSeasonDirty) return true;

    setIsUpdatingSeason(true);
    try {
      if (seasonOrder !== selectedSeason?.order) {
        await updateSeasonOrder(selectedSeasonId, seasonOrder);
      }
      const result = await updateSeasonDates(seasonName, seasonDesc, selectedSeasonId, seasonStartDate, seasonEndDate);
      
      if (result.success) {
        const updatedSeasons = await getAllSeasons();
        setSeasons(updatedSeasons);
        toast.success(`Zapisano zmiany w sezonie: ${seasonName}`);
        setIsEditExpanded(false);
        return true;
      } else {
        toast.error(result.message);
        return false;
      }
    } catch (error) {
      toast.error('Wystąpił błąd podczas automatycznego zapisu');
      return false;
    } finally {
      setIsUpdatingSeason(false);
    }
  };

  const handleSeasonChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const nextId = e.target.value;
    if (isSeasonDirty) {
      const saved = await handleUpdateSeasonSilent();
      if (!saved) return;
    }
    setSelectedSeasonId(nextId);
  };

  const handleToggle = () => {
    const newValue = !allowCheckin;
    startToggleTransition(async () => {
      const result = await updateAllowCheckinOnDepartureDay(newValue);
      if (result.success) {
        setAllowCheckin(newValue);
        toast.success(result.message);
      } else {
        toast.error(result.message || 'Błąd zapisu');
      }
    });
  };

  const handleBlurMinDays = (e: React.FocusEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value);
    if (!isNaN(val) && val >= 1) setLocalMinDays(val);
    else e.target.value = localMinDays.toString();
  };

  const handleBlurMaxDays = (e: React.FocusEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value);
    if (!isNaN(val) && val >= 1) setLocalMaxDays(val);
    else e.target.value = localMaxDays.toString();
  };

  const handleBlurChildrenFreeAge = (e: React.FocusEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value);
    if (!isNaN(val) && val >= 0) setLocalChildrenFreeAge(val);
    else e.target.value = localChildrenFreeAge.toString();
  };

  const handleBlurCheckIn = (e: React.FocusEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value);
    if (isNaN(val) || val < 0 || val > 23 || val < localCheckOutHour) {
      if (val < localCheckOutHour) toast.error('Godzina rozpoczęcia doby nie może być wcześniejsza niż zakończenia.');
      e.target.value = localCheckInHour.toString();
      return;
    }
    setLocalCheckInHour(val);
  };

  const handleBlurCheckOut = (e: React.FocusEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value);
    if (isNaN(val) || val < 0 || val > 23 || val > localCheckInHour) {
      if (val > localCheckInHour) toast.error('Godzina zakończenia doby nie może być późniejsza niż rozpoczęcia.');
      e.target.value = localCheckOutHour.toString();
      return;
    }
    setLocalCheckOutHour(val);
  };

  const handleReset = () => {
    setLocalMinDays(initialConfig.minBookingDays);
    setLocalMaxDays(initialConfig.maxBookingDays);
    setLocalChildrenFreeAge(initialConfig.childrenFreeAgeLimit);
    setLocalCheckInHour(initialConfig.checkInHour);
    setLocalCheckOutHour(initialConfig.checkOutHour);
    if (selectedSeason) {
      setSeasonName(selectedSeason.name);
      setSeasonDesc(selectedSeason.description || '');
      setSeasonStartDate(dayjs(selectedSeason.startDate).format('YYYY-MM-DD'));
      setSeasonEndDate(dayjs(selectedSeason.endDate).format('YYYY-MM-DD'));
      setSeasonOrder(selectedSeason.order);
    }
  };

  return (
    <>
      <Toaster position="top-right" />
      <form action={formAction} className="settings-card">
        <input type="hidden" name="minBookingDays" value={localMinDays} />
        <input type="hidden" name="maxBookingDays" value={localMaxDays} />
        <input type="hidden" name="childrenFreeAgeLimit" value={localChildrenFreeAge} />
        <input type="hidden" name="checkInHour" value={localCheckInHour} />
        <input type="hidden" name="checkOutHour" value={localCheckOutHour} />

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
              value={localMinDays}
              onChange={(e) => setLocalMinDays(parseInt(e.target.value) || 1)}
              onBlur={handleBlurMinDays}
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
              value={localMaxDays}
              onChange={(e) => setLocalMaxDays(parseInt(e.target.value) || 1)}
              onBlur={handleBlurMaxDays}
              className="number-input"
            />
          </div>
        </div>

        <div className="card-header card-header-spaced">
          <h2 className="card-title">Daty sezonów</h2>
        </div>
        <div className="setting-row">
          <div className="setting-content">
            <label className="setting-label">Wybierz sezon:</label>
            <p className="setting-description">Zmiana sezonu automatycznie zapisuje edytowane dane.</p>
          </div>
          <div className="setting-control">
            <select
              value={selectedSeasonId}
              onChange={handleSeasonChange}
              disabled={isUpdatingSeason || isLoadingSeasons}
              className="date-input season-select-full"
            >
              {seasons.map((season) => (
                <option key={season._id} value={season._id}>
                  {season.name} {!season.isActive && '(nieaktywny)'}
                </option>
              ))}
            </select>
          </div>
        </div>

        {selectedSeason && (
          <div className="season-details-box">
            <div className="setting-row">
              <div className="setting-content">
                <button type="button" onClick={() => setIsEditExpanded(!isEditExpanded)} className="btn-toggle-edit">
                  {isEditExpanded ? 'Anuluj edycję' : 'Edytuj nazwę i opis'}
                </button>
              </div>
            </div>
            {isEditExpanded && (
              <div className="settings-editNameAndDesc">
                <div className="setting-row">
                  <div className="setting-content"><label className="setting-label">Nazwa sezonu:</label></div>
                  <div className='setting-control'>
                    <input value={seasonName} onChange={(e) => setSeasonName(e.target.value)} />
                  </div>
                </div>
                <div className="setting-row">
                  <div className="setting-content"><label className="setting-label">Opis sezonu:</label></div>
                  <div className='setting-control'>
                    <input value={seasonDesc} onChange={(e) => setSeasonDesc(e.target.value)} />
                  </div>
                </div>
                <div className="setting-row">
                  <div className="setting-content">
                    <label className="setting-label">Kolejność:</label>
                  </div>
                  <div className="setting-control">
                    <input type="number" value={seasonOrder} onChange={(e) => setSeasonOrder(parseInt(e.target.value) || 0)} className="number-input" />
                  </div>
                </div>
              </div>
            )}
            <div className="setting-row">
              <div className="setting-content"><label className="setting-label">Data rozpoczęcia:</label></div>
              <div className="setting-control">
                <input type="date" value={seasonStartDate} onChange={(e) => setSeasonStartDate(e.target.value)} className="date-input" />
              </div>
            </div>
            <div className="setting-row">
              <div className="setting-content"><label className="setting-label">Data zakończenia:</label></div>
              <div className="setting-control">
                <input type="date" value={seasonEndDate} onChange={(e) => setSeasonEndDate(e.target.value)} className="date-input" />
              </div>
            </div>
          </div>
        )}

        <div className="card-header card-header-spaced">
          <h2 className="card-title">Doba hotelowa</h2>
        </div>
        <div className="setting-row">
          <div className="setting-content">
            <label htmlFor="checkInHour" className="setting-label">Godzina rozpoczęcia doby (check-in):</label>
            <p className="setting-description">Od której godziny można się zameldować w dniu przyjazdu.</p>
          </div>
          <div className="setting-control">
            <input type="number" id="checkInHour" value={localCheckInHour} onChange={(e) => setLocalCheckInHour(parseInt(e.target.value) || 0)} onBlur={handleBlurCheckIn} className="number-input" />
          </div>
        </div>
        <div className="setting-row">
          <div className="setting-content">
            <label htmlFor="checkOutHour" className="setting-label">Godzina zakończenia doby (check-out):</label>
            <p className="setting-description">Do której godziny trzeba opuścić domek w dniu wyjazdu.</p>
          </div>
          <div className="setting-control">
            <input type="number" id="checkOutHour" value={localCheckOutHour} onChange={(e) => setLocalCheckOutHour(parseInt(e.target.value) || 0)} onBlur={handleBlurCheckOut} className="number-input" />
          </div>
        </div>

        <div className="card-header card-header-spaced">
          <h2 className="card-title">Dzieci</h2>
        </div>
        <div className="setting-row">
          <div className="setting-content"><label htmlFor="childrenFreeAgeLimit" className="setting-label">Bezpłatny pobyt dzieci do lat:</label></div>
          <div className="setting-control">
            <input type="number" id="childrenFreeAgeLimit" value={localChildrenFreeAge} onChange={(e) => setLocalChildrenFreeAge(parseInt(e.target.value) || 0)} onBlur={handleBlurChildrenFreeAge} className="number-input" />
          </div>
        </div>

        <div className="card-header card-header-spaced">
          <h2 className="card-title">Dostępność terminów</h2>
        </div>
        <div className="setting-row">
          <div className="setting-content">
            <label className="setting-label">
              Zezwalaj na zameldowanie w dniu wymeldowania poprzednich gości
            </label>
            <p className="setting-description">
              Jeśli włączone, nowi goście mogą przyjechać tego samego dnia, w którym poprzedni wyjeżdżają (po {localCheckOutHour}:00).<br />
              Jeśli wyłączone, dzień wymeldowania jest niedostępny dla nowych rezerwacji.
            </p>
          </div>
          <div className="setting-control">
            <div className="toggle-wrapper">
              <button
                type="button"
                onClick={handleToggle}
                disabled={togglePending}
                className={`toggle-switch ${allowCheckin ? 'toggle-on' : 'toggle-off'} ${togglePending ? 'toggle-disabled' : ''}`}
              >
                <span className="toggle-knob" />
              </button>
              <span className={`toggle-status-label ${allowCheckin ? 'status-active' : 'status-inactive'}`}>
                {allowCheckin ? 'WŁĄCZONE' : 'WYŁĄCZONE'}
              </span>
            </div>
          </div>
        </div>

        <div className={`floating-save-bar ${isAnyDirty ? 'visible' : ''}`}>
          <div className="floating-save-content">
            <p className="floating-save-text">
              {isConfigDirty && isSeasonDirty ? 'Masz niezapisane zmiany w ustawieniach i sezonie.' : 
               isSeasonDirty ? `Niezapisane zmiany w sezonie: ${selectedSeason?.name}` : 
               'Masz niezapisane zmiany w ustawieniach głównych.'}
            </p>
            <div className="floating-save-actions">
              <button type="button" className="btn-secondary" onClick={handleReset} disabled={isPending || isUpdatingSeason}>Odrzuć</button>
              <button 
                type={isConfigDirty ? "submit" : "button"} 
                className="btn-primary" 
                disabled={isPending || isUpdatingSeason}
                onClick={() => { if(!isConfigDirty && isSeasonDirty) handleUpdateSeasonSilent() }}
              >
                {isPending || isUpdatingSeason ? 'Zapisywanie...' : 'Zapisz wszystko'}
              </button>
            </div>
          </div>
        </div>
      </form>
    </>
  );
}