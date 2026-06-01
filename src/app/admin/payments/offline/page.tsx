// FloatingBackButton provided by admin layout
import { getAdminPaymentsData } from '@/actions/adminPaymentActions'
import AdminShell from '../../_components/AdminShell/AdminShell'
import PaymentsPanel from '../PaymentsPanel'
import styles from '../page.module.css'

export default async function AdminPaymentsOfflinePage() {
  const paymentsData = await getAdminPaymentsData()

  return (
    <AdminShell title="Płatności gotówką lub przelewem" description="Przeglądaj płatności zrealizowane gotówką lub przelewem.">

      <PaymentsPanel initialData={paymentsData} mode="offline" />
    </AdminShell>
  )
}
