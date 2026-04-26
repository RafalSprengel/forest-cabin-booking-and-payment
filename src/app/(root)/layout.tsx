import Header from '@components/Header/Header';
import Footer from '@components/Footer/Footer';
import styles from './layout.module.css';

export default function ClientLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <>
            <Header />
            <div className={styles.shell}>
                <main className={styles.main}>{children}</main>
                <Footer />
            </div>
        </>
    );
}