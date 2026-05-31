import styles from './page.module.css'
import adminStyles from "../../admin.module.css";
// FloatingBackButton provided by admin layout

export default function Loading() {
  return (
    <div className={styles.container}>
      <header className={adminStyles.adminPageHeader}>
        <h1>Lista Rezerwacji</h1>
        <p>Przeglądaj, edytuj lub usuwaj istniejące rezerwacje.</p>
      </header>

      <div className={styles.loadingState} role="status" aria-live="polite">
        <span className={styles.loadingSpinner} aria-hidden="true"></span>
        <span>Wczytywanie...</span>
      </div>
    </div>
  )
}
