// FloatingBackButton provided by admin layout
export const dynamic = 'force-dynamic'

import { getAdminPaymentsData } from '@/actions/adminPaymentActions'
import AdminShell from '../../_components/AdminShell/AdminShell'
import PaymentsPanel from '../PaymentsPanel'
import styles from '../page.module.css'

export default async function AdminPaymentsOnlinePage() {
  const paymentsData = await getAdminPaymentsData()

  return (
    <AdminShell title="Płatności online" description="Przeglądaj płatności zrealizowane online.">

      <PaymentsPanel initialData={paymentsData} mode="online" />
    </AdminShell>
  )
}
