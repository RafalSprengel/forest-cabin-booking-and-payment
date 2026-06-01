import { getBookingConfig } from '@/actions/bookingConfigActions';
import AdminShell from '../../_components/AdminShell/AdminShell';
import BookingSettingsForm from './BookingSettingsForm';

export default async function BookingSettingsPage() {
  const config = await getBookingConfig();
  return (
    <AdminShell title="Ustawienia rezerwacji" description="Zarządzaj globalnymi zasadami rezerwacji.">
      <BookingSettingsForm initialConfig={config} />
    </AdminShell>
  );
}