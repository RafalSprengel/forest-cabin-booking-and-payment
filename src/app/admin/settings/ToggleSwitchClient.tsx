'use client';

import { useState } from 'react';
import { updateSystemConfigSetting } from '@/actions/adminConfigActions';
import { ISystemConfig } from '@/db/models/SystemConfig';

interface ToggleSwitchProps {
  initialState: boolean;
  settingKey: keyof ISystemConfig;
}

export default function ToggleSwitch({ initialState, settingKey }: ToggleSwitchProps) {
  const [state, setState] = useState(initialState);
  const [isPending, setIsPending] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const handleToggle = async () => {
    const newState = !state;
    setState(newState);
    setIsPending(true);
    
    try {
      const result = await updateSystemConfigSetting(settingKey, newState);
      
      if (result.success) {
        setStatusMessage(result.message);
        setTimeout(() => setStatusMessage(null), 3000);
      } else {
        setState(!newState);
        setStatusMessage(result.message);
        setTimeout(() => setStatusMessage(null), 3000);
      }
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="toggle-wrapper">
      <button
        type="button"
        onClick={handleToggle}
        disabled={isPending}
        className={`toggle-switch ${state ? 'toggle-on' : 'toggle-off'} ${isPending ? 'toggle-disabled' : ''}`}
        aria-pressed={state}
        aria-label="Przełącz ustawienie"
      >
        <span className="toggle-knob" />
      </button>
      
      <span className={`toggle-status-label ${state ? 'status-active' : 'status-inactive'}`}>
        {state ? 'WŁĄCZONE' : 'WYŁĄCZONE'}
      </span>

      {statusMessage && (
        <div className={`status-message ${statusMessage.includes('Włączono') || statusMessage.includes('W') ? 'msg-success' : 'msg-error'}`}>
          {statusMessage}
        </div>
      )}
      
      {isPending && (
        <span className="loading-spinner">Zapisywanie...</span>
      )}
    </div>
  );
}
