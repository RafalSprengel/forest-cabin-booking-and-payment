import styles from './Services.module.css';

interface PriceItem {
    description: string;
    amount: string;
}

export default function Services() {
    const weekdayRates: PriceItem[] = [
        { description: '2-3 osoby', amount: '300 zł' },
        { description: '4-6 osób', amount: '400 zł' },
        { description: 'Dostawka', amount: '+100 zł' }
    ];

    const weekendRates: PriceItem[] = [
        { description: '2-3 osoby', amount: '400 zł' },
        { description: '4-5 osób', amount: '500 zł' },
        { description: 'Dostawka', amount: '+100 zł' }
    ];

    return (
        <section id="services" className={styles.section}>
            <div className={styles.container}>
                <header className={styles.header}>
                    <h2>Nasza Oferta</h2>
                    <div className={styles.introText}>
                        <p>
                            Oferujemy dwa przytulne domki o powierzchni 35 m² każdy. Każdy domek komfortowo mieści 6 osób 
                            (z możliwością 2 dodatkowych dostawek). Częścią wspólną dla obu obiektów jest zamknięta altana, 
                            wyposażona w 4-osobową saunę infrared oraz jacuzzi ogrzewane drewnem (drewno wliczone w cenę).
                        </p>
                        <p>
                            Na tarasie każdego domku znajduje się grill oraz stół. Do dyspozycji gości oddajemy również 
                            plac zabaw dla dzieci wyposażony w huśtawkę, trampolinę, zjeżdżalnię oraz hamaki. 
                            Wnętrze każdego domku obejmuje aneks kuchenny, łazienkę oraz dwa pokoje na poddaszu: 
                            jeden z łóżkiem małżeńskim, drugi z dwoma łóżkami pojedynczymi.
                        </p>
                    </div>
                    
                    <div className={styles.equipment}>
                        <h3>Wyposażenie każdego domku:</h3>
                        <ul className={styles.equipmentList}>
                            <li>Lodówka, piekarnik oraz pralka</li>
                            <li>Stół dla 6 osób i rozkładana 2-osobowa kanapa</li>
                            <li>Klimatyzacja</li>
                            <li>Suszarka do włosów i ubrań</li>
                            <li>Odkurzacz oraz mop</li>
                            <li>Kosmetyki i środki higieniczne</li>
                        </ul>
                    </div>
                </header>

                <div className={styles.grid}>
                    <div className={styles.card}>
                        <h3>Cennik za dobę</h3>
                        <div className={styles.priceGroup}>
                            <h4>W tygodniu:</h4>
                            {weekdayRates.map((rate, index) => (
                                <div key={index} className={styles.priceRow}>
                                    <span>{rate.description}</span>
                                    <strong>{rate.amount}</strong>
                                </div>
                            ))}
                        </div>
                        <div className={styles.priceGroup}>
                            <h4>Weekendy:</h4>
                            {weekendRates.map((rate, index) => (
                                <div key={index} className={styles.priceRow}>
                                    <span>{rate.description}</span>
                                    <strong>{rate.amount}</strong>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className={styles.card}>
                        <h3>Główne Atrakcje</h3>
                        <ul className={styles.features}>
                            <li>Sauna 4-osobowa Infrared</li>
                            <li>Jacuzzi ogrzewane drewnem (w cenie)</li>
                            <li>Plac zabaw dla dzieci</li>
                            <li>Pełne wyposażenie i klimatyzacja</li>
                            <li>Hamaki i strefa relaksu</li>
                        </ul>
                    </div>
                </div>
            </div>
        </section>
    );
}