import { getSystemConfig } from '@/actions/adminConfigActions';
import ToggleSwitch from './ToggleSwitchClient';
import AdminAccountSettings from './AdminAccountSettings';
import SiteSettingsForm from './SiteSettingsForm';
import styles from './settings.module.css';
import adminStyles from "../admin.module.css";

export default async function SettingsPage() {
  const config = await getSystemConfig();
  return (
    <div>
      <header className={adminStyles.adminPageHeader}>
        <h1 >Ustawienia systemu</h1>
        <p>Zarządzaj globalną polityką wynajmu obiektu.</p>
      </header>

      <section className={styles.card}>
        <div className={styles.cardHeader}>
          <h2>Polityka wynajmu</h2>
          <span className={styles.cardBadge}>Globalne</span>
        </div>
        <div className={styles.settingRow}>
          <div className={styles.settingContent}>
            <label className={styles.settingLabel} htmlFor="auto-block-toggle">Automatyczna blokada drugiego domku</label>
            <p className={styles.settingDescription}>Gdy ta opcja jest <strong>włączona</strong>, rezerwacja jednego domku automatycznie blokuje wszystkie pozostałe na te same daty (zasada &quot;jedna grupa na terenie&quot;).<br />Gdy <strong>wyłączona</strong>, klienci mogą rezerwować domek niezależnie, mimo że drugi jest już zarezerwowany przez innego klienta.</p>
          </div>
          <div className={styles.settingControl}>
            <ToggleSwitch
              initialState={config.autoBlockOtherCabins}
              settingKey="autoBlockOtherCabins"
            />
          </div>
        </div>
      </section>

      <SiteSettingsForm />
      <AdminAccountSettings />
    </div>
  );
}
