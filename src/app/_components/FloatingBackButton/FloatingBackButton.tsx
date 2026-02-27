'use client'
import { useRouter } from 'next/navigation'
import styles from './FloatingBackButton.module.css'

export default function FloatingBackButton() {
  const router = useRouter()

  const handleBack = () => {
    router.back()
  }

  return (
    <button
      type="button"
      className={styles.floatingBack}
      onClick={handleBack}
      aria-label="Wróć"
    >
      ←
    </button>
  )
}