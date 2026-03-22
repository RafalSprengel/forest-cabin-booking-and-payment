import { getBookingConfig } from '@/actions/bookingConfigActions';
import { getAllProperties } from '@/actions/adminPropertyActions';
import FloatingBackButton from '@/app/_components/FloatingBackButton/FloatingBackButton';
import PriceSettingsForm from './PriceSettingsForm';
import '../settings/settings.css';

export default async function PricesPage() {
  const [properties, bookingConfig] = await Promise.all([
    getAllProperties(),
    getBookingConfig()
  ]);

  const singleProperties = properties.filter(p => p.type === 'single');

  return (
    <div className="admin-settings-container">
      <FloatingBackButton />
      <header className="admin-header">
        <h1 className="admin-title">Zarządzanie cenami</h1>
        <p className="admin-subtitle">Konfiguruj stawki podstawowe oraz ceny indywidualne</p>
      </header>
      <PriceSettingsForm 
        properties={singleProperties}
        childrenFreeAgeLimit={bookingConfig.childrenFreeAgeLimit}
      />
    </div>
  );
}