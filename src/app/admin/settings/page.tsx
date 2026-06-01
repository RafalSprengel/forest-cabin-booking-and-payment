import { getSystemConfig } from '@/actions/adminConfigActions';
import ToggleSwitch from './ToggleSwitchClient';
import AdminAccountSettings from './AdminAccountSettings';
import SiteSettingsForm from './SiteSettingsForm';
import AdminShell from '../_components/AdminShell/AdminShell';
import AdminCard from '../_components/AdminCard/AdminCard';
import styles from './settings.module.css';

export default async function SettingsPage() {
  const config = await getSystemConfig();
  return (
    <AdminShell title="Ustawienia systemu" description="Zarządzaj globalną polityką wynajmu obiektu.">

      <AdminCard title="Polityka wynajmu" badge="Globalne">
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
      </AdminCard>

      <SiteSettingsForm />
      <AdminAccountSettings />
    </AdminShell>
  );
}
