import { getBookingConfig } from '@/actions/bookingConfigActions';
import BookingSettingsForm from './BookingSettingsForm';
import styles from './booking.module.css';
import adminStyles from "../../admin.module.css";

export default async function BookingSettingsPage() {
  const config = await getBookingConfig();
  return (
    <div>
      <header className={adminStyles.adminPageHeader}>
        <h1>Ustawienia rezerwacji</h1>
        <p>Zarządzaj globalnymi zasadami rezerwacji.</p>
      </header>
      <BookingSettingsForm initialConfig={config} />
    </div>
  );
}