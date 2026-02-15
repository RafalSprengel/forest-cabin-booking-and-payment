'use client';

import styles from './QuantityPicker.module.css';

interface QuantityPickerProps {
    label: string;
    value: number;
    onIncrement: () => void;
    onDecrement: () => void;
    min?: number;
    max?: number;
}

export default function QuantityPicker({
    label,
    value,
    onIncrement,
    onDecrement,
    min = 0,
    max = 10
}: QuantityPickerProps) {
    return (
        <div className={styles.container}>
            <span className={styles.label}>{label}</span>
            <div className={styles.controls}>
                <button
                    type="button"
                    className={styles.button}
                    onClick={onDecrement}
                    disabled={value <= min}
                >
                    -
                </button>
                <span className={styles.value}>{value}</span>
                <button
                    type="button"
                    className={styles.button}
                    onClick={onIncrement}
                    disabled={value >= max}
                >
                    +
                </button>
            </div>
        </div>
    );
}