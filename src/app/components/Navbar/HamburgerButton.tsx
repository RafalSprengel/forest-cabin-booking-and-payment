import React from 'react';
import styles from './HamburgerButton.module.css';

interface HamburgerButtonProps {
  isOpen: boolean;
  onClick: () => void;
  className?: string;
}

const HamburgerButton: React.FC<HamburgerButtonProps> = ({ isOpen, onClick, className }) => {
  return (
    <button
      className={`${styles.hamburger} ${isOpen ? styles.isOpen : ''} ${className}`}
      onClick={onClick}
      aria-label="Toggle menu"
    >
      <div className={styles.bar}></div>
      <div className={styles.bar}></div>
      <div className={styles.bar}></div>
    </button>
  );
};

export default HamburgerButton;
