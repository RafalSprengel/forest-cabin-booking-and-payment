import AdminShell from '../../_components/AdminShell/AdminShell'
import styles from './page.module.css';
// FloatingBackButton provided by admin layout

export default function Loading() {
  return (
    <AdminShell title="Lista rezerwacji" description="Przeglądaj, edytuj lub usuwaj istniejące rezerwacje.">

      <div className={styles.loadingState} role="status" aria-live="polite">
        <span className={styles.loadingSpinner} aria-hidden="true"></span>
        <span>Wczytywanie...</span>
      </div>
    </AdminShell>
  )
}
