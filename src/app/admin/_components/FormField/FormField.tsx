import type { ReactNode } from 'react';
import styles from './FormField.module.css';

interface Props {
  label: string;
  id: string;
  error?: string | null;
  hint?: string;
  children: ReactNode;
}

export default function FormField({ label, id, error, hint, children }: Props) {
  return (
    <div className={styles.field}>
      <label className={styles.label} htmlFor={id}>{label}</label>
      {children}
      {hint && <small className={styles.hint}>{hint}</small>}
      {error && <span className={styles.error}>{error}</span>}
    </div>
  );
}
