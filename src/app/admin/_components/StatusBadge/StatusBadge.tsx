import styles from './StatusBadge.module.css';

type BadgeVariant = 'active' | 'inactive' | 'confirmed' | 'pending' | 'failed' | 'cancelled' | 'blocked' | 'info';

interface Props {
  text: string;
  variant: BadgeVariant;
}

export default function StatusBadge({ text, variant }: Props) {
  return (
    <span className={`${styles.badge} ${styles[variant]}`}>
      {text}
    </span>
  );
}
