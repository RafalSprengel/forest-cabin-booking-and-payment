'use client';

import { motion } from "framer-motion";
import styles from './Services.module.css';

interface PriceItem {
    description: string;
    amount: string;
}

interface ServicesClientProps {
    childrenFreeAge: number | null;
    weekdayRates: PriceItem[];
    weekendRates: PriceItem[];
}

export default function ServicesClient({ childrenFreeAge, weekdayRates, weekendRates }: ServicesClientProps) {



    const elementsVariants = {
        hidden: { opacity: 0, y: 30 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeIn' as any } },
    };

    return (
        <div
            className={styles.grid}
        >
            <motion.div
                variants={elementsVariants as any}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.25 }}
                className={styles.equipment + ' ' + styles.gridFirstRow}
            >
                <h3>Wyposażenie każdego domku:</h3>
                <ul className={styles.equipmentList}>
                    <li>Kuchenka indukcyjna z piekarnikiem</li>
                    <li>Lodówka</li>
                    <li>Zmywarka</li>
                    <li>Zastawa kuchenna, garnki, patelnie, toster</li>
                    <li>Pralka</li>
                    <li>TV i WiFi</li>
                    <li>Stół dla 6 osób i rozkładana 2-osobowa kanapa w salonie</li>
                    <li>Klimatyzacja</li>
                    <li>Suszarka do włosów i ubrań</li>
                    <li>Ręczniki</li>
                    <li>Kosmetyki i środki higieniczne</li>
                    <li>Odkurzacz</li>
                    <li>Kawa i herbata</li>
                </ul>
            </motion.div>
            <motion.div
                variants={elementsVariants as any}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.25 }}
                id="pricing" className={`${styles.card} ${styles.pricingCard}`}
            >
                <h3>Cennik za dobę:</h3>
                <div className={styles.priceGroup}>
                    <h4>W tygodniu</h4>
                    {weekdayRates.map((rate, index) => (
                        <div key={index} className={styles.priceRow}>
                            <span>{rate.description}</span>
                            <strong>{rate.amount}</strong>
                        </div>
                    ))}
                </div>
                <div className={styles.priceGroup}>
                    <h4>Weekendy</h4>
                    {weekendRates.map((rate, index) => (
                        <div key={index} className={styles.priceRow}>
                            <span>{rate.description}</span>
                            <strong>{rate.amount}</strong>
                        </div>
                    ))}
                </div>
                {childrenFreeAge !== null &&
                    <div className={styles.note}>* Dzieci do {childrenFreeAge} roku życia bezpłatnie.</div>
                }
                <div className={styles.note}>** Cennik obowiązuje poza sezonem wysokim.</div>
                <div className={styles.note}>
                    <a href="/terms-and-conditions" className={styles.link}>
                        Regulamin obiektu &raquo;
                    </a>
                </div>
            </motion.div>
            <motion.div
                variants={elementsVariants as any}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.25 }}
                className={`${styles.card} ${styles.featuresCard}`}
            >
                <h3>Główne atrakcje:</h3>
                <ul className={styles.features}>
                    <li>Chata biesiadna z sauną i jacuzzi oraz dwoma dużymi stołami</li>
                    <li>Sauna 4-5 osobowa Infrared</li>
                    <li>Jacuzzi ogrzewane drewnem (w cenie)</li>
                    <li>Pełne wyposażenie i klimatyzacja</li>
                    <li>Hamaki i strefa relaksu</li>
                    <li>Grill do dyspozycji</li>
                    <li>Plac zabaw dla dzieci</li>
                    <li>Trampolina</li>
                    <li>Miejsce na ognisko</li>
                    <li>Teren ogrodzony</li>
                </ul>
            </motion.div>
        </div>
    );
}