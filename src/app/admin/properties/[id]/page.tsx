import { getPropertyById } from '@/actions/adminPropertyActions'
import { notFound } from 'next/navigation'
import EditPropertyForm from './EditPropertyForm'
import Link from 'next/link'
import styles from './page.module.css'

export default async function EditPropertyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const property = await getPropertyById(id)

  if (!property) {
    notFound()
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerTop}>
          <Link href="/admin/properties" className={styles.backButton}>
            ← Powrót do listy
          </Link>
          <h1>Edycja: {property.name}</h1>
        </div>
        <p>Modyfikuj dane obiektu w systemie.</p>
      </header>

      <EditPropertyForm property={property} propertyId={id} />
    </div>
  )
}