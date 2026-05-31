import Link from 'next/link';
import { notFound } from 'next/navigation';
import styles from './page.module.css';
import adminStyles from "../../admin.module.css";
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
    <div>
      <header className={adminStyles.adminPageHeader}>
        <Link href="/admin/properties" className={styles.backButton}>
          ← Powrót do listy domków
        </Link>
        <h1>Edytuj domek: {property.name}</h1>
        <p>Wprowadź zmiany w danych obiektu.</p>
      </header>

      <EditPropertyForm property={property} propertyId={id} />
    </div>
  );
}