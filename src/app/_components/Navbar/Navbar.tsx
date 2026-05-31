'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import styles from './Navbar.module.css';
import Image from 'next/image';
import HamburgerButton from './HamburgerButton';

export default function Navbar({isSmaller, isTransparent}: {isSmaller: boolean; isTransparent?: boolean}) {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const mobileMenuRef = useRef<HTMLDivElement>(null);
    const hamburgerRef = useRef<HTMLButtonElement>(null);

    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen);
    };

    const handleClickOutside = (event: MouseEvent) => {
        if (
            mobileMenuRef.current &&
            !mobileMenuRef.current.contains(event.target as Node) &&
            hamburgerRef.current &&
            !hamburgerRef.current.contains(event.target as Node)
        ) {
            setIsMenuOpen(false);
        }
    };
    const closeMobileMenu = () => setIsMenuOpen(false)

    useEffect(() => {
        if (isMenuOpen) {
            window.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            window.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isMenuOpen]);

    const isNavbarTransparent = isTransparent && !isMenuOpen;

    return (
        <nav className={`${styles.navbar} ${isSmaller ? styles.smallerNavbar : ''} ${isNavbarTransparent ? styles.transparentNavbar : ''}`}>
            <div className={styles.container}>
                <Link className={styles.logoWrapper} href="/">
                    <div className={styles.logoImageWrapper}>
                        <Image
                            src="/assets/logo.webp" alt="logo"
                            fill
                            priority
                            className={styles.logoImage}
                        />
                    </div>
                    <span className={styles.logoText}>Wilcze Chatki</span>
                </Link>
                <div className={styles.hamburgerContainer}>
                    <HamburgerButton
                        ref={hamburgerRef}
                        isOpen={isMenuOpen}
                        isSmaller={isSmaller}
                        isTransparent={isNavbarTransparent}
                        onClick={toggleMenu}
                        className={styles.hamburger} />
                </div>
                <div className={styles.mobileMenuOuter + ' ' + (isMenuOpen ? styles.showMobileMenu : '')}>
                    <div className={styles.mobileMenuInner} ref={mobileMenuRef}>
                        <ul className={styles.navLinks}>
                            <li onClick={closeMobileMenu}><Link href="/">Strona główna</Link></li>
                            <li onClick={closeMobileMenu}><Link href="/#services">Oferta</Link></li>
                             <li onClick={closeMobileMenu}><Link href="/#pricing">Cennik</Link></li>
                            <li onClick={closeMobileMenu}><Link href="/gallery">Galeria</Link></li>
                            <li onClick={closeMobileMenu}><Link href="/#attractions">Kaszuby</Link></li>
                            <li onClick={closeMobileMenu}><Link href="/#contact">Kontakt</Link></li>
                            <li onClick={closeMobileMenu}><Link href="/booking">Rezerwacje</Link></li>
                        </ul>
                    </div>
                </div>
            </div>
        </nav>
    );
}