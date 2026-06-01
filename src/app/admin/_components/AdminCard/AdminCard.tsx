import type { ElementType, ReactNode } from 'react';
import styles from './AdminCard.module.css';

interface Props {
  title?: string;
  badge?: string | number;
  children: ReactNode;
  className?: string;
  as?: ElementType;
}

export default function AdminCard({ title, badge, children, className, as: Tag = 'section' }: Props) {
  const hasBadge = badge !== undefined && badge !== null;
  const hasHeader = title || hasBadge;

  return (
    <Tag className={`${styles.card}${className ? ` ${className}` : ''}`}>
      {hasHeader && (
        <div className={styles.cardHeader}>
          {title && <h2>{title}</h2>}
          {hasBadge && <span className={styles.badge}>{badge}</span>}
        </div>
      )}
      {children}
    </Tag>
  );
}
