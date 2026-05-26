import React, { forwardRef } from 'react';
import styles from './HamburgerButton.module.css';

interface HamburgerButtonProps {
  isOpen: boolean;
  isSmaller: boolean;
  isTransparent?: boolean;
  onClick: () => void;
  className?: string;
}

const HamburgerButton = forwardRef<HTMLButtonElement, HamburgerButtonProps>(
  ({ isOpen, isSmaller, isTransparent, onClick, className }, ref) => {
    const handleOnclick = (e: React.MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation();
      onClick();
    };

    return (
      <button
        className={`${styles.hamburger} ${isOpen ? styles.isOpen : ''} ${isTransparent ? styles.transparentHamburger : ''} ${className}`}
        onClick={handleOnclick}
        aria-label="Toggle menu"
        ref={ref}
      >
        <div className={`${styles.bar} ${isSmaller ? styles.smaller : ''}`}></div>
        <div className={`${styles.bar} ${isSmaller ? styles.smaller : ''}`}></div>
        <div className={`${styles.bar} ${isSmaller ? styles.smaller : ''}`}></div>
      </button>
    );
  }
);

HamburgerButton.displayName = 'HamburgerButton';

export default HamburgerButton;