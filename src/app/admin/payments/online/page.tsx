// FloatingBackButton provided by admin layout
import { getAdminPaymentsData } from '@/actions/adminPaymentActions'
import PaymentsPanel from '../PaymentsPanel'
import styles from '../page.module.css'
import adminStyles from "../../admin.module.css";

export default async function AdminPaymentsOnlinePage() {
  const paymentsData = await getAdminPaymentsData()

  return (
    <div>
      <header className={adminStyles.adminPageHeader}>
        <h1>Płatności online</h1>
        <p>Przeglądaj płatności zrealizowane online.</p>
      </header>

      <PaymentsPanel initialData={paymentsData} mode="online" />
    </div>
  )
}
