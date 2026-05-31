import styles from './booking.module.css'

export default function Loading() {
  return (
    <div className={styles.adminSettingsContainer}>
      <header className={styles.header}>
        <h1>Ustawienia rezerwacji</h1>
        <p className={styles.adminSubtitle}>Zarządzaj globalnymi zasadami rezerwacji</p>
      </header>

      <div className={styles.loadingState} role="status" aria-live="polite">
        <span className={styles.loadingSpinner} aria-hidden="true"></span>
        <span>Wczytywanie...</span>
      </div>
    </div>
  )
}
