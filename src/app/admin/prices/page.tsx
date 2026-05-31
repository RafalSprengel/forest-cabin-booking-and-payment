import { getBookingConfig } from '@/actions/bookingConfigActions'
import { getAllProperties } from '@/actions/adminPropertyActions'
import { getAllSeasons } from '@/actions/seasonActions'
// FloatingBackButton provided by admin layout
import PriceSettingsForm from './PriceSettingsForm'
import styles from './PriceSettingsForm.module.css'
import adminStyles from "../admin.module.css";

export default async function PricesPage() {
  const [properties, bookingConfig, seasons] = await Promise.all([
    getAllProperties(),
    getBookingConfig(),
    getAllSeasons()
  ])

  const childrenFreeAge = bookingConfig?.childrenFreeAgeLimit ?? 13

  const serializedProperties = JSON.parse(JSON.stringify(properties))
  const serializedSeasons = JSON.parse(JSON.stringify(seasons))

  return (
    <div>
      <header className={adminStyles.adminPageHeader}>
        <h1>Zarządzanie cenami</h1>
        <p>Konfiguruj stawki podstawowe, stawki w sezonach oraz ceny indywidualne.</p>
      </header>

      <div className={styles.priorityInfo}>
        <div className={styles.priorityInfoIcon}>i</div>
        <div className={styles.content}>
          <span className={styles.priorityInfoTitle}>Priorytety cen</span>
          <span className={styles.priorityInfoText}>
            Ceny indywidualne mają priorytet nad cenami sezonowymi, a ceny sezonowe mają priorytet nad cenami podstawowymi.
          </span>
          <div className={styles.priorityInfoChain}>
            <span>Ceny indywidualne</span>
            <span className={styles.priorityInfoArrow}>→</span>
            <span>Ceny sezonowe</span>
            <span className={styles.priorityInfoArrow}>→</span>
            <span>Ceny podstawowe</span>
          </div>
        </div>
      </div>

      <PriceSettingsForm
        properties={serializedProperties}
        childrenFreeAgeLimit={childrenFreeAge}
        seasons={serializedSeasons}
      />
    </div>
  )
}