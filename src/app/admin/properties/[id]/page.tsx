import Link from 'next/link';
import { notFound } from 'next/navigation';
import styles from './page.module.css';
import AdminShell from '../../_components/AdminShell/AdminShell';
import { getPropertyById } from '@/actions/adminPropertyActions';
// FloatingBackButton provided by admin layout
import EditPropertyForm from './EditPropertyForm';

export default async function PropertyEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const property = await getPropertyById(id);

  if (!property) {
    notFound();
  }

  return (
    <AdminShell
      title={`Edytuj domek: ${property.name}`}
      description="Wprowadź zmiany w danych obiektu."
    >

      <div className={styles.controls}>
        <Link href="/admin/properties" className={styles.backButton}>← Powrót do listy domków</Link>
      </div>

      <EditPropertyForm property={property} propertyId={id} />
    </AdminShell>
  );
}