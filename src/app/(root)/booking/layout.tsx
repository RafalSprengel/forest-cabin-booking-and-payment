import BookingStepper from './BookingStepper';
import styles from './layout.module.css';

export default function BookingLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <>
            <BookingStepper />
            <div className={styles.content}>{children}</div>
        </>
    );
}