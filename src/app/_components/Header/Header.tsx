'use client';
import { useState, useEffect, ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import Navbar from '@components/Navbar/Navbar';
import styles from './Header.module.css';

export default function Header({ topBar }: { topBar: ReactNode }) {
    const [isScrolled, setIsScrolled] = useState(false);
    const pathname = usePathname();

    useEffect(() => {
        const handleScroll = () => {
            if (window.scrollY > 50) {
                setIsScrolled(true);
            } else {
                setIsScrolled(false);
            }
        };
        handleScroll();
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const isHome = pathname === '/';
    const isTransparent = isHome && !isScrolled;

    return (
        <header className={`${styles.container} ${isScrolled ? styles.scrolled : ''} ${isTransparent ? styles.transparent : ''}`}>
            {topBar}
            <Navbar isSmaller={isScrolled} isTransparent={isTransparent} />
        </header>
    );
}