'use client'

import { Toaster, ToastBar, toast } from 'react-hot-toast'

export default function AppToaster() {
  return (
    <Toaster
      position="bottom-center"
      toastOptions={{
        duration: 5000,
        success: {
          duration: 3000,
        },
        error: {
          duration: 5000,
        },
      }}
    >
      {(t) => (
        <ToastBar toast={t}>
          {({ icon, message }) => (
            <>
              {icon}
              {message}
              <button
                type="button"
                onClick={() => toast.dismiss(t.id)}
                aria-label="Zamknij powiadomienie"
                style={{
                  marginLeft: '8px',
                  border: 'none',
                  background: 'transparent',
                  color: 'inherit',
                  cursor: 'pointer',
                  fontSize: '16px',
                  lineHeight: 1,
                }}
              >
                ×
              </button>
            </>
          )}
        </ToastBar>
      )}
    </Toaster>
  )
}