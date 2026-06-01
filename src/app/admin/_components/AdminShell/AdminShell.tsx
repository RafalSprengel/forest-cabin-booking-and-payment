import type { ReactNode } from 'react';
import styles from './AdminShell.module.css';

interface AdminShellProps {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}

export default function AdminShell({ title, description, children, className }: AdminShellProps) {
  return (
    <div className={`${styles.container} ${className ?? ''}`}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <div>
            <h1>{title}</h1>
            {description && <p className={styles.description}>{description}</p>}
          </div>
        </div>
      </header>
      <main className={styles.content}>{children}</main>
    </div>
  );
}
