'use client'

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMapMarkerAlt, faPhone } from '@fortawesome/free-solid-svg-icons';
import styles from './Contact.module.css';
import ContactForm from './ContactForm';
import { SITE_CONFIG } from '@/config/site';

export default function Contact() {
  const lat = 54.157354;
  const lng = 18.241247;


  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;

  return (
    <section id="contact" className={styles.section}>
      <div className={styles.mainContainer}>
        <h2 className={styles.title}>Kontakt</h2>
        <div className={styles.flexWrapper}>
          <div className={styles.infoColumn}>
            <div className={styles.details}>
              <p style={{ fontWeight: 700, marginBottom: '10px' }}>Wilcze Chatki</p>
              
              <a 
                href={mapsUrl}
                target="_blank" 
                rel="noopener noreferrer"
                className={styles.addressLink}
              >
                <p>83-424 Szumleś Królewski 9A</p>
                <p>Kaszuby, woj. pomorskie</p>
                <div className={styles.mapHintWrapper}>
                  <FontAwesomeIcon icon={faMapMarkerAlt} className={styles.mapIcon} />
                  <small className={styles.mapHint}>Kliknij, aby otworzyć mapę</small>
                </div>
              </a>

              <p className={styles.contactItem}>
                <FontAwesomeIcon icon={faPhone} className={styles.detailIcon} />
                <span>tel: <a href={`tel:${SITE_CONFIG.phoneHref}`} className={styles.contactLink}>{SITE_CONFIG.phoneDisplay}</a></span>
              </p>
              
              {/* <p className={styles.contactItem}>
                <FontAwesomeIcon icon={faEnvelope} className={styles.detailIcon} />
                <span>e-mail: <a href="mailto:kontakt@wilczechatki.pl" className={styles.contactLink}>kontakt@wilczechatki.pl</a></span>
              </p> */}
            </div>

            <div className={styles.payment}>
              <h3>Dane do przelewu:</h3>
              <p>Numer konta (PKO BP):</p>
              <p style={{ fontWeight: 600 }}>{SITE_CONFIG.bankAccountNumber}</p>
            </div>
          </div>

          <div className={styles.formColumn}>
            <ContactForm />
          </div>
        </div>
      </div>
    </section>
  );
}