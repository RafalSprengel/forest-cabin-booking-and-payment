import { revalidatePath } from "next/cache";
import {
  getAllProperties,
  togglePropertyActive,
} from "@/actions/adminPropertyActions";
import Button from "@/app/_components/UI/Button/Button";
import AdminShell from '../_components/AdminShell/AdminShell';
import StatusBadge from '../_components/StatusBadge/StatusBadge';
import DeletePropertyButton from "./DeletePropertyButton";
import styles from "./page.module.css";

export default async function PropertiesPage() {
  const properties = await getAllProperties();

  async function handleToggleActive(formData: FormData) {
    "use server";
    const id = formData.get("id") as string;
    const isActive = formData.get("isActive") === "true";
    await togglePropertyActive(id, !isActive);
    revalidatePath("/admin/properties");
  }

  return (
    <AdminShell
      title="Zarządzanie obiektami"
      description="Dodaj, edytuj lub dezaktywuj obiekty w systemie."
    >

      <div className={styles.controls}> 
        <Button href="/admin/properties/add" variant='secondary' className={styles.btnAdd}>
          ➕ Dodaj nowy obiekt
        </Button>
      </div>

      {properties.length === 0 ? (
        <div className={styles.emptyState}>
          <p>Brak obiektów w systemie.</p>
          <Button href="/admin/properties/add" variant='secondary' className={styles.btnAdd}>
            Dodaj pierwszy obiekt
          </Button>
        </div>
      ) : (
        <div className={styles.propertiesGrid}>
          {properties.map((prop) => (
            <article key={prop._id} className={styles.propertyCard}>
              <div className={styles.cardHeader}>
                <h3 className={styles.propertyName}>{prop.name}</h3>
                <StatusBadge
                  text={prop.isActive ? "Aktywny" : "Nieaktywny"}
                  variant={prop.isActive ? "active" : "inactive"}
                />
              </div>
              {prop.description && (
                <p className={styles.description}>{prop.description}</p>
              )}
              <div className={styles.details}>
                <div className={styles.detailRow}>
                  <span className={styles.label}>Max. dorosłych:</span>
                  <span className={styles.value}>{prop.maxAdults}</span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.label}>Max. dzieci:</span>
                  <span className={styles.value}>{prop.maxChildren}</span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.label}>Max. dostawek:</span>
                  <span className={styles.value}>{prop.maxExtraBeds}</span>
                </div>
                
              </div>
              <div className={styles.cardActions}>
                <form action={handleToggleActive}>
                  <input type="hidden" name="id" value={prop._id} />
                  <input
                    type="hidden"
                    name="isActive"
                    value={String(prop.isActive)}
                  />
                  <Button type="submit" variant="secondary" fullWidth>
                    {prop.isActive ? "🔘 Dezaktywuj" : "✅ Aktywuj"}
                  </Button>
                </form>
                <div className={styles.cardActionsRow}>
                  <Button variant='secondary' href={`/admin/properties/${prop._id}`}>
                    ✏️ Edytuj
                  </Button>
                  <DeletePropertyButton
                    propertyId={prop._id}
                    propertyName={prop.name}
                  />
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </AdminShell>
  );
}
