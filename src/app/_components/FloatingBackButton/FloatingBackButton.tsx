'use client'
import { useRouter } from 'next/navigation'
import styles from './FloatingBackButton.module.css'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons'

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
      <FontAwesomeIcon icon={faArrowLeft} aria-hidden="true" />
    </button>
  )
}