import { getPropertyById, updateProperty, deleteProperty } from '@/actions/adminPropertyActions';
import { notFound, redirect } from 'next/navigation';
import EditPropertyForm from './EditPropertyForm';
import styles from './page.module.css';
import FloatingBackButton from '@/app/_components/FloatingBackButton/FloatingBackButton';

export default async function EditPropertyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const property = await getPropertyById(id);
  if (!property) { notFound(); }

  async function handleDelete() {
    'use server';
    const result = await deleteProperty(id);
    if (result.success) { redirect('/admin/properties'); }
  }

  return (
    <div className={styles.container}>
      <FloatingBackButton />
      <header className={styles.header}>
        <h1>Edycja: {property.name}</h1>
        <p>Modyfikuj dane obiektu w systemie.</p>
      </header>
      <EditPropertyForm property={property} propertyId={id} />
      <div className={styles.dangerZone}>
        <h3 className={styles.dangerTitle}>Strefa niebezpieczna</h3>
        <p className={styles.dangerDesc}>Usunięcie domku jest nieodwracalne. Można usunąć tylko obiekty bez rezerwacji.</p>
        <form action={handleDelete}>
          <button type="submit" className={styles.btnDelete} onClick={(e) => { if (!confirm('Czy na pewno usunąć ten domek? Ta operacja jest nieodwracalna.')) e.preventDefault(); }}>🗑️ Usuń domek</button>
        </form>
      </div>
    </div>
  );
}